
const form = document.getElementById("brief-form");
const submitButton = document.getElementById("submit-button");
const submitLabel = document.getElementById("submit-label");
const statusBox = document.getElementById("form-status");

const PDF_REPORT_ID = "pdf-report-render-target";

/* Escape HTML to safely display submitted answers. */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

/* Get a readable field label. */

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

  return element.name || element.id || "بيانات إضافية";
}

/* Collect answers, including multiple selections. */

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

    if (
      ["checkbox", "radio"].includes(element.type) &&
      !element.checked
    ) {
      continue;
    }

    const key = element.name || element.id;

    if (!key) continue;

    let value = String(element.value ?? "").trim();

    if (element.type === "checkbox" || element.type === "radio") {
      value = getFieldLabel(element);
    }

    if (!value) continue;

    const label = getFieldLabel(element);

    if (grouped.has(key)) {
      const existing = grouped.get(key);
      const values = existing.value.split("، ");

      if (!values.includes(value)) {
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

/* Create a unique reference ID. */

function createReferenceId() {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  const randomPart =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()
      : Math.random().toString(16).slice(2, 10).toUpperCase();

  return `BR-${date}-${randomPart}`;
}

/* Build the PDF report. */

function createReport(referenceId, answers) {
  const report = document.createElement("div");

  report.id = PDF_REPORT_ID;
  report.dir = "rtl";

  Object.assign(report.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: "760px",
    padding: "36px",
    margin: "0",
    background: "#ffffff",
    color: "#171717",
    fontFamily: "Cairo, Arial, sans-serif",
    fontSize: "13px",
    lineHeight: "1.8",
    boxSizing: "border-box",
    zIndex: "-1",
    opacity: "0",
    pointerEvents: "none",
    overflow: "visible",
  });

  const rows = answers.length
    ? answers.map((item, index) => `
        <div style="
          padding: 13px 0;
          border-bottom: 1px solid #e7e7e7;
          break-inside: avoid;
          page-break-inside: avoid;
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            gap: 12px;
            color: #777777;
            font-size: 11px;
            margin-bottom: 5px;
          ">
            <span>${escapeHTML(item.label)}</span>
            <span dir="ltr">${String(index + 1).padStart(2, "0")}</span>
          </div>

          <div style="
            color: #171717;
            font-size: 13px;
            line-height: 1.9;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            word-break: break-word;
          ">${escapeHTML(item.value)}</div>
        </div>
      `).join("")
    : `
        <div style="padding: 20px 0; color: #777777;">
          لم يتم العثور على إجابات مدخلة في النموذج.
        </div>
      `;

  report.innerHTML = `
    <header style="
      border-bottom: 2px solid #171717;
      padding-bottom: 20px;
      margin-bottom: 24px;
    ">
      <div style="
        font-family: Inter, Arial, sans-serif;
        font-size: 12px;
        font-weight: bold;
        letter-spacing: 2px;
        direction: ltr;
        text-align: left;
      ">BRIEF STUDIO</div>

      <h1 style="
        color: #171717;
        font-family: Cairo, Arial, sans-serif;
        font-size: 27px;
        font-weight: 700;
        margin: 20px 0 5px;
        line-height: 1.6;
      ">بريف تصميم الشعار</h1>

      <p style="
        color: #777777;
        font-family: Inter, Arial, sans-serif;
        font-size: 12px;
        direction: ltr;
        text-align: left;
        margin: 0;
      ">LOGO DESIGN BRIEF</p>

      <div style="
        margin-top: 20px;
        padding: 12px;
        background: #f4f4f4;
        border: 1px solid #e9e9e9;
        font-size: 12px;
      ">
        رقم المرجع:
        <strong dir="ltr">${escapeHTML(referenceId)}</strong>
      </div>
    </header>

    <main>${rows}</main>

    <footer style="
      margin-top: 28px;
      padding-top: 15px;
      border-top: 1px solid #dddddd;
      color: #888888;
      font-family: Inter, Arial, sans-serif;
      font-size: 9px;
      direction: ltr;
      text-align: center;
    ">
      LOGO DESIGN / CREATIVE PROCESS
    </footer>
  `;

  document.body.appendChild(report);

  return report;
}

/* Display status messages. */

function setStatus(message, success = false) {
  if (!statusBox) return;

  statusBox.textContent = message;
  statusBox.dataset.state = success ? "success" : "error";
}

/* Allow browser layout and fonts to finish loading. */

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

/* Create PDF and check that the captured report is not blank. */

async function generatePDF(report) {
if (
  typeof html2canvas === "undefined" ||
  !window.jspdf ||
  typeof window.jspdf.jsPDF !== "function"
) {
  setStatus(
    "تعذر تحميل مكتبات PDF. حدّث الصفحة وحاول مرة أخرى."
  );
  return;
}

  await waitForRender();

  /*
   * Capture the report directly first.
   * This helps detect blank rendering before making the PDF.
   */

  const canvas = await html2canvas(report, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: true,
    width: report.scrollWidth,
    height: report.scrollHeight,
    windowWidth: Math.max(window.innerWidth, 1000),
    windowHeight: Math.max(window.innerHeight, report.scrollHeight + 100),
    scrollX: 0,
    scrollY: 0,

    onclone: (clonedDocument) => {
      const clonedReport = clonedDocument.getElementById(PDF_REPORT_ID);

      if (!clonedReport) {
        throw new Error("لم يتم العثور على التقرير في نسخة التصوير.");
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
   * Check whether the captured canvas contains non-white pixels.
   * If it is entirely white, do not send an empty PDF.
   */

  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!context) {
    throw new Error("تعذر قراءة صورة التقرير.");
  }

  const sampleWidth = Math.min(canvas.width, 200);
  const sampleHeight = Math.min(canvas.height, 200);
  const sample = context.getImageData(
    0,
    0,
    sampleWidth,
    sampleHeight
  ).data;

  let hasVisibleContent = false;

  for (let i = 0; i < sample.length; i += 4) {
    const r = sample[i];
    const g = sample[i + 1];
    const b = sample[i + 2];

    if (r < 245 || g < 245 || b < 245) {
      hasVisibleContent = true;
      break;
    }
  }

  if (!hasVisibleContent) {
    throw new Error(
      "التقرير تم التقاطه كصفحة بيضاء. لم يتم إرسال الملف. راجع إعدادات عرض التقرير."
    );
  }

  /*
   * Convert the captured canvas into a PDF.
   * The PDF is returned as a Blob; it is never downloaded here.
   */

  const imageData = canvas.toDataURL("image/jpeg", 0.96);

  const { jsPDF } = window.jspdf || {};

  if (!jsPDF) {
    throw new Error("مكتبة jsPDF غير متاحة.");
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  const imageWidth = contentWidth;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;

  let remainingHeight = imageHeight;
  let position = margin;

  pdf.addImage(
    imageData,
    "JPEG",
    margin,
    position,
    imageWidth,
    imageHeight,
    undefined,
    "FAST"
  );

  remainingHeight -= contentHeight;

  while (remainingHeight > 0) {
    pdf.addPage();
    position = margin - (imageHeight - remainingHeight);

    pdf.addImage(
      imageData,
      "JPEG",
      margin,
      position,
      imageWidth,
      imageHeight,
      undefined,
      "FAST"
    );

    remainingHeight -= contentHeight;
  }

  const pdfBlob = pdf.output("blob");

  if (!(pdfBlob instanceof Blob) || pdfBlob.size < 1000) {
    throw new Error("ملف PDF الناتج فارغ أو غير مكتمل.");
  }

  const signature = new Uint8Array(
    await pdfBlob.slice(0, 5).arrayBuffer()
  );

  if (String.fromCharCode(...signature) !== "%PDF-") {
    throw new Error("تعذر إنشاء ملف PDF صالح.");
  }

  return pdfBlob;
}

/* Submit the brief and PDF to the Vercel API. */

if (form && submitButton && submitLabel) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (submitButton.disabled) return;
    if (!form.reportValidity()) return;

    if (typeof html2canvas === "undefined" || !window.jspdf?.jsPDF) {
      setStatus(
        "مكتبات PDF غير مكتملة. تأكد من تحميل html2canvas وjsPDF."
      );
      return;
    }

    submitButton.disabled = true;
    submitLabel.textContent = "جاري تجهيز البريف...";
    setStatus("");

    let report = null;

    try {
      const answers = collectAnswers();
      const referenceId = createReferenceId();

      report = createReport(referenceId, answers);

      const pdfBlob = await generatePDF(report);

      report.remove();
      report = null;

      submitLabel.textContent = "جاري إرسال البريف...";

      const requestData = new FormData();

      requestData.append("referenceId", referenceId);
      requestData.append("payload", JSON.stringify(answers));

      requestData.append(
        "report",
        pdfBlob,
        `Logo-Brief-${referenceId}.pdf`
      );

      const response = await fetch("/api/submit", {
        method: "POST",
        body: requestData,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "لم نتمكن من إرسال البريف."
        );
      }

      setStatus(
        `تم إرسال البريف بنجاح! رقم الطلب: ${referenceId}`,
        true
      );

      submitLabel.textContent = "تم إرسال البريف";
    } catch (error) {
      console.error("Brief submission failed:", error);

      setStatus(
        error instanceof Error && error.message
          ? error.message
          : "حدث خطأ أثناء الإرسال. تحقق من اتصال الإنترنت وحاول مجددًا."
      );

      submitLabel.textContent = "إعادة محاولة الإرسال";
    } finally {
      report?.remove();
      submitButton.disabled = false;

      if (
        submitLabel.textContent === "جاري إرسال البريف..." ||
        submitLabel.textContent === "جاري تجهيز البريف..."
      ) {
        submitLabel.textContent = "إرسال البريف";
      }
    }
  });
} else {
  console.error(
    "Brief form initialization failed. Check the required HTML element IDs."
  );
}
