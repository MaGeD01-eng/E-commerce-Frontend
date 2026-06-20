/* ====================================
   بناء وتحديث النافبار حسب حالة اليوزر
   ==================================== */

function renderNavbar() {
  const mount = document.getElementById("navbar");
  if (!mount) return;

  const user = getCurrentUser();
  const loggedIn = isLoggedIn();
  const admin = isAdmin();

  mount.innerHTML = `
    <nav class="navbar">
      <div class="container navbar__inner">
        <a href="index.html" class="navbar__logo">متجري<span>.</span></a>

        <button class="navbar__toggle" id="navbar-toggle" aria-label="فتح القائمة">
          <span></span><span></span><span></span>
        </button>

        <div class="navbar__links" id="navbar-links">
          <a href="index.html" class="navbar__link">الرئيسية</a>
          <a href="shop.html" class="navbar__link">المتجر</a>
          ${loggedIn ? `<a href="my-orders.html" class="navbar__link">طلباتي</a>` : ""}
          ${admin ? `<a href="admin.html" class="navbar__link navbar__link--admin">لوحة التحكم</a>` : ""}
        </div>

        <div class="navbar__actions">
          ${
            loggedIn
              ? `
                <span class="navbar__user">مرحباً، ${user?.name?.split(" ")[0] || "بك"}</span>
                <button class="btn btn--ghost btn--sm" id="logout-btn">خروج</button>
              `
              : `
                <a href="login.html" class="btn btn--ghost btn--sm">دخول</a>
                <a href="register.html" class="btn btn--primary btn--sm">حساب جديد</a>
              `
          }
        </div>
      </div>
    </nav>
  `;

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  const toggle = document.getElementById("navbar-toggle");
  const links = document.getElementById("navbar-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      links.classList.toggle("is-open");
      toggle.classList.toggle("is-active");
    });
  }

  // تمييز الرابط الحالي
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".navbar__link").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("is-active");
    }
  });
}

document.addEventListener("DOMContentLoaded", renderNavbar);