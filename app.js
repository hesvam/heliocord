
/* =========================================
   HELIOCORD — LOGO DESIGN FORM
   Text-Only Submission
========================================= */

/* =========================================
   1. FORM ELEMENTS
========================================= */

const form = document.getElementById("logo-design-form");
const submitButton = document.getElementById("submit-button");
const submitLabel = document.getElementById("submit-label");
const statusBox = document.getElementById("form-status");

/* =========================================
   2. GENERAL HELPERS
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
      })[char]
  );
}

function getFieldLabel(element) {
  // اختيار Radio أو Checkbox
  if (["radio", "checkbox"].includes(element.type)) {
    const optionLabel = element.closest("label");

    if (optionLabel) {
      const clonedLabel = optionLabel.cloneNode(true);

      clonedLabel.querySelectorAll("input, small").forEach((item) => {
        item.remove();
      });

      return clonedLabel.innerText.replace(/\s+/g, " ").trim();
    }
  }

  // الحقول العادية
  const wrapper = element.closest(".field");

  if (wrapper) {
    const label = wrapper.querySelector(":scope > label");

    if (label) {
      const clonedLabel = label.cloneNode(true);

      clonedLabel
        .querySelectorAll("small, .optional-label")
        .forEach((item) => item.remove());

      return clonedLabel.innerText.replace(/\s+/g, " ").trim();
    }
  }

  const associatedLabel = element.labels?.[0];

  if (associatedLabel) {
    const clonedLabel = associatedLabel.cloneNode(true);

    clonedLabel
      .querySelectorAll("small, .optional-label")
      .forEach((item) => item.remove());

    return clonedLabel.innerText.replace(/\s+/g, " ").trim();
  }

  return element.name || element.id || "بيانات إضافية";
}

/* =========================================
   3. PORTFOLIO IMAGE LIGHTBOX
   Outside Click + Swipe Navigation
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const lightbox = document.getElementById("image-lightbox");
  const lightboxImage = document.getElementById("lightbox-image");

  const galleryImages = Array.from(
    document.querySelectorAll(".portfolio-image img")
  );

  if (!lightbox || !lightboxImage || !galleryImages.length) return;

  let currentImageIndex = 0;
  let startX = 0;
  let startY = 0;
  let isDragging = false;
  let suppressClick = false;
  let suppressClickTimeout = null;

  const swipeThreshold = 50;

  function showImage(index) {
    if (index < 0) {
      index = galleryImages.length - 1;
    }

    if (index >= galleryImages.length) {
      index = 0;
    }

    currentImageIndex = index;

    lightboxImage.src = galleryImages[index].src;
    lightboxImage.alt =
      galleryImages[index].alt || "معاينة الصورة";
  }

  function openLightbox(index) {
    showImage(index);

    lightbox.classList.add("active");
    document.body.classList.add("lightbox-open");
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
    document.body.classList.remove("lightbox-open");

    isDragging = false;
    suppressClick = false;

    if (suppressClickTimeout) {
      clearTimeout(suppressClickTimeout);
      suppressClickTimeout = null;
    }
  }

  function showNextImage() {
    showImage(currentImageIndex + 1);
  }

  function showPreviousImage() {
    showImage(currentImageIndex - 1);
  }

  galleryImages.forEach((image, index) => {
    image.addEventListener("click", () => {
      openLightbox(index);
    });
  });

  /* DETECT VISIBLE IMAGE AREA */

  function isInsideVisibleImage(event) {
    const rect = lightboxImage.getBoundingClientRect();

    const naturalWidth = lightboxImage.naturalWidth;
    const naturalHeight = lightboxImage.naturalHeight;

    if (!naturalWidth || !naturalHeight) return true;

    const imageRatio = naturalWidth / naturalHeight;
    const containerRatio = rect.width / rect.height;

    let visibleWidth;
    let visibleHeight;

    if (imageRatio > containerRatio) {
      visibleWidth = rect.width;
      visibleHeight = rect.width / imageRatio;
    } else {
      visibleHeight = rect.height;
      visibleWidth = rect.height * imageRatio;
    }

    const left = rect.left + (rect.width - visibleWidth) / 2;
    const top = rect.top + (rect.height - visibleHeight) / 2;

    const right = left + visibleWidth;
    const bottom = top + visibleHeight;

    return (
      event.clientX >= left &&
      event.clientX <= right &&
      event.clientY >= top &&
      event.clientY <= bottom
    );
  }

  /* CLOSE OUTSIDE IMAGE */

  lightbox.addEventListener("click", (event) => {
    if (suppressClick) {
      suppressClick = false;

      if (suppressClickTimeout) {
        clearTimeout(suppressClickTimeout);
        suppressClickTimeout = null;
      }

      return;
    }

    if (!lightbox.classList.contains("active")) return;

    if (
      event.target === lightboxImage &&
      isInsideVisibleImage(event)
    ) {
      return;
    }

    closeLightbox();
  });

  /* SWIPE NAVIGATION */

  lightbox.addEventListener("pointerdown", (event) => {
    if (!lightbox.classList.contains("active")) return;

    if (event.pointerType === "mouse" && event.button !== 0) return;

    startX = event.clientX;
    startY = event.clientY;

    isDragging = true;
  });

  lightbox.addEventListener("pointerup", (event) => {
    if (!isDragging) return;

    isDragging = false;

    const differenceX = event.clientX - startX;
    const differenceY = event.clientY - startY;

    if (Math.abs(differenceX) < swipeThreshold) return;
    if (Math.abs(differenceX) < Math.abs(differenceY)) return;

    suppressClick = true;

    if (suppressClickTimeout) {
      clearTimeout(suppressClickTimeout);
    }

    suppressClickTimeout = setTimeout(() => {
      suppressClick = false;
      suppressClickTimeout = null;
    }, 500);

    if (differenceX < 0) {
      showNextImage();
    } else {
      showPreviousImage();
    }
  });

  lightbox.addEventListener("pointercancel", () => {
    isDragging = false;
  });

  /* KEYBOARD NAVIGATION */

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("active")) return;

    if (event.key === "Escape") {
      closeLightbox();
    }

    if (event.key === "ArrowLeft") {
      showNextImage();
    }

    if (event.key === "ArrowRight") {
      showPreviousImage();
    }
  });
});

/* =========================================
   4. FORM VALIDATION
========================================= */

function clearValidationErrors() {
  if (!form) return;

  form.querySelectorAll(".is-invalid").forEach((element) => {
    element.classList.remove("is-invalid");
  });

  form.querySelectorAll(".has-error").forEach((element) => {
    element.classList.remove("has-error");
  });

  form
    .querySelectorAll(".field-error-message, .group-error-message")
    .forEach((message) => message.remove());

  form.querySelectorAll('[aria-invalid="true"]').forEach((element) => {
    element.removeAttribute("aria-invalid");
  });
}

function showFieldError(field, message) {
  if (!field) return;

  field.classList.add("is-invalid");

  const input = field.querySelector("input, select, textarea");

  if (input) {
    input.setAttribute("aria-invalid", "true");
  }

  const error = document.createElement("span");

  error.className = "field-error-message";
  error.textContent = message;

  field.appendChild(error);
}

function showGroupError(group, message) {
  if (!group) return;

  group.classList.add("has-error");

  group.querySelectorAll("input").forEach((input) => {
    input.setAttribute("aria-invalid", "true");
  });

  const error = document.createElement("span");

  error.className = "group-error-message";
  error.textContent = message;

  group.insertAdjacentElement("afterend", error);
}

function getElementsByName(name) {
  if (!form) return [];

  return Array.from(form.elements).filter(
    (element) => element.name === name
  );
}

/* =========================================
   5. CUSTOM ERROR MESSAGES
========================================= */

function getCustomErrorMessage(element) {
  const messages = {
    brand_name: "يرجى إدخال اسم الشركة.",
    industry: "يرجى تحديد نوع النشاط التجاري.",
    client_name: "يرجى إدخال اسمك بالكامل.",
    phone: "يرجى إدخال رقم واتساب مكوّن من 11 رقمًا.",
  };

  if (element.name === "logo_type") {
    return "يرجى اختيار نوع الشعار المناسب.";
  }

  if (element.validity.valueMissing) {
    return messages[element.name] || "يرجى استكمال هذا الحقل.";
  }

  if (element.name === "phone" && !element.validity.valid) {
    return "رقم واتساب يجب أن يتكون من 11 رقمًا بالضبط.";
  }

  return messages[element.name] || "يرجى مراجعة البيانات المدخلة.";
}

function getValidationMessage(element) {
  if (element.validity.valueMissing) {
    return getCustomErrorMessage(element);
  }

  if (element.validity.patternMismatch) {
    if (element.name === "phone") {
      return "يرجى إدخال رقم واتساب مكوّن من 11 رقمًا.";
    }

    return "يرجى إدخال البيانات بالتنسيق الصحيح.";
  }

  if (element.validity.tooShort || element.validity.tooLong) {
    if (element.name === "phone") {
      return "رقم واتساب يجب أن يتكون من 11 رقمًا بالضبط.";
    }

    return "عدد الأحرف المدخل غير صحيح.";
  }

  if (element.validity.typeMismatch) {
    return "يرجى إدخال قيمة صحيحة.";
  }

  return "يرجى مراجعة هذا الحقل.";
}

/* =========================================
   6. VALIDATE FORM
========================================= */

function validateForm() {
  if (!form) return false;

  clearValidationErrors();

  const invalidItems = [];

  /* REQUIRED RADIO GROUPS */

  const requiredRadioGroups = new Set();

  form
    .querySelectorAll('input[type="radio"][required]')
    .forEach((radio) => {
      if (radio.name) {
        requiredRadioGroups.add(radio.name);
      }
    });

  requiredRadioGroups.forEach((name) => {
    const radios = getElementsByName(name).filter(
      (element) => element.type === "radio"
    );

    if (!radios.some((radio) => radio.checked)) {
      const group = radios[0]?.closest(".choice-grid");

      showGroupError(
        group,
        name === "logo_type"
          ? "يرجى اختيار نوع الشعار المناسب."
          : "يرجى اختيار أحد الخيارات."
      );

      invalidItems.push({
        element: group,
        focusElement: radios[0],
      });
    }
  });

  /* REQUIRED CHECKBOX GROUPS */

  const requiredCheckboxGroups = new Set();

  form
    .querySelectorAll('input[type="checkbox"][required]')
    .forEach((checkbox) => {
      if (checkbox.name) {
        requiredCheckboxGroups.add(checkbox.name);
      }
    });

  requiredCheckboxGroups.forEach((name) => {
    const checkboxes = getElementsByName(name).filter(
      (element) => element.type === "checkbox"
    );

    if (!checkboxes.some((checkbox) => checkbox.checked)) {
      const group = checkboxes[0]?.closest(
        ".choice-grid, .checkbox-grid"
      );

      showGroupError(
        group,
        "يرجى اختيار خيار واحد على الأقل."
      );

      invalidItems.push({
        element: group,
        focusElement: checkboxes[0],
      });
    }
  });

  /* REQUIRED NORMAL FIELDS */

  const requiredFields = form.querySelectorAll(
    "input[required], select[required], textarea[required]"
  );

  requiredFields.forEach((element) => {
    if (["radio", "checkbox"].includes(element.type)) return;

    if (!element.checkValidity()) {
      const field = element.closest(".field");

      showFieldError(field, getValidationMessage(element));

      invalidItems.push({
        element: field,
        focusElement: element,
      });
    }
  });

  /* SHOW FIRST ERROR */

  if (invalidItems.length > 0) {
    const firstInvalid = invalidItems[0];

    firstInvalid.element?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    window.setTimeout(() => {
      firstInvalid.focusElement?.focus({
        preventScroll: true,
      });
    }, 350);

    return false;
  }

  return true;
}

/* =========================================
   7. CLEAR ERRORS WHILE EDITING
========================================= */

function clearFieldError(element) {
  const field = element.closest(".field");

  if (!field) return;

  if (element.checkValidity()) {
    field.classList.remove("is-invalid");

    field.querySelector(".field-error-message")?.remove();

    element.removeAttribute("aria-invalid");
  }
}

function clearGroupError(element) {
  const group = element.closest(
    ".choice-grid, .checkbox-grid"
  );

  if (!group) return;

  const isChecked = group.querySelector("input:checked");

  if (isChecked) {
    group.classList.remove("has-error");

    if (
      group.nextElementSibling?.classList.contains(
        "group-error-message"
      )
    ) {
      group.nextElementSibling.remove();
    }

    group.querySelectorAll('[aria-invalid="true"]').forEach((input) => {
      input.removeAttribute("aria-invalid");
    });
  }
}

if (form) {
  form.addEventListener("input", (event) => {
    const element = event.target;

    if (
      element.matches("input, select, textarea") &&
      !["radio", "checkbox", "file"].includes(element.type)
    ) {
      clearFieldError(element);
    }
  });

  form.addEventListener("change", (event) => {
    const element = event.target;

    if (
      element.matches(
        'input[type="radio"], input[type="checkbox"]'
      )
    ) {
      clearGroupError(element);
      return;
    }

    if (element.matches("input, select, textarea")) {
      clearFieldError(element);
    }
  });
}

/* =========================================
   8. COLLECT FORM ANSWERS
========================================= */

function collectAnswers() {
  if (!form) return [];

  const answers = [];
  const grouped = new Map();

  const elements = form.querySelectorAll(
    "input, textarea, select"
  );

  for (const element of elements) {
    if (
      element.disabled ||
      ["submit", "button", "reset"].includes(element.type)
    ) {
      continue;
    }

    const key = element.name || element.id;

    if (!key) continue;

    /* IGNORE UNCHECKED OPTIONS */

    if (
      ["checkbox", "radio"].includes(element.type) &&
      !element.checked
    ) {
      continue;
    }

    let value = String(element.value ?? "").trim();

    if (!value) continue;

    let label = getFieldLabel(element);

    /* CHOICE LABELS */

    if (["checkbox", "radio"].includes(element.type)) {
      value = getFieldLabel(element);
    }

    /* CUSTOM FIELD LABELS */

    const customLabels = {
      brand_name: "اسم الشركة",
      industry: "نوع النشاط",
      slogan: "الشعار النصي",
      logo_type: "نوع الشعار المطلوب",
      target_audience: "الجمهور المستهدف",
      brand_personality: "شخصية العلامة التجارية",
      reference_links: "لينكات التصميمات المرجعية",
      reference_description: "وصف التصميمات المرجعية",
      avoid_elements: "العناصر والأفكار غير المرغوبة",
      additional_notes: "ملاحظات إضافية",
      client_name: "الاسم بالكامل",
      phone: "رقم واتساب",
    };

    if (customLabels[key]) {
      label = customLabels[key];
    }

    /* GROUP REPEATED CHECKBOX ANSWERS */

    if (grouped.has(key)) {
      const existing = grouped.get(key);

      const existingValues = existing.value
        .split("، ")
        .map((item) => item.trim());

      if (!existingValues.includes(value)) {
        existing.value += `، ${value}`;
      }

    } else {
      const item = {
        label,
        value,
      };

      grouped.set(key, item);
      answers.push(item);
    }
  }

  return answers;
}

/* =========================================
   9. REFERENCE NUMBER
========================================= */

function createReferenceId() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

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

  return `HC-${year}${month}${day}-${randomPart}`;
}


/* =========================================
   10. STATUS MESSAGES
========================================= */

/* =========================================
   STACKED TOAST NOTIFICATIONS
========================================= */

let toastTimeout = null;
let toastSwapTimeout = null;
let toastRemoveTimeout = null;

function setStatus(message, success = false) {
  if (!statusBox) return;

  clearTimeout(toastTimeout);
  clearTimeout(toastSwapTimeout);
  clearTimeout(toastRemoveTimeout);

  // إخفاء الرسائل السابقة عند طلب المسح
  if (!message) {
    statusBox.replaceChildren();
    return;
  }

  // الاحتفاظ بآخر رسالة فقط قبل إضافة الجديدة
  const previousToasts = Array.from(statusBox.children);

  previousToasts.slice(0, -1).forEach((toast) => {
    toast.remove();
  });

  const previousToast = statusBox.lastElementChild;

  if (previousToast) {
    previousToast.classList.remove(
      "is-old",
      "is-leaving",
      "is-waiting"
    );
  }

  const toast = document.createElement("div");

  toast.className = "toast-item";

  if (previousToast) {
    toast.classList.add("is-waiting");
  }

  const icon = success
    ? "ri-checkbox-circle-fill"
    : "ri-error-warning-fill";

  toast.dataset.state = success ? "success" : "error";

  toast.innerHTML = `
        <i class="${icon}" aria-hidden="true"></i>
        <span></span>
    `;

  toast.querySelector("span").textContent = message;

  statusBox.appendChild(toast);

  // إظهار الرسالة الجديدة
  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  // تحريك الرسالة القديمة للخروج
  if (previousToast) {
    previousToast.classList.add("is-old");

    toastSwapTimeout = setTimeout(() => {
      previousToast.classList.add("is-leaving");
      toast.classList.remove("is-waiting");

      toastRemoveTimeout = setTimeout(() => {
        previousToast.remove();
      }, 350);

    }, 650);
  }

  // إخفاء الرسالة الحالية تلقائياً
  toastTimeout = setTimeout(() => {
    const currentToast = statusBox.lastElementChild;

    if (!currentToast) return;

    currentToast.classList.add("is-leaving");

    setTimeout(() => {
      currentToast.remove();
    }, 350);

  }, 5000);
}

/* =========================================
   12. SUBMIT FORM — TEXT ONLY
========================================= */

if (form && submitButton && submitLabel) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (submitButton.disabled) return;

    setStatus("");

    if (!validateForm()) {
      setStatus(
        "يرجى مراجعة البيانات المطلوبة وتصحيح الأخطاء الموضحة.",
        false
      );

      return;
    }

    submitButton.disabled = true;
    submitLabel.textContent = "جاري إرسال طلبك...";

    try {
      const answers = collectAnswers();
      const referenceId = createReferenceId();

      const response = await fetch("/api/submit", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          referenceId,
          payload: answers,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "لم نتمكن من إرسال طلبك."
        );
      }

      // تفريغ جميع حقول الفورم
      form.reset();

      // إزالة أخطاء التحقق السابقة
      clearValidationErrors();

      // إظهار رسالة النجاح فقط
      setStatus(
        "تم استلام طلبك بنجاح! شكرًا لثقتك في HELIOCORD.",
        true
      );

    } catch (error) {
      console.error("Brief submission failed:", error);

      setStatus(
        error instanceof Error && error.message
          ? error.message
          : "حدث خطأ أثناء الإرسال. تحقق من اتصال الإنترنت وحاول مجددًا."
      );

      submitLabel.textContent = "إعادة محاولة الإرسال";

    } finally {
      submitButton.disabled = false;

      if (submitLabel.textContent === "جاري إرسال طلبك...") {
        submitLabel.textContent = "اطلب الآن";
      }
    }
  });

} else if (document.body.classList.contains("logo-design-page")) {
  console.error(
    "Logo design form initialization failed. Check HTML IDs: logo-design-form, submit-button, submit-label."
  );
}
