
const form = document.getElementById("brief-form");
const submitButton = document.getElementById("submit-button");
const submitLabel = document.getElementById("submit-label");
const statusBox = document.getElementById("form-status");

/* Escape user-provided text before inserting it into HTML. */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

/* Get a readable label for each form field. */

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

/* Collect answers and combine multiple selections. */

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

      if (!existing.value.split("، ").includes(value)) {
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

/* Generate a unique order reference. */

function createReferenceId() {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  let randomPart;

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    randomPart = crypto.randomUUID()
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

  return `BR-${date}-${randomPart}`;
}

/* Build the printable HTML report. */

function createReport(referenceId, answers) {
  const report = document.createElement("div");

  report.dir = "rtl";
  report.setAttribute("aria-hidden", "true");

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
        <div style="
          padding: 20px 0;
          color: #777777;
          font-size: 13px;
        ">
          لم يتم العثور على إجابات مدخلة في النموذج.
        </div>
      `;

  report.innerHTML = `
    <div style="
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
        font-family: Cairo, Arial, sans-serif;
        color: #171717;
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
        font-size: 12px;
        border: 1px solid #e9e9e9;
      ">
        رقم المرجع:
        <strong dir="ltr">${escapeHTML(referenceId)}</strong>
      </div>
    </div>

    ${rows}

    <div style="
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
    </div>
  `;

  document.body.appendChild(report);

  return report;
}

/* Update the form status message. */

function setStatus(message, success = false) {
  if (!statusBox) return;

  statusBox.textContent = message;
  statusBox.dataset.state = success ? "success" : "error";
}

/* Wait for the browser to finish layout and rendering. */

function waitForRender() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

/* Generate and validate the PDF without downloading it. */

async function generatePDF(report, referenceId) {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  await waitForRender();

  const pdfBlob = await html2pdf()
    .set({
      margin: [10, 10, 10, 10],

      image: {
        type: "jpeg",
        quality: 0.98,
      },

      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        logging: false,
        removeContainer: true,
      },

      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      },

      pagebreak: {
        mode: ["css", "legacy"],
      },
    })
    .from(report)
    .outputPdf("blob");

  if (!(pdfBlob instanceof Blob) || pdfBlob.size < 1000) {
    throw new Error(
      "ملف PDF الناتج فارغ أو غير مكتمل. حاول مرة أخرى."
    );
  }

  const signature = new Uint8Array(
    await pdfBlob.slice(0, 5).arrayBuffer()
  );

  if (String.fromCharCode(...signature) !== "%PDF-") {
    throw new Error("تعذر إنشاء ملف PDF صالح.");
  }

  return pdfBlob;
}

/* Submit the brief and send the PDF directly to the API. */

if (form && submitButton && submitLabel) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (submitButton.disabled) return;

    if (!form.reportValidity()) return;

    if (typeof html2pdf === "undefined") {
      setStatus(
        "تعذر تحميل مكتبة PDF. حدّث الصفحة وحاول مرة أخرى."
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

      const pdfBlob = await generatePDF(report, referenceId);

      /* Remove the report after PDF generation. */

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

      /* No automatic PDF download for the client. */

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
    "Brief form initialization failed: check the IDs brief-form, submit-button, submit-label."
  );
}
