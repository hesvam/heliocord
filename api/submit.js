
export const config = {
  api: {
    bodyParser: false,
  },
};

// =========================================
// HELIOCORD — MULTI SERVICE FORM API
// Native multipart parsing + Telegram
// No external packages required
// =========================================

const MAX_REQUEST_SIZE = 4 * 1024 * 1024; // 4 MB
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;   // 4 MB

// =========================================
// 1. READ REQUEST BODY
// =========================================

async function readRequestBody(req) {
  const chunks = [];
  let totalSize = 0;

  for await (const chunk of req) {
    totalSize += chunk.length;

    if (totalSize > MAX_REQUEST_SIZE) {
      const error = new Error("حجم الطلب أكبر من المسموح.");
      error.statusCode = 413;
      throw error;
    }

    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

// =========================================
// 2. PARSE MULTIPART FORM DATA
// =========================================

async function parseMultipart(req) {
  const contentType = req.headers["content-type"] || "";

  const boundaryMatch = contentType.match(
    /multipart\/form-data;\s*boundary=(?:"([^"]+)"|([^;]+))/i
  );

  if (!boundaryMatch) {
    const error = new Error("صيغة البيانات المرسلة غير صحيحة.");
    error.statusCode = 400;
    throw error;
  }

  const boundary = boundaryMatch[1] || boundaryMatch[2].trim();
  const body = await readRequestBody(req);

  const delimiter = Buffer.from(`--${boundary}`);
  const separator = Buffer.from("\r\n\r\n");
  const nextDelimiter = Buffer.concat([
    Buffer.from("\r\n"),
    delimiter,
  ]);

  const fields = {};
  let logoImage = null;
  let position = body.indexOf(delimiter);

  while (position !== -1) {
    position += delimiter.length;

    // نهاية البيانات
    if (
      body.subarray(position, position + 2).toString() === "--"
    ) {
      break;
    }

    // تخطي CRLF
    if (body.subarray(position, position + 2).toString() === "\r\n") {
      position += 2;
    }

    const headerEnd = body.indexOf(separator, position);

    if (headerEnd === -1) break;

    const headers = body
      .subarray(position, headerEnd)
      .toString("utf8");

    const dataStart = headerEnd + separator.length;
    const dataEnd = body.indexOf(nextDelimiter, dataStart);

    if (dataEnd === -1) break;

    const data = body.subarray(dataStart, dataEnd);

    const disposition = headers.match(
      /content-disposition:\s*form-data;([^\r\n]+)/i
    )?.[1] || "";

    const name = disposition.match(
      /(?:^|;)\s*name="([^"]*)"/i
    )?.[1];

    const filename = disposition.match(
      /(?:^|;)\s*filename="([^"]*)"/i
    )?.[1];

    const partContentType = headers.match(
      /content-type:\s*([^\r\n]+)/i
    )?.[1]?.trim().toLowerCase();

    if (name === "logoImage" && filename) {
      logoImage = {
        filename: filename.replace(/[\r\n]/g, "").slice(0, 150),
        contentType: partContentType || "",
        data: Buffer.from(data),
        size: data.length,
      };
    } else if (name) {
      fields[name] = data.toString("utf8");
    }

    position = dataEnd + 2;
  }

  return { fields, logoImage };
}

// =========================================
// 3. TELEGRAM API HELPER
// =========================================

async function telegramRequest(token, method, formData) {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      body: formData,
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.ok) {
    console.error(`Telegram ${method} error:`, result);
    throw new Error(`Telegram ${method} delivery failed.`);
  }

  return result;
}

// =========================================
// 4. MAIN HANDLER
// =========================================

export default async function handler(req, res) {
  // METHOD VALIDATION

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method Not Allowed",
    });
  }

  // ENVIRONMENT VARIABLES

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({
      success: false,
      message: "حدثت مشكلة غير متوقعة. يرجى المحاولة لاحقًا.",
    });
  }

  try {
    // REQUEST DATA

    const { fields, logoImage } = await parseMultipart(req);

    const referenceId = fields.referenceId;
    const service = fields.service;
    const servicePrice = Number(fields.servicePrice);

    let payload;

    try {
      payload = JSON.parse(fields.payload || "");
    } catch {
      return res.status(400).json({
        success: false,
        message: "بيانات الطلب غير مكتملة أو غير صحيحة.",
      });
    }

    // DATA VALIDATION

    if (
      typeof referenceId !== "string" ||
      !/^[A-Za-z0-9-]{1,80}$/.test(referenceId) ||

      typeof service !== "string" ||
      !service.trim() ||
      service.length > 100 ||

      !Number.isFinite(servicePrice) ||
      servicePrice <= 0 ||
      servicePrice > 1000000 ||

      !Array.isArray(payload) ||
      payload.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "بيانات الطلب غير مكتملة أو غير صحيحة.",
      });
    }

    // IMAGE VALIDATION

    if (logoImage) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
      ];

      if (!allowedTypes.includes(logoImage.contentType)) {
        return res.status(400).json({
          success: false,
          message: "يرجى رفع صورة بصيغة JPG أو PNG.",
        });
      }

      if (
        logoImage.size === 0 ||
        logoImage.size > MAX_IMAGE_SIZE
      ) {
        return res.status(413).json({
          success: false,
          message: "حجم الصورة غير مناسب. الحد الأقصى 4 ميجابايت.",
        });
      }
    }

    // SANITIZE PAYLOAD

    const safeItems = payload
      .filter(item =>
        item &&
        typeof item.label === "string" &&
        typeof item.value === "string"
      )
      .map(item => ({
        label: item.label.trim().slice(0, 120),
        value: item.value.trim().slice(0, 2500),
      }))
      .filter(item => item.label && item.value);

    // CUSTOMER FIELD DETECTION

    const customerKeywords = [
      "الاسم بالكامل",
      "اسم العميل",
      "رقم واتساب",
      "رقم الهاتف",
      "البريد الإلكتروني",
      "email",
      "phone",
    ];

    const isCustomerField = label => {
      const normalized = label
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

      return customerKeywords.some(keyword =>
        normalized.includes(keyword)
      );
    };

    const customerItems = safeItems.filter(item =>
      isCustomerField(item.label)
    );

    const projectItems = safeItems.filter(item =>
      !isCustomerField(item.label)
    );

    // FORMAT TELEGRAM SECTIONS

    const formatSection = (title, items) => {
      if (!items.length) return "";

      return [
        `【 ${title} 】`,
        ...items.map(item =>
          `• ${item.label}: ${item.value}`
        ),
      ].join("\n");
    };

    // BUILD TELEGRAM MESSAGE

    const formattedPrice = servicePrice.toLocaleString("en-US");

    const message = [
      "طلب خدمة جديد",
      "HELIOCORD",
      "================================",
      `الخدمة: ${service.trim()}`,
      `السعر المبدئي: ${formattedPrice} ج.م`,
      `رقم الطلب: ${referenceId}`,
      "",
      formatSection("بيانات العميل", customerItems),
      formatSection("تفاصيل الطلب", projectItems),
      "================================",
      "تم استلام الطلب عبر موقع HELIOCORD.",
    ]
      .filter(Boolean)
      .join("\n")
      .trim();

    // MESSAGE LENGTH VALIDATION

    if (message.length > 4000) {
      return res.status(413).json({
        success: false,
        message: "تفاصيل الطلب طويلة جدًا. يرجى اختصار بعض الإجابات.",
      });
    }

    // SEND IMAGE FIRST, IF AVAILABLE

    if (logoImage) {
      const photoForm = new FormData();

      const imageBlob = new Blob(
        [new Uint8Array(logoImage.data)],
        { type: logoImage.contentType }
      );

      photoForm.append("chat_id", chatId);
      photoForm.append(
        "photo",
        imageBlob,
        logoImage.filename || "current-logo"
      );
      photoForm.append(
        "caption",
        `صورة الشعار الحالي\nرقم الطلب: ${referenceId}`
      );

      await telegramRequest(token, "sendPhoto", photoForm);
    }

    // SEND ORDER DETAILS

    const messageForm = new FormData();

    messageForm.append("chat_id", chatId);
    messageForm.append("text", message);
    messageForm.append("disable_web_page_preview", "true");

    await telegramRequest(token, "sendMessage", messageForm);

    // SUCCESS RESPONSE

    return res.status(200).json({
      success: true,
      referenceId,
      message: "تم استلام طلبك بنجاح.",
    });

  } catch (error) {
    console.error("Order submission error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 413
        ? "حجم البيانات أو الصورة أكبر من المسموح."
        : "حدثت مشكلة أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.",
    });
  }
}
