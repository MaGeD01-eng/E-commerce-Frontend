/* ====================================
   منطق صفحة تفاصيل المنتج + عمل الأوردر
   ==================================== */

let currentProduct = null;
let selectedImageIndex = 0;

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadProductDetails() {
  const container = document.getElementById("product-details-content");
  const id = getProductIdFromUrl();

  if (!id) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><p class="empty-state__text">لم يتم تحديد منتج</p></div>`;
    return;
  }

  try {
    const res = await api.products.getById(id);
    currentProduct = res.data;
    renderProductDetails(currentProduct);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">😕</div><p class="empty-state__text">المنتج غير موجود</p></div>`;
  }
}

function renderProductDetails(p) {
  document.title = `${p.title} | متجري`;

  const images = (p.image && p.image.length > 0) ? p.image : [null];
  const isOut = p.quantity <= 0;

  const container = document.getElementById("product-details-content");
  container.innerHTML = `
    <div class="product-details__grid">
      <div class="product-gallery">
        <div class="product-gallery__main">
          <img id="gallery-main-img" src="${imageUrlOf(images[0])}" alt="${p.title}" />
        </div>
        ${images.length > 1 ? `
          <div class="product-gallery__thumbs">
            ${images.map((img, i) => `
              <div class="product-gallery__thumb ${i === 0 ? "is-active" : ""}" data-index="${i}">
                <img src="${imageUrlOf(img)}" alt="${p.title} ${i + 1}" />
              </div>
            `).join("")}
          </div>
        ` : ""}
      </div>

      <div class="product-info">
        <span class="product-info__category">${p.category?.title || ""}</span>
        <h1 class="product-info__title">${p.title}</h1>
        <div class="product-info__price">${p.price} ج.م</div>

        <span class="product-info__stock ${isOut ? "product-info__stock--out" : "product-info__stock--in"}">
          ${isOut ? "نفذت الكمية حالياً" : `متوفر — ${p.quantity} قطعة`}
        </span>

        <div class="product-info__divider"></div>

        ${isOut ? `
          <button class="btn btn--ghost btn--block" disabled>غير متوفر حالياً</button>
        ` : `
          <label style="display:block; font-weight:600; font-size: var(--text-sm); margin-bottom: var(--space-2);">الكمية</label>
          <div class="qty-stepper">
            <button type="button" id="qty-minus">−</button>
            <input type="number" id="qty-input" value="1" min="1" max="${p.quantity}" />
            <button type="button" id="qty-plus">+</button>
          </div>

          <button class="btn btn--primary btn--block" id="order-now-btn">اطلب الآن</button>
        `}
      </div>
    </div>
  `;

  // تبديل الصور
  container.querySelectorAll(".product-gallery__thumb").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const index = parseInt(thumb.dataset.index);
      document.getElementById("gallery-main-img").src = imageUrlOf(images[index]);
      container.querySelectorAll(".product-gallery__thumb").forEach((t) => t.classList.remove("is-active"));
      thumb.classList.add("is-active");
    });
  });

  if (!isOut) {
    setupQuantityStepper(p.quantity);
    document.getElementById("order-now-btn").addEventListener("click", openOrderModal);
  }
}

function imageUrlOf(imagePath) {
  if (!imagePath) return "assets/img/placeholder.svg";
  return `${BASE_URL}/${imagePath}`;
}

function setupQuantityStepper(maxQty) {
  const input = document.getElementById("qty-input");
  document.getElementById("qty-minus").addEventListener("click", () => {
    const val = Math.max(1, parseInt(input.value) - 1);
    input.value = val;
  });
  document.getElementById("qty-plus").addEventListener("click", () => {
    const val = Math.min(maxQty, parseInt(input.value) + 1);
    input.value = val;
  });
  input.addEventListener("change", () => {
    let val = parseInt(input.value) || 1;
    val = Math.max(1, Math.min(maxQty, val));
    input.value = val;
  });
}

/* ====================================
   مودال تأكيد الطلب
   ==================================== */

function openOrderModal() {
  if (!isLoggedIn()) {
    showToast("سجّل الدخول أولاً لإتمام الطلب", "info");
    setTimeout(() => (window.location.href = "login.html"), 1000);
    return;
  }

  const qty = parseInt(document.getElementById("qty-input").value) || 1;
  const total = (currentProduct.price * qty).toFixed(2);

  const overlay = document.getElementById("order-modal-overlay");
  document.getElementById("modal-qty-display").textContent = qty;
  document.getElementById("modal-total-display").textContent = `${total} ج.م`;
  document.getElementById("shipping-address-input").value = "";

  overlay.classList.add("is-open");
}

function closeOrderModal() {
  document.getElementById("order-modal-overlay").classList.remove("is-open");
}

async function confirmOrder() {
  const addressInput = document.getElementById("shipping-address-input");
  const address = addressInput.value.trim();

  if (!address) {
    showToast("من فضلك أدخل عنوان الشحن", "error");
    return;
  }

  const qty = parseInt(document.getElementById("qty-input").value) || 1;
  const confirmBtn = document.getElementById("confirm-order-btn");

  setButtonLoading(confirmBtn, true, "جاري إرسال الطلب...");

  try {
    await api.orders.create({
      products: [{ oneproduct: currentProduct._id, quantity: qty }],
      shippingAddress: { address },
    });

    closeOrderModal();
    showToast("تم إنشاء طلبك بنجاح!", "success");
    setTimeout(() => (window.location.href = "my-orders.html"), 1200);
  } catch (err) {
    showToast(getErrorMessage(err), "error");
    setButtonLoading(confirmBtn, false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProductDetails();

  const closeBtn = document.getElementById("close-modal-btn");
  const cancelBtn = document.getElementById("cancel-order-btn");
  const confirmBtn = document.getElementById("confirm-order-btn");
  const overlay = document.getElementById("order-modal-overlay");

  if (closeBtn) closeBtn.addEventListener("click", closeOrderModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeOrderModal);
  if (confirmBtn) confirmBtn.addEventListener("click", confirmOrder);
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeOrderModal();
    });
  }
});