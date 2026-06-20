/* ====================================
   منطق الصفحة الرئيسية
   ==================================== */

/**
 * يبني HTML لكارت منتج واحد (دالة مشتركة هنستخدمها برضو في shop.js)
 */
function renderProductCard(p) {
  const imageUrl = (p.image && p.image[0])
    ? `${BASE_URL}/${p.image[0]}`
    : "assets/img/placeholder.svg";

  const isOut = p.quantity <= 0;

  return `
    <a href="product.html?id=${p._id}" class="product-card">
      <div class="product-card__image-wrap">
        <img src="${imageUrl}" alt="${p.title}" class="product-card__image" loading="lazy" />
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${p.category?.title || "منتج"}</span>
        <h3 class="product-card__title">${p.title}</h3>
        <div class="product-card__footer">
          <span class="product-card__price">${p.price} ج.م</span>
          <span class="product-card__stock ${isOut ? "product-card__stock--out" : ""}">
            ${isOut ? "نفذت الكمية" : `متبقي ${p.quantity}`}
          </span>
        </div>
      </div>
    </a>
  `;
}

async function loadFeaturedProducts() {
  const grid = document.getElementById("featured-products");
  if (!grid) return;

  renderLoadingSkeleton(grid, 8);

  try {
    const res = await api.products.getAll(1, 8);
    grid.innerHTML = res.data.map(renderProductCard).join("");
  } catch (err) {
    renderEmptyState(grid, "لا توجد منتجات متاحة حالياً", "🛍️");
  }
}

async function loadCategories() {
  const row = document.getElementById("categories-row");
  if (!row) return;

  try {
    const res = await api.categories.getAll();
    row.innerHTML = res.data
      .map((c) => `<a href="shop.html?category=${c._id}" class="category-chip">${c.title}</a>`)
      .join("");
  } catch (err) {
    row.innerHTML = "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadFeaturedProducts();
  loadCategories();
});