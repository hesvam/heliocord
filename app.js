/* =========================================
   HELIOCORD — SINGLE PAGE APP
   Multi-step brief + validation + Telegram
========================================= */
(() => {
  "use strict";

  const form = document.getElementById("logo-design-form");
  if (!form) return;

  const steps = Array.from(form.querySelectorAll(".form-step"));
  const nextButton = document.getElementById("next-step");
  const prevButton = document.getElementById("prev-step");
  const submitButton = document.getElementById("submit-button");
  const submitLabel = document.getElementById("submit-label");
  const stepCount = document.getElementById("step-count");
  const progress = document.getElementById("form-progress");
  const stepHint = document.getElementById("step-hint");
  const statusBox = document.getElementById("form-status");
  const serviceCards = document.querySelectorAll(".service-card[data-service]");
  let currentStep = 0;
  let toastTimers = [];

  const fieldLabels = {
    brand_name: "اسم الشركة أو المشروع",
    industry: "نوع النشاط",
    slogan: "الشعار النصي",
    brand_stage: "حالة المشروع",
    logo_type: "نوع اللوجو المطلوب",
    target_audience: "الجمهور المستهدف",
    brand_personality: "شخصية العلامة التجارية",
    reference_links: "روابط تصميمات مرجعية",
    reference_description: "ما الذي أعجبك في التصميمات المرجعية؟",
    avoid_elements: "العناصر أو الأفكار غير المرغوبة",
    additional_notes: "ملاحظات إضافية",
    client_name: "الاسم بالكامل",
    phone: "رقم واتساب"
  };

  function clearErrors(scope = form) {
    scope.querySelectorAll(".is-invalid,.has-error").forEach(el => el.classList.remove("is-invalid", "has-error"));
    scope.querySelectorAll(".field-error-message,.group-error-message").forEach(el => el.remove());
    scope.querySelectorAll('[aria-invalid="true"]').forEach(el => el.removeAttribute("aria-invalid"));
  }

  function showFieldError(field, message) {
    field.classList.add("is-invalid");
    const control = field.querySelector("input,textarea,select");
    if (control) control.setAttribute("aria-invalid", "true");
    const error = document.createElement("span");
    error.className = "field-error-message";
    error.textContent = message;
    field.appendChild(error);
  }

  function showGroupError(group, message) {
    group.classList.add("has-error");
    group.querySelectorAll("input").forEach(input => input.setAttribute("aria-invalid", "true"));
    const error = document.createElement("span");
    error.className = "group-error-message";
    error.textContent = message;
    group.appendChild(error);
  }

  function validateStep(index) {
    const step = steps[index];
    clearErrors(step);
    let firstInvalid = null;
    const handledGroups = new Set();

    step.querySelectorAll("input,textarea,select").forEach(control => {
      if (control.disabled || ["button", "submit", "hidden", "reset"].includes(control.type)) return;
      if (!control.required) return;

      if (control.type === "radio" || control.type === "checkbox") {
        const key = `${control.type}:${control.name}`;
        if (handledGroups.has(key)) return;
        handledGroups.add(key);
        const groupControls = Array.from(step.querySelectorAll(`input[name="${CSS.escape(control.name)}"]`));
        const isChecked = groupControls.some(item => item.checked);
        if (!isChecked) {
          const group = control.name === "logo_type"
            ? step.querySelector("#logo-type-group")
            : control.closest(".field") || control.parentElement;
          showGroupError(group, control.name === "logo_type" ? "يرجى اختيار نوع اللوجو المناسب." : "يرجى اختيار إجابة واحدة على الأقل.");
          firstInvalid ||= group;
        }
        return;
      }

      const value = control.value.trim();
      let message = "";
      if (!value) {
        message = control.name === "brand_name" ? "يرجى إدخال اسم الشركة."
          : control.name === "industry" ? "يرجى تحديد نوع النشاط التجاري."
            : control.name === "client_name" ? "يرجى إدخال اسمك بالكامل."
              : control.name === "phone" ? "يرجى إدخال رقم واتساب."
                : "يرجى استكمال هذا الحقل.";
      } else if (control.name === "phone" && !/^01\d{9}$/.test(value)) {
        message = "يرجى إدخال رقم واتساب مصري مكوّن من 11 رقمًا.";
      } else if (!control.checkValidity()) {
        message = control.name === "phone" ? "رقم واتساب يجب أن يتكوّن من 11 رقمًا." : "يرجى مراجعة البيانات المدخلة.";
      }
      if (message) {
        showFieldError(control.closest(".field") || control.parentElement, message);
        firstInvalid ||= control;
      }
    });

    if (firstInvalid) {
      const target = firstInvalid.matches?.(".field,.has-error") ? firstInvalid : firstInvalid.closest(".field") || firstInvalid;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusable = target.querySelector?.("input,textarea,select");
      focusable?.focus({ preventScroll: true });
      return false;
    }
    return true;
  }

  function renderStep(index) {
    currentStep = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((step, i) => {
      const active = i === currentStep;
      step.hidden = !active;
      step.classList.toggle("is-active", active);
    });
    const number = String(currentStep + 1).padStart(2, "0");
    stepCount.textContent = `${number} / ${String(steps.length).padStart(2, "0")}`;
    progress.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
    stepHint.textContent = `الخطوة ${currentStep + 1} من ${steps.length}`;
    prevButton.hidden = currentStep === 0;
    nextButton.hidden = currentStep === steps.length - 1;
    submitButton.hidden = currentStep !== steps.length - 1;
    clearErrors(form);
  }

  nextButton.addEventListener("click", () => {
    if (validateStep(currentStep)) {
      renderStep(currentStep + 1);
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  prevButton.addEventListener("click", () => {
    renderStep(currentStep - 1);
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  form.addEventListener("input", event => {
    const field = event.target.closest(".field");
    if (field) {
      field.classList.remove("is-invalid");
      field.querySelectorAll(".field-error-message").forEach(el => el.remove());
      field.querySelectorAll('[aria-invalid="true"]').forEach(el => el.removeAttribute("aria-invalid"));
    }
    if (event.target.name === "phone") event.target.value = event.target.value.replace(/\D/g, "").slice(0, 11);
  });

  form.addEventListener("change", event => {
    const group = event.target.closest("#logo-type-group,.field");
    if (group) {
      group.classList.remove("has-error");
      group.querySelectorAll(".group-error-message").forEach(el => el.remove());
      group.querySelectorAll('[aria-invalid="true"]').forEach(el => el.removeAttribute("aria-invalid"));
    }
  });

  function showToast(message, success = false) {
    if (!statusBox) return;
    toastTimers.forEach(clearTimeout);
    toastTimers = [];
    const oldToasts = Array.from(statusBox.children);
    oldToasts.forEach(toast => {
      toast.classList.remove("is-visible");
      toast.classList.add("is-leaving");
      setTimeout(() => toast.remove(), 260);
    });
    const toast = document.createElement("div");
    toast.className = `toast-item ${success ? "is-success" : "is-error"}`;
    const icon = document.createElement("i");
    icon.className = success ? "ri-checkbox-circle-fill" : "ri-error-warning-fill";
    const text = document.createElement("span");
    text.textContent = message;
    toast.append(icon, text);
    statusBox.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    toastTimers.push(setTimeout(() => {
      toast.classList.remove("is-visible");
      toast.classList.add("is-leaving");
      setTimeout(() => toast.remove(), 280);
    }, 5000));
  }

  function createReferenceId() {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const random = Math.random().toString(36).slice(2, 10).toUpperCase().padEnd(8, "X");
    return `HC-${ymd}-${random}`;
  }

  function collectAnswers() {
    const values = new Map();
    Array.from(form.elements).forEach(element => {
      if (!element.name || element.disabled || element.type === "submit" || element.type === "button" || element.type === "hidden") return;
      if ((element.type === "radio" || element.type === "checkbox") && !element.checked) return;
      const label = fieldLabels[element.name] || element.name;
      const value = String(element.value ?? "").trim();
      if (!value) return;
      if (values.has(label)) {
        values.set(label, `${values.get(label)}، ${value}`);
      } else {
        values.set(label, value);
      }
    });
    return Array.from(values, ([label, value]) => ({ label, value }));
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!validateStep(currentStep)) return;
    // All prior steps have already passed validation, but check again defensively.
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        renderStep(i);
        return;
      }
    }

    submitButton.disabled = true;
    nextButton.disabled = true;
    submitLabel.textContent = "جاري إرسال الطلب...";
    const payload = collectAnswers();
    const referenceId = createReferenceId();

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceId,
          service: "تصميم اللوجو",
          payload
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || "حدثت مشكلة أثناء إرسال الطلب. حاول مرة أخرى.");

      form.reset();
      clearErrors(form);
      renderStep(0);
      showToast("تم استلام طلبك بنجاح! شكرًا لثقتك في HELIOCORD.", true);
    } catch (error) {
      showToast(error.message || "حدثت مشكلة غير متوقعة. يرجى المحاولة لاحقًا.", false);
      submitLabel.textContent = "إعادة محاولة الإرسال";
    } finally {
      submitButton.disabled = false;
      nextButton.disabled = false;
      if (submitLabel.textContent === "جاري إرسال الطلب...") submitLabel.textContent = "إرسال الطلب";
    }
  });

  // Portfolio lightbox: click outside closes; keyboard and swipe navigation retained.
  const lightbox = document.getElementById("image-lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const galleryImages = Array.from(document.querySelectorAll(".portfolio-image img"));
  if (lightbox && lightboxImage && galleryImages.length) {
    let activeIndex = 0, startX = 0, startY = 0, dragging = false;
    const showImage = index => {
      activeIndex = (index + galleryImages.length) % galleryImages.length;
      lightboxImage.src = galleryImages[activeIndex].src;
      lightboxImage.alt = galleryImages[activeIndex].alt || "معاينة الصورة";
    };
    const close = () => {
      lightbox.classList.remove("active");
      document.body.classList.remove("lightbox-open");
    };
    galleryImages.forEach((image, index) => image.addEventListener("click", () => {
      showImage(index);
      lightbox.classList.add("active");
      document.body.classList.add("lightbox-open");
    }));
    lightbox.addEventListener("click", event => {
      if (event.target === lightbox || event.target.closest(".lightbox-close")) close();
    });
    lightbox.addEventListener("pointerdown", event => {
      if (!lightbox.classList.contains("active")) return;
      dragging = true; startX = event.clientX; startY = event.clientY;
    });
    lightbox.addEventListener("pointerup", event => {
      if (!dragging) return;
      dragging = false;
      const dx = event.clientX - startX, dy = event.clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) showImage(activeIndex + (dx < 0 ? 1 : -1));
    });
    lightbox.addEventListener("pointercancel", () => dragging = false);
    document.addEventListener("keydown", event => {
      if (!lightbox.classList.contains("active")) return;
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") showImage(activeIndex + 1);
      if (event.key === "ArrowRight") showImage(activeIndex - 1);
    });
  }

  serviceCards.forEach(card => {
    card.addEventListener("click", () => {
      document.getElementById("order")?.scrollIntoView({
        behavior: "smooth"
      });

      setTimeout(() => {
        document.getElementById("brand-name")?.focus({
          preventScroll: true
        });
      }, 450);
    });
  });

  renderStep(0);
})();
