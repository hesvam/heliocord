const form = document.getElementById("brief-form");
const submitButton = document.getElementById("submit-button");
const submitLabel = document.getElementById("submit-label");
const statusBox = document.getElementById("form-status");

const PDF_REPORT_ID = "pdf-report-render-target";

/* =========================================
   1. HELPERS
========================================= */

function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char],
  );
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ");
}

function getFieldLabel(element) {
  const wrapper = element.closest(".field");

  if (wrapper) {
    const label = wrapper.querySelector("label");

    if (label) {
      return label.innerText.replace(/\s+/g, " ").trim();
    }
  }

  const choice = element.closest(".choice-card, .check-option");

  if (choice) {
    return choice.innerText.replace(/\s+/g, " ").trim();
  }

  const associatedLabel = element.labels?.[0];

  if (associatedLabel) {
    return associatedLabel.innerText.replace(/\s+/g, " ").trim();
  }

  return element.name || element.id || "بيانات إضافية";
}

/* =========================================
   2. COLLECT FORM ANSWERS
========================================= */

function collectAnswers() {
  const answers = [];
  const grouped = new Map();

  const elements = form.querySelectorAll("input, textarea, select");

  for (const element of elements) {
    if (
      element.disabled ||
      ["submit", "button", "reset", "file"].includes(element.type)
    ) {
      continue;
    }

    if (["checkbox", "radio"].includes(element.type) && !element.checked) {
      continue;
    }

    const key = element.name || element.id;

    if (!key) continue;

    let value = String(element.value ?? "").trim();

   if (element.name === "logo_type" && element.type === "radio") {
     value = element.value;
   } else if (element.type === "checkbox" || element.type === "radio") {
     value = getFieldLabel(element);
   }

    if (!value) continue;
   
   const label =
     element.name === "logo_type"
       ? "نوع الشعار"
       : getFieldLabel(element);

    if (grouped.has(key)) {
      const existing = grouped.get(key);
      const existingValues = existing.value.split("، ");

      if (!existingValues.includes(value)) {
        existing.value += `، ${value}`;
      }
    } else {
      const item = { label, value };

      grouped.set(key, item);
      answers.push(item);
    }
  }

  return answers;
}

/* =========================================
   3. REFERENCE NUMBER
========================================= */

function createReferenceId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  let randomPart;

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    randomPart = crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase();
  } else {
    randomPart = Math.random()
      .toString(16)
      .slice(2, 10)
      .padEnd(8, "0")
      .toUpperCase();
  }

  return `HC-${date}-${randomPart}`;
}

/* =========================================
   4. IDENTIFY CUSTOMER INFORMATION
========================================= */

function isCustomerField(item) {
  const label = normalizeText(item.label);

  const customerKeywords = [
    "اسم العميل",
    "اسمك",
    "الاسم",
    "اسم صاحب",
    "اسم البراند",
    "اسم العلامة",
    "اسم الشركه",
    "اسم النشاط",
    "البريد الالكتروني",
    "الايميل",
    "البريد",
    "email",
    "e-mail",
    "phone",
    "رقم الهاتف",
    "رقم الموبايل",
    "رقم التليفون",
    "واتساب",
    "whatsapp",
    "contact",
    "اسم المشروع",
  ];

  return customerKeywords.some((keyword) =>
    label.includes(normalizeText(keyword)),
  );
}

/* =========================================
   5. CREATE PROFESSIONAL REPORT
========================================= */

function createReport(referenceId, answers) {
  const report = document.createElement("div");

  report.id = PDF_REPORT_ID;
  report.dir = "rtl";

  Object.assign(report.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: "760px",
    padding: "28px",
    margin: "0",
    background: "#ffffff",
    color: "#171717",
    fontFamily: "Cairo, Arial, sans-serif",
    fontSize: "12px",
    lineHeight: "1.65",
    boxSizing: "border-box",
    zIndex: "-1",
    opacity: "0",
    pointerEvents: "none",
    overflow: "visible",
  });

   const customerAnswers = answers.filter(isCustomerField);
   
   const logoTypeAnswer = answers.find(
     (item) => item.label === "نوع الشعار"
   );
   
   const otherAnswers = answers.filter(
     (item) => !isCustomerField(item) && item.label !== "نوع الشعار"
   );

  const customerCards = customerAnswers
    .map(
      (item) => `
    <div style="
      padding: 9px 11px;
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      background: #ffffff;
      min-width: 0;
      box-sizing: border-box;
      overflow-wrap: anywhere;
    ">
      <div style="
        font-size: 10px;
        color: #737983;
        margin-bottom: 3px;
      ">${escapeHTML(item.label)}</div>

      <div style="
        font-size: 12px;
        color: #171717;
        font-weight: 700;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      ">${escapeHTML(item.value)}</div>
    </div>
  `,
    )
    .join("");

  const answerCards = otherAnswers
    .map(
      (item, index) => `
    <div style="
      padding: 9px 11px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: #ffffff;
      min-width: 0;
      box-sizing: border-box;
      overflow-wrap: anywhere;
    ">
      <div style="
        display: flex;
        align-items: flex-start;
        gap: 7px;
        margin-bottom: 4px;
      ">
        <span style="
          display: inline-block;
          min-width: 22px;
          padding: 2px 4px;
          background: #171717;
          color: #ffffff;
          border-radius: 4px;
          font-size: 9px;
          text-align: center;
          box-sizing: border-box;
        ">${String(index + 1).padStart(2, "0")}</span>

        <span style="
          font-size: 10px;
          color: #6b7280;
          font-weight: 700;
          overflow-wrap: anywhere;
        ">${escapeHTML(item.label)}</span>
      </div>

      <div style="
        font-size: 11px;
        color: #171717;
        line-height: 1.65;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      ">${escapeHTML(item.value)}</div>
    </div>
  `,
    )
    .join("");

  report.innerHTML = `
    <header style="
      padding-bottom: 13px;
      border-bottom: 2px solid #171717;
      margin-bottom: 14px;
    ">
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        direction: ltr;
      ">
        <div style="
          font-family: Inter, Arial, sans-serif;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #171717;
        ">BRIEF STUDIO</div>

        <div style="
          font-family: Inter, Arial, sans-serif;
          font-size: 9px;
          color: #777777;
          letter-spacing: 1px;
        ">LOGO DESIGN / CLIENT BRIEF</div>
      </div>

      <h1 style="
        font-size: 25px;
        font-weight: 800;
        margin: 12px 0 2px;
        line-height: 1.5;
        color: #171717;
      ">بريف تصميم الشعار</h1>

      <div style="
        font-size: 11px;
        color: #737373;
      ">نموذج بيانات ومتطلبات تصميم الشعار</div>

      <div style="
        margin-top: 11px;
        padding: 9px 12px;
        background: #f3f4f6;
        border: 1px solid #e8e9ec;
        border-radius: 5px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <span style="font-size: 10px; color: #666666;">
          رقم مرجع الطلب
        </span>

        <strong dir="ltr" style="
          font-family: Inter, Arial, sans-serif;
          font-size: 11px;
          color: #171717;
        ">${escapeHTML(referenceId)}</strong>
      </div>
    </header>

    <section style="margin-bottom: 14px;">
      <div style="
        font-size: 13px;
        font-weight: 800;
        margin-bottom: 7px;
        color: #171717;
      ">
        <span style="color: #777777; font-size: 10px;">01 /</span>
        بيانات العميل
      </div>

      <div style="
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px;
      ">
        ${
          customerCards ||
          `<div style="
            grid-column: 1 / -1;
            padding: 9px 11px;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            color: #777777;
            font-size: 10px;
          ">بيانات العميل غير محددة بشكل منفصل. راجع أسماء الحقول في النموذج.</div>`
        }
      </div>
    </section>

    <section>
      <div style="
        font-size: 13px;
        font-weight: 800;
        margin-bottom: 7px;
        color: #171717;
      ">
        <span style="color: #777777; font-size: 10px;">02 /</span>
        تفاصيل ومتطلبات الشعار
      </div>

      <div style="
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px;
      ">
        ${
          answerCards ||
          `<div style="
            padding: 10px;
            border: 1px solid #e5e7eb;
            color: #777777;
          ">لا توجد تفاصيل إضافية.</div>`
        }
      </div>
    </section>

    <footer style="
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #e3e3e3;
      display: flex;
      justify-content: space-between;
      font-family: Inter, Arial, sans-serif;
      font-size: 8px;
      color: #888888;
      direction: ltr;
    ">
      <span>BRIEF STUDIO</span>
      <span>CONFIDENTIAL CLIENT BRIEF</span>
    </footer>
  `;

  document.body.appendChild(report);

  return report;
}

/* =========================================
   6. STATUS MESSAGES
========================================= */

function setStatus(message, success = false) {
  if (!statusBox) return;

  statusBox.textContent = message;
  statusBox.dataset.state = success ? "success" : "error";
}

/* =========================================
   7. WAIT FOR RENDERING
========================================= */

async function waitForRender() {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

/* =========================================
   8. GENERATE ONE-PAGE PDF
========================================= */

async function generatePDF(report) {
  if (
    typeof html2canvas === "undefined" ||
    !window.jspdf ||
    typeof window.jspdf.jsPDF !== "function"
  ) {
    throw new Error("مكتبات إنشاء PDF غير متاحة.");
  }

  await waitForRender();

  /*
   * Capture the report.
   * The cloned report is made visible for html2canvas only.
   */

  const canvas = await html2canvas(report, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: 1000,
    windowHeight: Math.max(window.innerHeight, report.scrollHeight + 100),

    onclone: (clonedDocument) => {
      const clonedReport = clonedDocument.getElementById(PDF_REPORT_ID);

      if (!clonedReport) {
        throw new Error("لم يتم العثور على التقرير للتصوير.");
      }

      Object.assign(clonedReport.style, {
        position: "absolute",
        left: "0",
        top: "0",
        width: "760px",
        height: "auto",
        zIndex: "999999",
        opacity: "1",
        visibility: "visible",
        display: "block",
        overflow: "visible",
        background: "#ffffff",
        color: "#171717",
      });
    },
  });

  if (!canvas || canvas.width < 10 || canvas.height < 10) {
    throw new Error("تعذر التقاط محتوى التقرير.");
  }

  /*
   * Check the entire canvas for non-white pixels.
   */

  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!context) {
    throw new Error("تعذر قراءة صورة التقرير.");
  }

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;

  let visiblePixels = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] < 245 || pixels[i + 1] < 245 || pixels[i + 2] < 245) {
      visiblePixels++;

      if (visiblePixels > 100) break;
    }
  }

  if (visiblePixels <= 100) {
    throw new Error("تم التقاط التقرير كصفحة بيضاء. لم يتم إرسال PDF.");
  }

  /*
   * Create a single A4 page.
   * Scale the entire report to fit without creating extra pages.
   */

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 7;
  const availableWidth = pageWidth - margin * 2;
  const availableHeight = pageHeight - margin * 2;

  const scale = Math.min(
    availableWidth / canvas.width,
    availableHeight / canvas.height,
  );

  const imageWidth = canvas.width * scale;
  const imageHeight = canvas.height * scale;

  const x = (pageWidth - imageWidth) / 2;
  const y = (pageHeight - imageHeight) / 2;

  const imageData = canvas.toDataURL("image/jpeg", 0.98);

  pdf.addImage(
    imageData,
    "JPEG",
    x,
    y,
    imageWidth,
    imageHeight,
    undefined,
    "FAST",
  );

  const pdfBlob = pdf.output("blob");

  if (!(pdfBlob instanceof Blob) || pdfBlob.size < 1000) {
    throw new Error("ملف PDF الناتج فارغ أو غير مكتمل.");
  }

  const signature = new Uint8Array(await pdfBlob.slice(0, 5).arrayBuffer());

  if (String.fromCharCode(...signature) !== "%PDF-") {
    throw new Error("ملف PDF الناتج غير صالح.");
  }

  return pdfBlob;
}

/* =========================================
   9. SUBMIT FORM AND SEND PDF
========================================= */

if (form && submitButton && submitLabel) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (submitButton.disabled) return;

    if (!form.reportValidity()) return;

    if (
      typeof html2canvas === "undefined" ||
      !window.jspdf ||
      typeof window.jspdf.jsPDF !== "function"
    ) {
      setStatus(
        "تعذر تحميل مكتبات PDF. تأكد من تحميل html2canvas وjsPDF قبل app.js.",
      );
      return;
    }

    submitButton.disabled = true;
    submitLabel.textContent = "جاري تجهيز طلبك...";
    setStatus("");

    let report = null;

    try {
      const answers = collectAnswers();
      const referenceId = createReferenceId();

      report = createReport(referenceId, answers);

      const pdfBlob = await generatePDF(report);

      report.remove();
      report = null;

      submitLabel.textContent = "جاري إرسال طلبك...";

      const requestData = new FormData();

      requestData.append("referenceId", referenceId);
      requestData.append("payload", JSON.stringify(answers));

      requestData.append("report", pdfBlob, `Logo-Brief-${referenceId}.pdf`);

      const response = await fetch("/api/submit", {
        method: "POST",
        body: requestData,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.message || "لم نتمكن من إرسال طلبك.");
      }

      /* Send to Telegram only; do not download a local copy. */

      setStatus(`تم إرسال طلبك بنجاح! رقم الطلب: ${referenceId}`, true);

      submitLabel.textContent = "تم إرسال طلبك";
    } catch (error) {
      console.error("Brief submission failed:", error);

      setStatus(
        error instanceof Error && error.message
          ? error.message
          : "حدث خطأ أثناء الإرسال. تحقق من اتصال الإنترنت وحاول مجددًا.",
      );

      submitLabel.textContent = "إعادة محاولة الإرسال";
    } finally {
      report?.remove();

      submitButton.disabled = false;

      if (
        submitLabel.textContent === "جاري إرسال طلبك..." ||
        submitLabel.textContent === "جاري تجهيز طلبك..."
      ) {
        submitLabel.textContent = "إرسال الطلب";
      }
    }
  });
} else {
  console.error(
    "Brief form initialization failed. Check the HTML IDs: brief-form, submit-button, submit-label.",
  );
}
