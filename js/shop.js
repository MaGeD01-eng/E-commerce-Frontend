/* ====================================
   منطق صفحة المتجر: عرض، فلترة، صفحات
   ==================================== */

const shopState = {
  page: 1,
  limit: 12,
  category: null, // id الكاتيجوري المختارة، أو null لكل المنتجات
};

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

async function loadShopCategories() {
  const row = document.getElementById("shop-categories");
  if (!row) return;

  try {
    const res = await api.categories.getAll();

    const allChip = `<button class="category-chip ${!shopState.category ? "is-active" : ""}" data-id="">الكل</button>`;
    const chips = res.data
      .map(
        (c) =>
          `<button class="category-chip ${shopState.category === c._id ? "is-active" : ""}" data-id="${c._id}">${c.title}</button>`
      )
      .join("");

    row.innerHTML = allChip + chips;

    row.querySelectorAll(".category-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        shopState.category = chip.dataset.id || null;
        shopState.page = 1;
        row.querySelectorAll(".category-chip").forEach((c) => c.classList.remove("is-active"));
        chip.classList.add("is-active");
        loadShopProducts();
      });
    });
  } catch (err) {
    row.innerHTML = "";
  }
}

async function loadShopProducts() {
  const grid = document.getElementById("shop-products");
  const countEl = document.getElementById("shop-count");
  const paginationEl = document.getElementById("shop-pagination");
  if (!grid) return;

  renderLoadingSkeleton(grid, shopState.limit);
  paginationEl.innerHTML = "";

  try {
    const res = await api.products.getAll(shopState.page, shopState.limit);

    let products = res.data;

    // فلترة بالكاتيجوري من جهة الفرونت (الـ Backend مش بيدعم فلترة مباشرة بالـ category في الـ query)
    if (shopState.category) {
      products = products.filter((p) => p.category && p.category._id === shopState.category);
    }

    if (products.length === 0) {
      renderEmptyState(grid, "لا توجد منتجات في هذا التصنيف", "🔍");
      countEl.textContent = "";
      return;
    }

    grid.innerHTML = products.map(renderProductCard).join("");
    countEl.textContent = `عرض ${products.length} منتج`;

    renderPagination(paginationEl);
  } catch (err) {
    renderEmptyState(grid, "لا توجد منتجات متاحة حالياً", "🛍️");
    countEl.textContent = "";
  }
}

function renderPagination(container) {
  container.innerHTML = `
    <button class="pagination__btn" id="prev-page" ${shopState.page === 1 ? "disabled" : ""}>السابق</button>
    <span class="pagination__info">صفحة ${shopState.page}</span>
    <button class="pagination__btn" id="next-page">التالي</button>
  `;

  document.getElementById("prev-page").addEventListener("click", () => {
    if (shopState.page > 1) {
      shopState.page -= 1;
      loadShopProducts();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  document.getElementById("next-page").addEventListener("click", () => {
    shopState.page += 1;
    loadShopProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const categoryFromUrl = getQueryParam("category");
  if (categoryFromUrl) {
    shopState.category = categoryFromUrl;
  }
  loadShopCategories();
  loadShopProducts();
});