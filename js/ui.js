/* ====================================
   مساعدات واجهة عامة: Toast + Loading
   تُستخدم في كل صفحات المشروع
   ==================================== */

/**
 * يعرض رسالة Toast مؤقتة في أسفل الشاشة
 * @param {string} message
 * @param {"success"|"error"|"info"} type
 */
function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // اختفاء تلقائي
  setTimeout(() => {
    toast.classList.add("toast--leaving");
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

/**
 * يحول رسالة خطأ الـ API (اللي بنرميها من apiRequest) لنص واضح
 */
function getErrorMessage(err) {
  if (err && err.statusCode === 0) return err.message;
  if (err && err.message) return err.message;
  return "حدث خطأ غير متوقع، حاول مرة أخرى.";
}

/**
 * تفعيل/تعطيل حالة "تحميل" على زرار (يمنع الضغط المتكرر + يبدّل النص)
 */
function setButtonLoading(button, isLoading, loadingText = "جاري التحميل...") {
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    button.classList.add("is-loading");
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.classList.remove("is-loading");
  }
}

/**
 * يبني عنصر "حالة فارغة" (مفيش بيانات) موحّد الشكل
 */
function renderEmptyState(container, message, icon = "📭") {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state__icon">${icon}</div>
      <p class="empty-state__text">${message}</p>
    </div>
  `;
}

/**
 * يبني سكيلتون تحميل بسيط (placeholders) داخل container
 */
function renderLoadingSkeleton(container, count = 6) {
  let html = "";
  for (let i = 0; i < count; i++) {
    html += `<div class="skeleton-card"></div>`;
  }
  container.innerHTML = html;
}