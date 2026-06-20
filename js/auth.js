/* ====================================
   نظام الدخول / التسجيل / الجلسة
   ==================================== */

/**
 * يخزن بيانات الجلسة بعد تسجيل دخول ناجح أو حساب جديد
 */
function saveSession(token, user) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

/**
 * يمسح الجلسة بالكامل (تسجيل خروج)
 */
function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

/**
 * يرجع بيانات اليوزر المسجل دخوله حالياً (أو null)
 */
function getCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function isLoggedIn() {
  return !!getToken();
}

function isAdmin() {
  const user = getCurrentUser();
  return !!user && user.role === "admin";
}

function logout() {
  clearSession();
  window.location.href = "index.html";
}

/**
 * حارس صفحة: يمنع دخول صفحة معينة لو الشرط مش متحقق
 * يُستخدم في أول كل صفحة محمية (my-orders.html, admin.html)
 */
function guardPage({ requireAuth = false, requireAdmin = false } = {}) {
  if (requireAuth && !isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }
  if (requireAdmin && !isAdmin()) {
    window.location.href = "index.html";
    return;
  }
}

/* ====================================
   ربط فورم تسجيل الدخول (لو موجود في الصفحة)
   ==================================== */
function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector("button[type='submit']");

    const email = form.email.value.trim();
    const password = form.password.value;

    setButtonLoading(submitBtn, true, "جاري الدخول...");

    try {
      const res = await api.auth.login({ email, password });
      saveSession(res.token, res.data);
      showToast("تم تسجيل الدخول بنجاح", "success");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 600);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      setButtonLoading(submitBtn, false);
    }
  });
}

/* ====================================
   ربط فورم إنشاء حساب (لو موجود في الصفحة)
   ==================================== */
function initRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector("button[type='submit']");

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;

    setButtonLoading(submitBtn, true, "جاري إنشاء الحساب...");

    try {
      const res = await api.auth.register({ name, email, password });
      saveSession(res.token, res.data);
      showToast("تم إنشاء الحساب بنجاح", "success");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 600);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      setButtonLoading(submitBtn, false);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLoginForm();
  initRegisterForm();
});