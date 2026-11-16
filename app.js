
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
  let toastElement = null;

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
      description: "شاركنا تفاصيل تصميم الشعار والتطبيقات التي تحتاجها في هويتك البصرية."
    },

    "social-media": {
      name: "تصميم سوشيال ميديا",
      price: 300,
      stepTitle: "تفاصيل التصميم",
      description: "حدد المنصات وعدد التصميمات والمحتوى المطلوب."
    }
  };

  const fieldLabels = {
    brand_name: "اسم الشركة أو المشروع",
    industry: "نوع النشاط",
    slogan: "الشعار النصي",
    brand_stage: "حالة المشروع",
    target_audience: "الجمهور المستهدف",
    brand_colors: "ألوان البراند المستخدمة في التصميم",
    logo_type: "نوع الشعار المطلوب",
    brand_personality: "الانطباع المطلوب من الشعار",
    current_logo: "صورة الشعار الحالي",
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

    updateSloganVisibility(serviceKey);

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

    serviceStepTitle.textContent =
      serviceKey === "visual-identity"
        ? "تفاصيل تصميم الشعار"
        : service.stepTitle;

    serviceStepDescription.textContent =
      serviceKey === "visual-identity"
        ? "حدد نوع الشعار والانطباع الذي تريد أن يتركه لدى جمهورك."
        : service.description;

    summaryServiceName.textContent = service.name;
    summaryServicePrice.textContent =
      `${service.price.toLocaleString("en-US")} ج.م`;

    clearErrors(steps[0]);
    clearErrors(steps[2]);

    form.querySelectorAll(".service-option").forEach(option => {
      const optionInput = option.querySelector(
        'input[name="service_choice"]'
      );

      option.classList.toggle("selected", !!optionInput?.checked);
    });
  }

  form.querySelectorAll('input[name="service_choice"]').forEach(radio => {
    radio.addEventListener("change", () => {
      selectService(radio.value);
    });
  });

  /* =========================================
   SLOGAN FIELD — SERVICE VISIBILITY
  ========================================= */

  const sloganField = document
    .getElementById("slogan")
    ?.closest(".field");

  const sloganInput = document.getElementById("slogan");

  function updateSloganVisibility(serviceKey) {
    if (!sloganField || !sloganInput) return;

    const showSlogan = serviceKey !== "social-media";

    sloganField.hidden = !showSlogan;
    sloganInput.disabled = !showSlogan;

    if (!showSlogan) {
      sloganInput.value = "";
    }
  }

  /* =========================================
     4. ERROR HANDLING
  ========================================= */

  function clearErrors(scope = form) {
    scope.querySelectorAll(".is-invalid,.has-error").forEach(element => {
      element.classList.remove("is-invalid", "has-error");
    });

    scope.querySelectorAll(
      ".field-error-message,.group-error-message"
    ).forEach(element => {
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

        showGroupError(
          group,
          "يرجى اختيار الخدمة المناسبة لمشروعك."
        );

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

      if (
        ["button", "submit", "hidden", "reset"].includes(control.type)
      ) {
        return false;
      }

      return true;
    });

    const handledGroups = new Set();

    controls.forEach(control => {
      if (!control.required) return;

      if (
        control.type === "radio" ||
        control.type === "checkbox"
      ) {
        const key = `${control.type}:${control.name}`;

        if (handledGroups.has(key)) return;
        handledGroups.add(key);

        const groupControls = controls.filter(item => {
          return (
            item.name === control.name &&
            item.type === control.type
          );
        });

        const isChecked = groupControls.some(item => item.checked);

        if (!isChecked) {
          const group =
            control.closest(".field") ||
            control.closest(".service-selection-grid") ||
            control.parentElement;

          showGroupError(
            group,
            "يرجى اختيار الإجابة المناسبة."
          );

          firstInvalid ||= group;
        }

        return;
      }

      const value = control.type === "file"
        ? control.files?.length ? control.files[0].name : ""
        : control.value.trim();

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

      } else if (
        control.name === "phone" &&
        !/^01\d{9}$/.test(value)
      ) {
        message =
          "يرجى إدخال رقم واتساب مصري صحيح مكوّن من 11 رقمًا.";

      } else if (!control.checkValidity()) {
        message = control.name === "current_logo"
          ? "يرجى اختيار صورة بصيغة JPG أو PNG."
          : "يرجى مراجعة البيانات المدخلة.";
      }

      if (message) {
        const field =
          control.closest(".field") ||
          control.parentElement;

        showFieldError(field, message);

        firstInvalid ||= field;
      }
    });

    // Service-specific checkbox requirements

    const selectedService = getSelectedService();

    const requiredGroups = {
      "logo-design": {},
      "logo-redesign": {},
      "visual-identity": {
        3: ["identity_items"]
      },
      "social-media": {
        2: ["social_platforms"]
      }
    };

    const groupsForStep =
      requiredGroups[selectedService]?.[index] || [];

    groupsForStep.forEach(name => {
      const groupControls = controls.filter(control => {
        return (
          control.name === name &&
          control.type === "checkbox"
        );
      });

      if (!groupControls.length) return;

      if (!groupControls.some(control => control.checked)) {
        const group = groupControls[0].closest(".field");

        if (group && !group.classList.contains("has-error")) {
          showGroupError(
            group,
            "يرجى اختيار عنصر واحد على الأقل."
          );

          firstInvalid ||= group;
        }
      }
    });

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
    currentStep = Math.max(
      0,
      Math.min(index, steps.length - 1)
    );

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

    const isLastStep = currentStep === steps.length - 1;

    prevButton.hidden = currentStep === 0;
    nextButton.hidden = isLastStep;

    submitButton.hidden = !isLastStep;

    // إزالة أي display inline قديم
    submitButton.style.removeProperty("display");

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
      control.value = control.value
        .replace(/\D/g, "")
        .slice(0, 11);
    }

    const field = control.closest(".field");

    if (field) {
      field.classList.remove("is-invalid");

      field.querySelectorAll(
        ".field-error-message"
      ).forEach(error => {
        error.remove();
      });

      field.querySelectorAll(
        '[aria-invalid="true"]'
      ).forEach(input => {
        input.removeAttribute("aria-invalid");
      });
    }
  });

  form.addEventListener("change", event => {
    const control = event.target;

    const group = control.closest(
      ".field,.service-selection-grid"
    );

    if (group) {
      group.classList.remove("has-error");

      group.querySelectorAll(
        ".group-error-message"
      ).forEach(error => {
        error.remove();
      });

      group.querySelectorAll(
        '[aria-invalid="true"]'
      ).forEach(input => {
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

    // تشغيل تأثير الظهور
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add("is-visible");
      });
    });

    // إخفاء الرسالة بعد 5 ثوانٍ
    setTimeout(() => {
      toast.classList.remove("is-visible");
      toast.classList.add("is-leaving");

      toast.addEventListener("transitionend", (event) => {
        if (event.target !== toast) return;

        toast.remove();
      }, { once: true });

      // حماية في حالة عدم تنفيذ transitionend
      setTimeout(() => {
        toast.remove();
      }, 500);

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
        ["submit", "button", "hidden", "reset", "file"].includes(element.type)
      ) return;

      if (element.name === "service_choice") return;

      if (
        (element.type === "radio" ||
          element.type === "checkbox") &&
        !element.checked
      ) return;

      const value = String(element.value ?? "").trim();

      if (!value) return;

      const label =
        fieldLabels[element.name] || element.name;

      if (values.has(label)) {
        values.set(
          label,
          `${values.get(label)}، ${value}`
        );
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
      const formData = new FormData();

      formData.append("referenceId", referenceId);
      formData.append("service", service.name);
      formData.append("servicePrice", service.price);
      formData.append("payload", JSON.stringify(payload));

      const socialLogoInput = document.getElementById("social-logo");

      if (socialLogoInput?.files?.length) {
        formData.append("logoImage", socialLogoInput.files[0]);
      }

      const response = await fetch("/api/submit", {
        method: "POST",
        body: formData
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "حدثت مشكلة أثناء إرسال الطلب. حاول مرة أخرى."
        );
      }

      form.reset();
      updateSloganVisibility("");

      clearErrors(form);

      serviceFields.forEach(container => {
        container.hidden = true;

        container.querySelectorAll(
          "input,textarea,select"
        ).forEach(control => {
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

      if (
        submitLabel.textContent === "جاري إرسال الطلب..."
      ) {
        submitLabel.textContent = "إرسال الطلب";
      }
    }
  });

  /* =========================================
     12. PORTFOLIO LIGHTBOX
  ========================================= */

  const lightbox = document.getElementById("image-lightbox");
  const slider = document.getElementById("lightbox-slider");

  const galleryImages = [
    ...document.querySelectorAll(".portfolio-image img")
  ];

  let portfolioSwiper = null;

  if (lightbox && slider && galleryImages.length) {

    const prevButton =
      lightbox.querySelector("#lightbox-prev");

    const nextButton =
      lightbox.querySelector("#lightbox-next");

    const closeButton =
      lightbox.querySelector(".lightbox-close");

    const pagination =
      lightbox.querySelector(".swiper-pagination");

    // إنشاء شرائح الصور
    galleryImages.forEach(image => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";

      const slideImage = document.createElement("img");
      slideImage.src = image.currentSrc || image.src;
      slideImage.alt = image.alt || "معاينة الصورة";
      slideImage.draggable = false;

      const imageFrame = document.createElement("div");
      imageFrame.className = "lightbox-image-frame";

      imageFrame.appendChild(slideImage);
      slide.appendChild(imageFrame);

      slider.appendChild(slide);
    });

    // فتح المعاينة
    function openLightbox(index) {
      lightbox.classList.add("active");
      document.body.classList.add("lightbox-open");

      if (!portfolioSwiper) {
        portfolioSwiper = new Swiper(
          lightbox.querySelector(".portfolio-swiper"),
          {
            initialSlide: index,
            slidesPerView: 1,
            spaceBetween: 0,
            speed: 350,

            loop: false,
            rewind: false,

            resistance: true,
            resistanceRatio: 0.70,
            touchRatio: 1,
            touchReleaseOnEdges: false,

            direction: "horizontal",

            pagination: {
              el: pagination,
              clickable: true
            },

            keyboard: {
              enabled: false,
              onlyInViewport: false
            }
          }
        );

      } else {
        portfolioSwiper.update();
        portfolioSwiper.slideTo(index, 0);
      }

      portfolioSwiper.keyboard.enable();
    }

    // إغلاق المعاينة
    function closeLightbox() {
      lightbox.classList.remove("active");
      document.body.classList.remove("lightbox-open");

      if (portfolioSwiper) {
        portfolioSwiper.keyboard.disable();
      }
    }

    // الأسهم - ربط مباشر
    prevButton?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      if (portfolioSwiper) {
        portfolioSwiper.slidePrev();
      }
    });

    nextButton?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      if (portfolioSwiper) {
        portfolioSwiper.slideNext();
      }
    });

    // فتح الصور
    galleryImages.forEach((image, index) => {
      image.addEventListener("click", () => {
        openLightbox(index);
      });
    });

    // زر الإغلاق
    closeButton?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      closeLightbox();
    });

    // // إغلاق عند الضغط خارج الصورة - موبايل فقط
    // lightbox.addEventListener("click", (event) => {
    //   if (window.innerWidth > 768) return;

    //   // تجاهل الضغط على الأسهم أو زر الإغلاق
    //   if (
    //     event.target.closest(".lightbox-nav") ||
    //     event.target.closest(".lightbox-close")
    //   ) {
    //     return;
    //   }

    //   // تجاهل الضغط على الصورة نفسها
    //   if (event.target.closest(".portfolio-swiper img")) {
    //     return;
    //   }

    //   // إغلاق عند الضغط خارج الصورة
    //   closeLightbox();
    // });

    // إغلاق باستخدام Escape
    document.addEventListener("keydown", event => {
      if (!lightbox.classList.contains("active")) return;

      if (event.key === "Escape") {
        closeLightbox();
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
      const serviceKey =
        serviceCardMap[card.dataset.service];

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
     IMAGE UPLOAD — FILE NAME
  ========================================= */

  const logoInput = document.getElementById("current-logo");
  const uploadFileName = document.getElementById("upload-file-name");

  if (logoInput && uploadFileName) {
    logoInput.addEventListener("change", () => {
      const file = logoInput.files?.[0];

      uploadFileName.textContent = file
        ? `تم اختيار: ${file.name}`
        : "لم يتم اختيار أي صورة";

      uploadFileName.classList.toggle("has-file", !!file);
    });
  }

  /* =========================================
     14. INITIALIZATION
  ========================================= */

  serviceFields.forEach(container => {
    container.hidden = true;

    container.querySelectorAll(
      "input,textarea,select"
    ).forEach(control => {
      control.disabled = true;
    });
  });

  renderStep(0);

})();

/* =========================================
   HELIOCORD — GLOBAL SCROLL REVEAL
   Smooth reveal for all page sections
========================================= */

(() => {
  "use strict";

  // العناصر التي سيظهر عليها التأثير
  const revealGroups = [
    {
      selector: ".hero-side",
      delay: 100
    },
    {
      selector: ".services-section .section-heading",
      delay: 0
    },
    {
      selector: ".services-grid .service-card",
      delay: 110
    },
    {
      selector: ".portfolio-section .section-heading",
      delay: 0
    },
    {
      selector: ".portfolio-grid .portfolio-item",
      delay: 110
    },
    {
      selector: ".brief-intro",
      delay: 0
    },
    {
      selector: ".brief-section .form-card",
      delay: 100
    }
  ];

  const elements = [];

  revealGroups.forEach((group) => {
    const items = document.querySelectorAll(group.selector);

    items.forEach((item, index) => {
      item.classList.add("reveal-item");

      const delay = group.delay
        ? index * group.delay
        : 0;

      item.style.setProperty(
        "--reveal-delay",
        `${delay}ms`
      );

      elements.push(item);
    });
  });

  if (!elements.length) return;

  // في حالة عدم دعم IntersectionObserver
  if (!("IntersectionObserver" in window)) {
    elements.forEach((item) => {
      item.classList.add("is-revealed");
    });

    return;
  }

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-revealed");

        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.08,
      rootMargin: "0px 0px -45px 0px"
    }
  );

  // تفعيل الإخفاء بعد تجهيز العناصر والمراقب
  document.documentElement.classList.add(
    "js-reveal-enabled"
  );

  elements.forEach((item) => {
    observer.observe(item);
  });

})();
