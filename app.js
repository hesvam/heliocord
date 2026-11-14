
/* =========================================
   HELIOCORD — MULTI SERVICE PROJECT BRIEF
   Dynamic Services + Validation + Telegram
========================================= */

(() => {
  "use strict";

  const form = document.getElementById("logo-design-form");
  if (!form) return;

  /* =========================================
     1. ELEMENTS
  ========================================= */

  const steps = [...form.querySelectorAll(".form-step")];

  const nextButton = document.getElementById("next-step");
  const prevButton = document.getElementById("prev-step");
  const submitButton = document.getElementById("submit-button");
  const submitLabel = document.getElementById("submit-label");

  const stepCount = document.getElementById("step-count");
  const progress = document.getElementById("form-progress");
  const stepHint = document.getElementById("step-hint");

  const statusBox = document.getElementById("form-status");

  const serviceInput = document.getElementById("selected-service");
  const servicePriceInput = document.getElementById("selected-service-price");

  const serviceStepTitle = document.getElementById("service-step-title");
  const serviceStepDescription = document.getElementById("service-step-description");

  const summaryServiceName = document.getElementById("summary-service-name");
  const summaryServicePrice = document.getElementById("summary-service-price");

  const serviceFields = [...form.querySelectorAll("[data-service-fields]")];
  const serviceCards = document.querySelectorAll(".service-card[data-service]");

  let currentStep = 0;
  let toastTimer = null;
  let toastRemoveTimer = null;

  /* =========================================
     2. SERVICE CONFIGURATION
  ========================================= */

  const services = {
    "logo-design": {
      name: "تصميم شعار",
      price: 500,
      stepTitle: "تفاصيل تصميم الشعار",
      description: "حدد نوع اللوجو وشخصية العلامة التجارية التي تريدها."
    },

    "logo-redesign": {
      name: "تحديث شعار",
      price: 400,
      stepTitle: "تفاصيل تحديث الشعار",
      description: "شاركنا الشعار الحالي والتعديلات التي ترغب في تنفيذها."
    },

    "visual-identity": {
      name: "هوية بصرية",
      price: 2500,
      stepTitle: "تفاصيل الهوية البصرية",
      description: "حدد التطبيقات التي تحتاجها في هويتك البصرية."
    },

    "social-media": {
      name: "تصميم سوشيال ميديا",
      price: 300,
      stepTitle: "تفاصيل تصميمات السوشيال ميديا",
      description: "حدد المنصات وعدد التصميمات والمحتوى المطلوب."
    }
  };

  const fieldLabels = {
    brand_name: "اسم الشركة أو المشروع",
    industry: "نوع النشاط",
    slogan: "الشعار النصي",
    brand_stage: "حالة المشروع",
    target_audience: "الجمهور المستهدف",

    logo_type: "نوع اللوجو المطلوب",
    brand_personality: "شخصية العلامة التجارية",

    current_logo: "رابط الشعار الحالي",
    redesign_reason: "سبب تحديث الشعار",
    preserve_elements: "العناصر المطلوب الحفاظ عليها",
    redesign_direction: "اتجاه التصميم الجديد",

    identity_items: "تطبيقات الهوية البصرية",
    identity_description: "وصف الهوية البصرية",
    identity_requirements: "متطلبات الهوية الإضافية",

    social_platforms: "منصات السوشيال ميديا",
    design_count: "عدد التصميمات المطلوبة",
    design_format: "نوع التصميمات",
    social_content: "محتوى التصميمات",
    social_notes: "تفاصيل إضافية للسوشيال ميديا",

    reference_links: "روابط التصميمات المرجعية",
    reference_description: "وصف التصميمات المرجعية",
    additional_notes: "ملاحظات إضافية",

    client_name: "الاسم بالكامل",
    phone: "رقم واتساب"
  };

  const getSelectedService = () => {
    const selected = form.querySelector('input[name="service_choice"]:checked');
    return selected ? selected.value : "";
  };

  /* =========================================
     3. SERVICE SELECTION
  ========================================= */

  function selectService(serviceKey) {
    const service = services[serviceKey];
    if (!service) return;

    const radio = form.querySelector(
      `input[name="service_choice"][value="${serviceKey}"]`
    );

    if (radio) radio.checked = true;

    serviceInput.value = service.name;
    servicePriceInput.value = service.price;

    serviceFields.forEach(container => {
      const active = container.dataset.serviceFields === serviceKey;
      container.hidden = !active;

      container.querySelectorAll("input,textarea,select").forEach(control => {
        control.disabled = !active;
      });
    });

    serviceStepTitle.textContent = service.stepTitle;
    serviceStepDescription.textContent = service.description;

    summaryServiceName.textContent = service.name;
    summaryServicePrice.textContent = `${service.price.toLocaleString("en-US")} ج.م`;

    clearErrors(steps[0]);
    clearErrors(steps[2]);

    form.querySelectorAll(".service-option").forEach(option => {
      const optionInput = option.querySelector('input[name="service_choice"]');
      option.classList.toggle("selected", !!optionInput?.checked);
    });
  }

  form.querySelectorAll('input[name="service_choice"]').forEach(radio => {
    radio.addEventListener("change", () => {
      selectService(radio.value);
    });
  });

  /* =========================================
     4. ERROR HANDLING
  ========================================= */

  function clearErrors(scope = form) {
    scope.querySelectorAll(".is-invalid,.has-error").forEach(element => {
      element.classList.remove("is-invalid", "has-error");
    });

    scope.querySelectorAll(".field-error-message,.group-error-message").forEach(element => {
      element.remove();
    });

    scope.querySelectorAll('[aria-invalid="true"]').forEach(element => {
      element.removeAttribute("aria-invalid");
    });
  }

  function showFieldError(field, message) {
    if (!field) return;

    field.classList.add("is-invalid");

    const control = field.querySelector("input,textarea,select");

    if (control) {
      control.setAttribute("aria-invalid", "true");
    }

    const error = document.createElement("span");
    error.className = "field-error-message";
    error.textContent = message;

    field.appendChild(error);
  }

  function showGroupError(group, message) {
    if (!group) return;

    group.classList.add("has-error");

    group.querySelectorAll("input").forEach(input => {
      input.setAttribute("aria-invalid", "true");
    });

    const error = document.createElement("span");
    error.className = "group-error-message";
    error.textContent = message;

    group.appendChild(error);
  }

  function focusError(target) {
    target.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    const control = target.querySelector?.(
      'input:not([type="hidden"]),textarea,select'
    );

    control?.focus({ preventScroll: true });
  }

  /* =========================================
     5. STEP VALIDATION
  ========================================= */

  function validateStep(index) {
    const step = steps[index];

    clearErrors(step);

    let firstInvalid = null;

    // STEP 1: SERVICE
    if (index === 0) {
      const selected = getSelectedService();

      if (!selected || !services[selected]) {
        const group = step.querySelector(".service-selection-grid");

        showGroupError(group, "يرجى اختيار الخدمة المناسبة لمشروعك.");

        firstInvalid = group;
      }

      if (firstInvalid) {
        focusError(firstInvalid);
        return false;
      }

      return true;
    }

    // Required fields
    const controls = [
      ...step.querySelectorAll("input,textarea,select")
    ].filter(control => {
      if (control.disabled) return false;

      if (control.closest("[hidden]")) return false;

      if (["button", "submit", "hidden", "reset"].includes(control.type)) {
        return false;
      }

      return true;
    });

    const handledGroups = new Set();

    controls.forEach(control => {
      if (!control.required) return;

      if (control.type === "radio" || control.type === "checkbox") {
        const key = `${control.type}:${control.name}`;

        if (handledGroups.has(key)) return;
        handledGroups.add(key);

        const groupControls = controls.filter(item => {
          return item.name === control.name && item.type === control.type;
        });

        const isChecked = groupControls.some(item => item.checked);

        if (!isChecked) {
          const group = control.closest(".field") ||
            control.closest(".service-selection-grid") ||
            control.parentElement;

          showGroupError(group, "يرجى اختيار الإجابة المناسبة.");

          firstInvalid ||= group;
        }

        return;
      }

      const value = control.value.trim();

      let message = "";

      if (!value) {
        message = control.name === "brand_name"
          ? "يرجى إدخال اسم الشركة أو المشروع."
          : control.name === "industry"
            ? "يرجى تحديد نوع النشاط."
            : control.name === "client_name"
              ? "يرجى إدخال اسمك بالكامل."
              : control.name === "phone"
                ? "يرجى إدخال رقم واتساب."
                : "يرجى استكمال هذا الحقل.";

      } else if (control.name === "phone" && !/^01\d{9}$/.test(value)) {
        message = "يرجى إدخال رقم واتساب مصري صحيح مكوّن من 11 رقمًا.";

      } else if (!control.checkValidity()) {
        message = control.name === "current_logo"
          ? "يرجى إدخال رابط صحيح للشعار الحالي."
          : "يرجى مراجعة البيانات المدخلة.";
      }

      if (message) {
        const field = control.closest(".field") || control.parentElement;

        showFieldError(field, message);

        firstInvalid ||= field;
      }
    });

    // Service-specific checkbox requirements
    if (index === 2) {
      const selectedService = getSelectedService();

      const requiredGroups = {
        "logo-design": [],
        "logo-redesign": [],
        "visual-identity": ["identity_items"],
        "social-media": ["social_platforms"]
      };

      (requiredGroups[selectedService] || []).forEach(name => {
        const groupControls = controls.filter(control => {
          return control.name === name && control.type === "checkbox";
        });

        if (!groupControls.length) return;

        if (!groupControls.some(control => control.checked)) {
          const group = groupControls[0].closest(".field");

          if (group && !group.classList.contains("has-error")) {
            showGroupError(group, "يرجى اختيار عنصر واحد على الأقل.");
            firstInvalid ||= group;
          }
        }
      });
    }

    if (firstInvalid) {
      focusError(firstInvalid);
      return false;
    }

    return true;
  }

  /* =========================================
     6. STEP RENDERING
  ========================================= */

  function renderStep(index) {
    currentStep = Math.max(0, Math.min(index, steps.length - 1));

    steps.forEach((step, i) => {
      const active = i === currentStep;

      step.hidden = !active;
      step.classList.toggle("is-active", active);
    });

    const number = String(currentStep + 1).padStart(2, "0");
    const total = String(steps.length).padStart(2, "0");

    stepCount.textContent = `${number} / ${total}`;

    progress.style.width =
      `${((currentStep + 1) / steps.length) * 100}%`;

    stepHint.textContent =
      `الخطوة ${currentStep + 1} من ${steps.length}`;

    prevButton.hidden = currentStep === 0;
    nextButton.hidden = currentStep === steps.length - 1;
    submitButton.hidden = currentStep !== steps.length - 1;

    clearErrors(form);
  }

  nextButton.addEventListener("click", () => {
    if (!validateStep(currentStep)) return;

    renderStep(currentStep + 1);

    form.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  prevButton.addEventListener("click", () => {
    renderStep(currentStep - 1);

    form.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  /* =========================================
     7. INPUT EVENTS
  ========================================= */

  form.addEventListener("input", event => {
    const control = event.target;

    if (control.name === "phone") {
      control.value = control.value.replace(/\D/g, "").slice(0, 11);
    }

    const field = control.closest(".field");

    if (field) {
      field.classList.remove("is-invalid");

      field.querySelectorAll(".field-error-message").forEach(error => {
        error.remove();
      });

      field.querySelectorAll('[aria-invalid="true"]').forEach(input => {
        input.removeAttribute("aria-invalid");
      });
    }
  });

  form.addEventListener("change", event => {
    const control = event.target;

    const group = control.closest(".field,.service-selection-grid");

    if (group) {
      group.classList.remove("has-error");

      group.querySelectorAll(".group-error-message").forEach(error => {
        error.remove();
      });

      group.querySelectorAll('[aria-invalid="true"]').forEach(input => {
        input.removeAttribute("aria-invalid");
      });
    }

    if (control.name === "service_choice") {
      selectService(control.value);
    }
  });

  /* =========================================
     8. TOAST NOTIFICATIONS
  ========================================= */

  function showToast(message, success = false) {
    if (!statusBox) return;

    clearTimeout(toastTimer);
    clearTimeout(toastRemoveTimer);

    const oldToast = statusBox.querySelector(".toast-item");

    if (oldToast) {
      oldToast.classList.remove("is-visible");
      oldToast.classList.add("is-leaving");

      toastRemoveTimer = setTimeout(() => {
        oldToast.remove();
      }, 260);
    }

    const toast = document.createElement("div");

    toast.className = `toast-item ${success ? "is-success" : "is-error"}`;

    const icon = document.createElement("i");

    icon.className = success
      ? "ri-checkbox-circle-fill"
      : "ri-error-warning-fill";

    const text = document.createElement("span");
    text.textContent = message;

    toast.append(icon, text);
    statusBox.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });

    toastTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
      toast.classList.add("is-leaving");

      toastRemoveTimer = setTimeout(() => {
        toast.remove();
      }, 280);

    }, 5000);
  }

  /* =========================================
     9. REFERENCE ID
  ========================================= */

  function createReferenceId() {
    const date = new Date();

    const ymd =
      `${date.getFullYear()}` +
      `${String(date.getMonth() + 1).padStart(2, "0")}` +
      `${String(date.getDate()).padStart(2, "0")}`;

    const random = Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase()
      .padEnd(8, "X");

    return `HC-${ymd}-${random}`;
  }

  /* =========================================
     10. COLLECT ANSWERS
  ========================================= */

  function collectAnswers() {
    const values = new Map();

    Array.from(form.elements).forEach(element => {
      if (!element.name || element.disabled) return;

      if (
        ["submit", "button", "hidden", "reset"].includes(element.type)
      ) return;

      // Ignore inactive service sections
      if (element.closest("[hidden]")) return;

      // Ignore the service-selection technical value
      if (element.name === "service_choice") return;

      if (
        (element.type === "radio" || element.type === "checkbox") &&
        !element.checked
      ) return;

      const label = fieldLabels[element.name] || element.name;
      const value = String(element.value ?? "").trim();

      if (!value) return;

      if (values.has(label)) {
        values.set(label, `${values.get(label)}، ${value}`);
      } else {
        values.set(label, value);
      }
    });

    return Array.from(values, ([label, value]) => ({
      label,
      value
    }));
  }

  /* =========================================
     11. SUBMIT FORM
  ========================================= */

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!validateStep(currentStep)) return;

    const selectedService = getSelectedService();
    const service = services[selectedService];

    if (!service) {
      renderStep(0);
      showToast("يرجى اختيار الخدمة قبل إرسال الطلب.");
      return;
    }

    submitButton.disabled = true;
    nextButton.disabled = true;
    prevButton.disabled = true;

    submitLabel.textContent = "جاري إرسال الطلب...";

    const payload = collectAnswers();
    const referenceId = createReferenceId();

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          referenceId,
          service: service.name,
          servicePrice: service.price,
          payload
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "حدثت مشكلة أثناء إرسال الطلب. حاول مرة أخرى."
        );
      }

      // Reset form after successful submission
      form.reset();

      clearErrors(form);

      serviceFields.forEach(container => {
        container.hidden = true;

        container.querySelectorAll("input,textarea,select").forEach(control => {
          control.disabled = true;
        });
      });

      form.querySelectorAll(".service-option").forEach(option => {
        option.classList.remove("selected");
      });

      serviceInput.value = "";
      servicePriceInput.value = "";

      renderStep(0);

      showToast(
        "تم استلام طلبك بنجاح! شكرًا لثقتك في HELIOCORD.",
        true
      );

    } catch (error) {
      showToast(
        error.message ||
        "حدثت مشكلة غير متوقعة. يرجى المحاولة لاحقًا.",
        false
      );

      submitLabel.textContent = "إعادة محاولة الإرسال";

    } finally {
      submitButton.disabled = false;
      nextButton.disabled = false;
      prevButton.disabled = false;

      if (submitLabel.textContent === "جاري إرسال الطلب...") {
        submitLabel.textContent = "إرسال الطلب";
      }
    }
  });

  /* =========================================
     12. PORTFOLIO LIGHTBOX
  ========================================= */

  const lightbox = document.getElementById("image-lightbox");
  const lightboxImage = document.getElementById("lightbox-image");

  const galleryImages = [
    ...document.querySelectorAll(".portfolio-image img")
  ];

  if (lightbox && lightboxImage && galleryImages.length) {
    let activeIndex = 0;
    let startX = 0;
    let startY = 0;
    let dragging = false;

    const showImage = index => {
      activeIndex = (index + galleryImages.length) % galleryImages.length;

      lightboxImage.src = galleryImages[activeIndex].src;
      lightboxImage.alt =
        galleryImages[activeIndex].alt || "معاينة الصورة";
    };

    const close = () => {
      lightbox.classList.remove("active");
      document.body.classList.remove("lightbox-open");
    };

    galleryImages.forEach((image, index) => {
      image.addEventListener("click", () => {
        showImage(index);

        lightbox.classList.add("active");
        document.body.classList.add("lightbox-open");
      });
    });

    lightbox.addEventListener("click", event => {
      if (
        event.target === lightbox ||
        event.target.closest(".lightbox-close")
      ) {
        close();
      }
    });

    lightbox.addEventListener("pointerdown", event => {
      if (!lightbox.classList.contains("active")) return;

      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
    });

    lightbox.addEventListener("pointerup", event => {
      if (!dragging) return;

      dragging = false;

      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        showImage(activeIndex + (dx < 0 ? 1 : -1));
      }
    });

    lightbox.addEventListener("pointercancel", () => {
      dragging = false;
    });

    document.addEventListener("keydown", event => {
      if (!lightbox.classList.contains("active")) return;

      if (event.key === "Escape") close();

      if (event.key === "ArrowLeft") {
        showImage(activeIndex + 1);
      }

      if (event.key === "ArrowRight") {
        showImage(activeIndex - 1);
      }
    });
  }

  /* =========================================
     13. SERVICE CARDS IN MAIN PAGE
  ========================================= */

  const serviceCardMap = {
    "logo-design": "logo-design",
    "logo-redesign": "logo-redesign",
    "visual-identity": "visual-identity",
    "social-media": "social-media"
  };

  serviceCards.forEach(card => {
    card.addEventListener("click", () => {
      const serviceKey = serviceCardMap[card.dataset.service];

      if (serviceKey) {
        selectService(serviceKey);
      }

      document.getElementById("order")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      setTimeout(() => {
        if (serviceKey) {
          const radio = form.querySelector(
            `input[name="service_choice"][value="${serviceKey}"]`
          );

          radio?.focus({ preventScroll: true });
        }
      }, 450);
    });
  });

  /* =========================================
     14. INITIALIZATION
  ========================================= */

  serviceFields.forEach(container => {
    container.hidden = true;

    container.querySelectorAll("input,textarea,select").forEach(control => {
      control.disabled = true;
    });
  });

  renderStep(0);

})();
