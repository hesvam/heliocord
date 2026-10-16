
const form = document.getElementById("brief-form");
const submitButton = document.getElementById("submit-button");
const submitLabel = document.getElementById("submit-label");
const statusBox = document.getElementById("form-status");

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
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

  return element.name || element.id || "بيانات إضافية";
}

/* Collect all answers, including multiple selections. */

function collectAnswers() {
  const answers = [];
  const grouped = new Map();

  const elements = form.querySelectorAll(
    "input, textarea, select"
  );

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

    let value = element.value.trim();

    if (element.type === "checkbox" || element.type === "radio") {
      value = getFieldLabel(element);
    }

    if (!value) continue;

    const label = getFieldLabel(element);

    if (grouped.has(key)) {
      const existing = grouped.get(key);

      if (!existing.value.includes(value)) {
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

/* Build a printable HTML report. */

function createReport(referenceId, answers) {
  const report = document.createElement("div");

  report.dir = "rtl";

  report.style.cssText = `
    position: fixed;
    left: -10000px;
    top: 0;
    width: 760px;
    padding: 36px;
    background: #ffffff;
    color: #171717;
    font-family: Cairo, Arial, sans-serif;
    box-sizing: border-box;
  `;

  const rows = answers.map((item, index) => `
    <div style="
      padding: 13px 0;
      border-bottom: 1px solid #e7e7e7;
      break-inside: avoid;
    ">
      <div style="
        display: flex;
        justify-content: space-between;
        gap: 12px;
        color: #777;
        font-size: 11px;
        margin-bottom: 5px;
      ">
        <span>${escapeHTML(item.label)}</span>
        <span>${String(index + 1).padStart(2, "0")}</span>
      </div>

      <div style="
        color: #171717;
        font-size: 13px;
        line-height: 1.9;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      ">${escapeHTML(item.value)}</div>
    </div>
  `).join("");

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
        font-size: 27px;
        margin: 20px 0 5px;
      ">بريف تصميم الشعار</h1>

      <p style="
        color: #777;
        font-family: Inter, Arial, sans-serif;
        font-size: 12px;
        direction: ltr;
        text-align: left;
      ">LOGO DESIGN BRIEF</p>

      <div style="
        margin-top: 20px;
        padding: 12px;
        background: #f4f4f4;
        font-size: 12px;
      ">
        رقم المرجع:
        <strong dir="ltr">${escapeHTML(referenceId)}</strong>
      </div>
    </div>

    ${rows}

    <div style="
      margin-top: 28px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      color: #888;
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

function setStatus(message, success = false) {
  statusBox.textContent = message;
  statusBox.dataset.state = success ? "success" : "error";
}

/* Generate PDF and submit it to the Vercel API. */

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) return;

  if (typeof html2pdf === "undefined") {
    setStatus("تعذر تحميل مكتبة PDF. حدّث الصفحة وحاول مرة أخرى.");
    return;
  }

  submitButton.disabled = true;
  submitLabel.textContent = "جاري تجهيز البريف...";
  statusBox.textContent = "";

  let report;

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const answers = collectAnswers();

    const referenceId =
      "BR-" +
      new Date().toISOString().slice(0, 10).replace(/-/g, "") +
      "-" +
      crypto.randomUUID().slice(0, 8).toUpperCase();

    report = createReport(referenceId, answers);

    const pdfBlob = await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: `Logo-Brief-${referenceId}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
        pagebreak: {
          mode: ["css", "legacy"],
        },
      })
      .from(report)
      .outputPdf("blob");

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

    /* Download a copy for the client after successful submission. */

    const downloadUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = `Logo-Brief-${referenceId}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

    setStatus(
      `تم إرسال البريف بنجاح! رقم الطلب: ${referenceId}. تم تجهيز نسخة PDF لك.`,
      true
    );

    submitLabel.textContent = "تم إرسال البريف";
  } catch (error) {
    console.error("Brief submission failed:", error);

    setStatus(
      error.message ||
      "حدث خطأ أثناء الإرسال. تحقق من اتصال الإنترنت وحاول مجددًا."
    );

    submitLabel.textContent = "إعادة محاولة الإرسال";
  } finally {
    report?.remove();
    submitButton.disabled = false;

    if (submitLabel.textContent === "جاري إرسال البريف..." ||
        submitLabel.textContent === "جاري تجهيز البريف...") {
      submitLabel.textContent = "إرسال البريف وحفظ PDF";
    }
  }
});
