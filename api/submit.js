
export default async function handler(req, res) {
  // =========================================
  // 1. METHOD VALIDATION
  // =========================================

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method Not Allowed",
    });
  }

  // =========================================
  // 2. ENVIRONMENT VARIABLES
  // =========================================

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({
      success: false,
      message: "حدثت مشكلة غير متوقعة. يرجى المحاولة لاحقًا.",
    });
  }

  try {
    // =========================================
    // 3. REQUEST DATA
    // =========================================

    const {
      referenceId,
      service,
      servicePrice,
      payload,
    } = req.body || {};

    // =========================================
    // 4. DATA VALIDATION
    // =========================================

    if (
      typeof referenceId !== "string" ||
      !/^[A-Za-z0-9-]{1,80}$/.test(referenceId) ||

      typeof service !== "string" ||
      !service.trim() ||
      service.length > 100 ||

      typeof servicePrice !== "number" ||
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

    // =========================================
    // 5. SANITIZE PAYLOAD
    // =========================================

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

    // =========================================
    // 6. CUSTOMER FIELD DETECTION
    // =========================================

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

    // =========================================
    // 7. FORMAT TELEGRAM SECTIONS
    // =========================================

    const formatSection = (title, items) => {
      if (!items.length) return "";

      return [
        `【 ${title} 】`,
        ...items.map(item =>
          `• ${item.label}: ${item.value}`
        ),
      ].join("\n");
    };

    // =========================================
    // 8. FORMAT SERVICE PRICE
    // =========================================

    const formattedPrice = servicePrice.toLocaleString("en-US");

    // =========================================
    // 9. BUILD TELEGRAM MESSAGE
    // =========================================

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

    // =========================================
    // 10. TELEGRAM MESSAGE LENGTH VALIDATION
    // =========================================

    if (message.length > 4000) {
      return res.status(413).json({
        success: false,
        message: "تفاصيل الطلب طويلة جدًا. يرجى اختصار بعض الإجابات.",
      });
    }

    // =========================================
    // 11. SEND TELEGRAM MESSAGE
    // =========================================

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          disable_web_page_preview: true,
        }),
      }
    );

    const telegramResult = await telegramResponse.json();

    // =========================================
    // 12. TELEGRAM RESPONSE VALIDATION
    // =========================================

    if (!telegramResponse.ok || !telegramResult.ok) {
      console.error("Telegram API error:", telegramResult);

      throw new Error("Telegram message delivery failed.");
    }

    // =========================================
    // 13. SUCCESS RESPONSE
    // =========================================

    return res.status(200).json({
      success: true,
      referenceId,
      message: "تم استلام طلبك بنجاح.",
    });

  } catch (error) {
    // =========================================
    // 14. ERROR HANDLING
    // =========================================

    console.error("Order submission error:", error);

    return res.status(500).json({
      success: false,
      message: "حدثت مشكلة أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.",
    });
  }
}
