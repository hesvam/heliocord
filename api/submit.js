export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_REQUEST_SIZE = 4 * 1024 * 1024;
const MAX_PDF_SIZE = 3.5 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      success: false,
      message: "Method Not Allowed",
    });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Safe diagnostics: never log secret values.
  console.log("Telegram environment check:", {
    hasToken: Boolean(token?.trim()),
    hasChatId: Boolean(chatId?.trim()),
    environment: process.env.VERCEL_ENV || "unknown",
  });

  if (!token?.trim() || !chatId?.trim()) {
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

    // Read the request with a strict size limit.
    const body = await readRequestBody(req, MAX_REQUEST_SIZE);

    const form = parseMultipart(body, boundary);

    const referenceId = getField(form, "referenceId");
    const payloadText = getField(form, "payload");
    const pdf = form.files.report;

    if (
      !referenceId ||
      !/^[A-Za-z0-9-]{1,80}$/.test(referenceId)
    ) {
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

    if (pdf.data.length > MAX_PDF_SIZE) {
      return res.status(413).json({
        success: false,
        message: "حجم ملف PDF أكبر من الحد المسموح.",
      });
    }

    if (pdf.filename && !/\.pdf$/i.test(pdf.filename)) {
      return res.status(400).json({
        success: false,
        message: "الملف المرفق يجب أن يكون PDF.",
      });
    }

    if (
      pdf.data.subarray(0, 5).toString("ascii") !== "%PDF-"
    ) {
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

    if (
      !Array.isArray(payload) ||
      payload.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "تنسيق البيانات غير صالح.",
      });
    }

    const message = buildTelegramMessage(
      payload,
      referenceId
    );

    // 1. Send the brief summary to Telegram.
    await telegramRequest(token, "sendMessage", {
      chat_id: chatId,
      text: message,
    });

    // 2. Send the PDF document.
    const telegramForm = new FormData();

    telegramForm.append("chat_id", chatId);

    telegramForm.append(
      "document",
      new Blob([pdf.data], {
        type: "application/pdf",
      }),
      `Logo-Brief-${referenceId}.pdf`
    );

    telegramForm.append(
      "caption",
      `Logo Design Brief | ${referenceId}`
    );

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendDocument`,
      {
        method: "POST",
        body: telegramForm,
      }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      console.error("Telegram document error:", {
        status: response.status,
        description: result.description,
      });

      throw new Error("PDF delivery failed.");
    }

    return res.status(200).json({
      success: true,
      referenceId,
      message: "تم إرسال البريف بنجاح.",
    });
  } catch (error) {
    console.error("Brief submission error:", {
      message: error.message,
      code: error.code,
    });

    const status =
      error.statusCode === 413 ? 413 : 500;

    return res.status(status).json({
      success: false,
      message:
        status === 413
          ? "حجم الطلب كبير جدًا. قلل حجم ملف PDF وحاول مرة أخرى."
          : "تعذر إرسال البريف. حاول مرة أخرى.",
    });
  }
}

/* Read incoming request safely */

function readRequestBody(req, maxSize) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    let settled = false;

    req.on("data", (chunk) => {
      size += chunk.length;

      if (size > maxSize) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }

      if (!tooLarge) {
        chunks.push(Buffer.from(chunk));
      }
    });

    req.on("end", () => {
      if (settled) return;
      settled = true;

      if (tooLarge) {
        const error = new Error("Request too large.");
        error.statusCode = 413;
        reject(error);
        return;
      }

      resolve(Buffer.concat(chunks));
    });

    req.on("error", (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });
  });
}

/* Extract multipart boundary */

function getBoundary(contentType) {
  const match = contentType.match(
    /boundary=(?:"([^"]+)"|([^;]+))/i
  );

  return match
    ? (match[1] || match[2]).trim()
    : null;
}

/* Parse multipart fields and files */

function parseMultipart(buffer, boundary) {
  const result = {
    fields: {},
    files: {},
  };

  const delimiter = Buffer.from(`--${boundary}`);
  let position = buffer.indexOf(delimiter);

  while (position !== -1) {
    position += delimiter.length;

    // Final multipart boundary.
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
      position
    );

    if (headerEnd === -1) break;

    const headers = parsePartHeaders(
      buffer.subarray(position, headerEnd)
    );

    const dataStart = headerEnd + 4;
    const nextBoundary = buffer.indexOf(
      delimiter,
      dataStart
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
    const disposition =
      headers["content-disposition"] || "";

    const nameMatch = disposition.match(
      /(?:^|;)\s*name="([^"]+)"/i
    );

    const filenameMatch = disposition.match(
      /(?:^|;)\s*filename="([^"]*)"/i
    );

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

/* Parse part headers */

function parsePartHeaders(buffer) {
  const headers = {};

  for (const line of buffer.toString("utf8").split("\r\n")) {
    const index = line.indexOf(":");

    if (index === -1) continue;

    const name = line.slice(0, index).trim().toLowerCase();
    const value = line.slice(index + 1).trim();

    headers[name] = value;
  }

  return headers;
}

/* Get a text field */

function getField(form, name) {
  return String(form.fields[name] ?? "").trim();
}

/* Build Telegram summary */

function buildTelegramMessage(payload, referenceId) {
  const lines = [
    "🎨 طلب تصميم شعار جديد",
    "",
    `🔖 رقم المرجع: ${referenceId}`,
    "",
  ];

  for (const item of payload) {
    if (
      !item ||
      typeof item.label !== "string" ||
      !["string", "number"].includes(typeof item.value)
    ) {
      continue;
    }

    const label = item.label.slice(0, 150);
    const value = String(item.value).slice(0, 2500);

    lines.push(`${label}: ${value}`);
  }

  const message = lines.join("\n");

  // Telegram message length limit is 4096 characters.
  return message.length > 3900
    ? message.slice(0, 3850) +
        "\n\n[التفاصيل الكاملة في ملف PDF]"
    : message;
}

/* Send Telegram text message */

async function telegramRequest(token, method, body) {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    console.error("Telegram API error:", {
      method,
      status: response.status,
      description: result.description,
    });

    throw new Error("Telegram API request failed.");
  }

  return result;
}
