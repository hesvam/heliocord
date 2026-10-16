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

  const choice = element.closest(
    ".choice-card, .check-option, .logo-type"
  );

  if (choice) {
    const name = choice.querySelector(
      ".logo-type-name, .choice-title"
    );

    if (name) return name.innerText.trim();

    return choice.innerText.replace(/\s+/g, " ").trim();
  }

  return element.name || element.id || "بيانات إضافية";
}

/* Collect all completed answers. */

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

    if (["checkbox", "radio"].includes(element.type)) {
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

/* Build the PDF report. */

function createReport(referenceId, answers) {
  const report = document.createElement("div");

  report.setAttribute("dir", "rtl");

  Object.assign(report.style, {
    position: "absolute",
    left: "-800px",
    top: "0",
    width: "760px",
    padding: "36px",
    background: "#ffffff",
    color: "#171717",
    fontFamily: "Cairo, Arial, sans-serif",
    boxSizing: "border-box",
    zIndex: "-1",
  });

  const rows = answers.map((item, index) => `
    <div style="
      padding: 14px 0;
      border-bottom: 1px solid #e7e9ed;
      break-inside: avoid;
      page-break-inside: avoid;
    ">
      <div style="
        display: flex;
        justify-content: space-between;
        gap: 12px;
        color: #737780;
        font-size: 11px;
        margin-bottom: 6px;
      ">
        <span>${escapeHTML(item.label)}</span>
        <span>${String(index + 1).padStart(2, "0")}</span>
      </div>

      <div style="
        color: #171717;
        font-size: 13px;
        line-height: 2;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      ">${escapeHTML(item.value)}</div>
    </div>
  `).join("");

  report.innerHTML = `
    <header style="
      border-bottom: 2px solid #171717;
      padding-bottom: 22px;
      margin-bottom: 24px;
    ">
      <div style="
        font-family: Arial, sans-serif;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 3px;
        direction: ltr;
        text-align: left;
      ">BRIEF STUDIO</div>

      <h1 style="
        font-size: 27px;
        line-height: 1.6;
        margin: 20px 0 4px;
        color: #171717;
      ">بريف تصميم الشعار</h1>

      <p style="
        color: #777;
        font-family: Arial, sans-serif;
        font-size: 11px;
        letter-spacing: 1px;
        direction: ltr;
        text-align: left;
        margin: 0;
      ">LOGO DESIGN BRIEF</p>

      <div style="
        margin-top: 20px;
        padding: 13px 15px;
        background: #f3f4f6;
        border-right: 3px solid #171717;
        font-size: 12px;
      ">
        رقم الطلب:
        <strong dir="ltr">${escapeHTML(referenceId)}</strong>
      </div>

      <p style="
        margin: 16px 0 0;
        color: #666;
        font-size: 11px;
        line-height: 1.9;
      ">
        يحتوي هذا المستند على المعلومات المقدمة من العميل
        لتحديد متطلبات واتجاه تصميم الشعار.
      </p>
    </header>

    <section>
      <h2 style="
        font-size: 16px;
        margin: 0 0 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #ddd;
      ">تفاصيل البريف</h2>

      ${rows}
    </section>

    <footer style="
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #ddd;
      color: #888;
      font-family: Arial, sans-serif;
      font-size: 9px;
      direction: ltr;
      text-align: center;
    ">
      LOGO DESIGN / CREATIVE PROCESS
      <div style="margin-top: 5px;">
        REFERENCE: ${escapeHTML(referenceId)}
      </div>
    </footer>
  `;

  document.body.appendChild(report);

  return report;
}

function setStatus(message, success = false) {
  statusBox.textContent = message;
  statusBox.dataset.state = success ? "success" : "error";
}

/* Submit the PDF directly to the server.
   No automatic download is triggered for the client. */

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

    if (!answers.length) {
      throw new Error("لم يتم العثور على بيانات لإضافتها إلى البريف.");
    }

    const referenceId =
      "BR-" +
      new Date().toISOString().slice(0, 10).replace(/-/g, "") +
      "-" +
      crypto.randomUUID().slice(0, 8).toUpperCase();

    report = createReport(referenceId, answers);

    // Give the browser time to render the report before PDF generation.
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const pdfBlob = await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
          logging: false,
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

    // Validate that the generated file is a real, non-empty PDF.
    if (!pdfBlob || pdfBlob.size < 1000) {
      throw new Error("ملف PDF الناتج فارغ أو غير مكتمل. حاول مرة أخرى.");
    }

    const signature = new Uint8Array(
      await pdfBlob.slice(0, 5).arrayBuffer()
    );

    if (String.fromCharCode(...signature) !== "%PDF-") {
      throw new Error("تعذر إنشاء ملف PDF صالح. حاول مرة أخرى.");
    }

    submitLabel.textContent = "جاري إرسال البريف إلى الاستوديو...";

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

    // Intentionally no download link or automatic PDF download.

    setStatus(
      `تم إرسال البريف بنجاح. رقم الطلب: ${referenceId}`,
      true
    );

    submitLabel.textContent = "تم إرسال البريف بنجاح";

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

    if (
      submitLabel.textContent === "جاري إرسال البريف إلى الاستوديو..." ||
      submitLabel.textContent === "جاري تجهيز البريف..."
    ) {
      submitLabel.textContent = "إرسال البريف وحفظ PDF";
    }
  }
});
