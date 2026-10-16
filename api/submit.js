
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method Not Allowed",
    });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({
      success: false,
      message: "إعدادات Telegram غير مكتملة في Vercel.",
    });
  }

  try {
    const contentType = req.headers["content-type"] || "";

    if (!contentType.includes("multipart/form-data")) {
      return res.status(400).json({
        success: false,
        message: "نوع الطلب غير صحيح.",
      });
    }

    const boundary = getBoundary(contentType);

    if (!boundary) {
      return res.status(400).json({
        success: false,
        message: "تعذر قراءة بيانات الطلب.",
      });
    }

    const body = await readRequestBody(req);
    const form = parseMultipart(body, boundary);

    const referenceId = getField(form, "referenceId");
    const payloadText = getField(form, "payload");
    const pdf = form.files.report;

    if (!referenceId || !/^[A-Za-z0-9-]{1,80}$/.test(referenceId)) {
      return res.status(400).json({
        success: false,
        message: "رقم المرجع غير صالح.",
      });
    }

    if (!payloadText || !pdf || !pdf.data.length) {
      return res.status(400).json({
        success: false,
        message: "بيانات البريف أو ملف PDF غير موجودة.",
      });
    }

    if (pdf.data.length > 7 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        message: "ملف PDF أكبر من الحجم المسموح.",
      });
    }

    if (pdf.filename && !/\.pdf$/i.test(pdf.filename)) {
      return res.status(400).json({
        success: false,
        message: "الملف المرفق يجب أن يكون PDF.",
      });
    }

    // التأكد من أن الملف يبدأ بتوقيع PDF الصحيح.
    if (pdf.data.subarray(0, 5).toString() !== "%PDF-") {
      return res.status(400).json({
        success: false,
        message: "ملف PDF غير صالح.",
      });
    }

    let payload;

    try {
      payload = JSON.parse(payloadText);
    } catch {
      return res.status(400).json({
        success: false,
        message: "تعذر قراءة بيانات البريف.",
      });
    }

    if (!Array.isArray(payload) || payload.length > 100) {
      return res.status(400).json({
        success: false,
        message: "تنسيق البيانات غير صالح.",
      });
    }

    // رسالة مختصرة فقط، بدون تفاصيل إضافية.
    const message = [
      "طلب تصميم شعار جديد",
      `رقم المرجع: ${referenceId}`,
    ].join("\n");

    // إرسال الرسالة إلى Telegram.
    await telegramRequest(token, "sendMessage", {
      chat_id: chatId,
      text: message,
    });

    // إرسال ملف PDF بدون Caption إضافي.
    const telegramForm = new FormData();

    telegramForm.append("chat_id", chatId);
    telegramForm.append(
      "document",
      new Blob([pdf.data], {
        type: "application/pdf",
      }),
      `Logo-Brief-${referenceId}.pdf`,
    );

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendDocument`,
      {
        method: "POST",
        body: telegramForm,
      },
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      console.error("Telegram sendDocument failed:", result);

      throw new Error("فشل إرسال ملف PDF إلى Telegram.");
    }

    return res.status(200).json({
      success: true,
      referenceId,
      message: "تم إرسال البريف بنجاح.",
    });
  } catch (error) {
    console.error("Brief submission error:", error);

    return res.status(500).json({
      success: false,
      message: "تعذر إرسال البريف. حاول مرة أخرى.",
    });
  }
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const maxSize = 8 * 1024 * 1024;
    let settled = false;

    req.on("data", (chunk) => {
      if (settled) return;

      size += chunk.length;

      if (size > maxSize) {
        settled = true;
        reject(new Error("Request too large."));
        return;
      }

      chunks.push(Buffer.from(chunk));
    });

    req.on("end", () => {
      if (settled) return;

      settled = true;
      resolve(Buffer.concat(chunks));
    });

    req.on("error", (error) => {
      if (settled) return;

      settled = true;
      reject(error);
    });
  });
}

function getBoundary(contentType) {
  const match = contentType.match(
    /boundary=(?:"([^"]+)"|([^;]+))/i,
  );

  return match ? (match[1] || match[2]).trim() : null;
}

function parseMultipart(buffer, boundary) {
  const result = {
    fields: {},
    files: {},
  };

  const delimiter = Buffer.from(`--${boundary}`);
  let position = buffer.indexOf(delimiter);

  while (position !== -1) {
    position += delimiter.length;

    // نهاية بيانات multipart.
    if (
      buffer[position] === 45 &&
      buffer[position + 1] === 45
    ) {
      break;
    }

    if (
      buffer[position] === 13 &&
      buffer[position + 1] === 10
    ) {
      position += 2;
    }

    const headerEnd = buffer.indexOf(
      Buffer.from("\r\n\r\n"),
      position,
    );

    if (headerEnd === -1) break;

    const headers = parsePartHeaders(
      buffer.subarray(position, headerEnd),
    );

    const dataStart = headerEnd + 4;
    const nextBoundary = buffer.indexOf(
      delimiter,
      dataStart,
    );

    if (nextBoundary === -1) break;

    let dataEnd = nextBoundary;

    if (
      dataEnd >= 2 &&
      buffer[dataEnd - 2] === 13 &&
      buffer[dataEnd - 1] === 10
    ) {
      dataEnd -= 2;
    }

    const data = buffer.subarray(dataStart, dataEnd);
    const disposition = headers["content-disposition"] || "";

    const nameMatch = disposition.match(/name="([^"]+)"/i);
    const filenameMatch = disposition.match(/filename="([^"]*)"/i);

    if (nameMatch) {
      const name = nameMatch[1];

      if (filenameMatch) {
        result.files[name] = {
          filename: filenameMatch[1],
          contentType:
            headers["content-type"] ||
            "application/octet-stream",
          data: Buffer.from(data),
        };
      } else {
        result.fields[name] = data.toString("utf8");
      }
    }

    position = nextBoundary;
  }

  return result;
}

function parsePartHeaders(buffer) {
  const headers = {};

  for (const line of buffer.toString("utf8").split("\r\n")) {
    const index = line.indexOf(":");

    if (index === -1) continue;

    headers[line.slice(0, index).trim().toLowerCase()] =
      line.slice(index + 1).trim();
  }

  return headers;
}

function getField(form, name) {
  return String(form.fields[name] ?? "").trim();
}

async function telegramRequest(token, method, body) {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    console.error(`Telegram ${method} failed:`, result);
    throw new Error(`Telegram ${method} request failed.`);
  }

  return result;
}
