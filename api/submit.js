
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
      message: "حدثت مشكلة غير متوقعة. يرجى المحاولة لاحقًا.",
    });
  }

  try {
    const { referenceId, payload } = req.body || {};

    if (
      !referenceId ||
      !/^[A-Za-z0-9-]{1,80}$/.test(referenceId) ||
      !Array.isArray(payload) ||
      payload.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "بيانات الطلب غير مكتملة أو غير صحيحة.",
      });
    }

    const customerKeywords = [
      "الاسم بالكامل",
      "اسم العميل",
      "رقم واتساب",
      "رقم الهاتف",
      "البريد الإلكتروني",
      "email",
      "phone",
    ];

    const normalize = (value) =>
      String(value || "").trim().toLowerCase();

    const isCustomerField = (item) => {
      const label = normalize(item.label);
      return customerKeywords.some((keyword) =>
        label.includes(normalize(keyword))
      );
    };

    const formatSection = (title, items) => {
      if (!items.length) return "";

      return [
        title,
        "--------------------------------",
        ...items.map(
          (item) =>
            `${String(item.label).trim()}\n${String(item.value).trim()}`
        ),
        "",
      ].join("\n");
    };

    const customerItems = payload.filter(isCustomerField);
    const projectItems = payload.filter((item) => !isCustomerField(item));

    const message = [
      "طلب تصميم شعار جديد",
      "HELIOCORD",
      "================================",
      `رقم الطلب: ${referenceId}`,
      "",
      formatSection("بيانات العميل", customerItems),
      formatSection("تفاصيل المشروع ومتطلبات التصميم", projectItems),
      "================================",
      "تم استلام الطلب عبر موقع HELIOCORD.",
    ]
      .filter(Boolean)
      .join("\n")
      .trim();

    if (message.length > 4000) {
      return res.status(413).json({
        success: false,
        message: "تفاصيل الطلب طويلة جدًا. يرجى اختصار بعض الإجابات.",
      });
    }

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
        }),
      }
    );

    const result = await telegramResponse.json();

    if (!telegramResponse.ok || !result.ok) {
      console.error("Telegram sendMessage failed:", result);
      throw new Error("Telegram message delivery failed.");
    }

    return res.status(200).json({
      success: true,
      referenceId,
      message: "تم استلام طلبك بنجاح.",
    });
  } catch (error) {
    console.error("Brief submission error:", error);

    return res.status(500).json({
      success: false,
      message:
        "نعتذر، لم نتمكن من استلام طلبك. يرجى المحاولة مرة أخرى.",
    });
  }
}
