/* ====================================
   لوحة تحكم الأدمن: المنتجات، الفئات، المستخدمين
   ==================================== */

let allCategories = []; // نخزنها مرة عشان نستخدمها في select الفورم وعرض اسم الفئة في الجدول
let editingProductId = null; // null = إضافة جديد، غير null = تعديل
let editingCategoryId = null;
let selectedFiles = []; // الصور المختارة للمنتج الجديد/المُعدَّل

/* ====================================
   التنقل بين التبويبات
   ==================================== */

function initAdminTabs() {
  const tabs = document.querySelectorAll(".admin-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      document.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("is-active"));
      document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("is-active"));

      tab.classList.add("is-active");
      document.getElementById(`panel-${target}`).classList.add("is-active");
    });
  });
}

/* ====================================
   تبويب المنتجات
   ==================================== */

async function loadProductsTable() {
  const tbody = document.getElementById("products-table-body");
  tbody.innerHTML = `<tr class="admin-empty-row"><td colspan="6">جاري التحميل...</td></tr>`;

  try {
    const res = await api.products.getAll(1, 100);
    const products = res.data;

    if (!products || products.length === 0) {
      tbody.innerHTML = `<tr class="admin-empty-row"><td colspan="6">لا توجد منتجات بعد</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(renderProductRow).join("");
    attachProductRowActions();
  } catch (err) {
    tbody.innerHTML = `<tr class="admin-empty-row"><td colspan="6">لا توجد منتجات بعد</td></tr>`;
  }
}

function renderProductRow(p) {
  const imageUrl = (p.image && p.image[0]) ? `${BASE_URL}/${p.image[0]}` : "assets/img/placeholder.svg";
  return `
    <tr>
      <td><div class="table-thumb"><img src="${imageUrl}" alt="${p.title}" /></div></td>
      <td>${p.title}</td>
      <td>${p.category?.title || "—"}</td>
      <td>${p.price} ج.م</td>
      <td>${p.quantity}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn--ghost btn--sm" data-action="edit-product" data-id="${p._id}">تعديل</button>
          <button class="btn btn--danger btn--sm" data-action="delete-product" data-id="${p._id}">حذف</button>
        </div>
      </td>
    </tr>
  `;
}

function attachProductRowActions() {
  document.querySelectorAll('[data-action="edit-product"]').forEach((btn) => {
    btn.addEventListener("click", () => openProductModal(btn.dataset.id));
  });
  document.querySelectorAll('[data-action="delete-product"]').forEach((btn) => {
    btn.addEventListener("click", () => handleDeleteProduct(btn.dataset.id));
  });
}

async function handleDeleteProduct(id) {
  const confirmed = window.confirm("هل أنت متأكد من حذف هذا المنتج؟");
  if (!confirmed) return;

  try {
    await api.products.delete(id);
    showToast("تم حذف المنتج", "success");
    loadProductsTable();
  } catch (err) {
    showToast(getErrorMessage(err), "error");
  }
}

/* ---------- فورم إضافة / تعديل منتج ---------- */

function populateCategorySelect() {
  const select = document.getElementById("product-category");
  select.innerHTML =
    `<option value="" disabled selected>اختر الفئة</option>` +
    allCategories.map((c) => `<option value="${c._id}">${c.title}</option>`).join("");
}

async function openProductModal(productId = null) {
  editingProductId = productId;
  selectedFiles = [];
  document.getElementById("file-preview").innerHTML = "";

  const form = document.getElementById("product-form");
  form.reset();
  populateCategorySelect();

  const title = document.getElementById("product-modal-title");
  const imagesGroup = document.getElementById("product-images-group");
  const imagesLabel = imagesGroup.querySelector("label");

  if (productId) {
    title.textContent = "تعديل المنتج";
    imagesGroup.style.display = "block";
    imagesLabel.textContent = "الصور (اختياري — اتركه فارغاً للإبقاء على الصور الحالية)";

    try {
      const res = await api.products.getById(productId);
      const p = res.data;
      form.title.value = p.title;
      form.price.value = p.price;
      form.quantity.value = p.quantity;
      form.category.value = p.category?._id || "";
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      return;
    }
  } else {
    title.textContent = "إضافة منتج";
    imagesGroup.style.display = "block";
    imagesLabel.textContent = "الصور (حتى 5 صور، 2MB لكل صورة كحد أقصى)";
  }

  document.getElementById("product-modal-overlay").classList.add("is-open");
}

function closeProductModal() {
  document.getElementById("product-modal-overlay").classList.remove("is-open");
  editingProductId = null;
  selectedFiles = [];
}

function setupFileDropZone() {
  const dropZone = document.getElementById("file-drop-zone");
  const input = document.getElementById("product-images-input");
  const preview = document.getElementById("file-preview");

  dropZone.addEventListener("click", () => input.click());

  input.addEventListener("change", () => {
    const files = Array.from(input.files).slice(0, 5);

    // تحقق بسيط من الحجم والنوع قبل الإرسال (الباك إند مش بيتحقق من الحجم فعلياً، فنغطيها هنا)
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        showToast(`${file.name} ليس صورة صالحة`, "error");
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast(`${file.name} أكبر من 5MB`, "error");
        return false;
      }
      return true;
    });

    selectedFiles = validFiles;

    preview.innerHTML = validFiles
      .map((file) => `<div class="file-preview__item"><img src="${URL.createObjectURL(file)}" /></div>`)
      .join("");
  });
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const saveBtn = document.getElementById("save-product-btn");

  const payload = {
    title: form.title.value.trim(),
    price: form.price.value,
    quantity: form.quantity.value,
    category: form.category.value,
  };

  if (!payload.title || !payload.price || !payload.quantity || !payload.category) {
    showToast("من فضلك أكمل كل الحقول", "error");
    return;
  }

  setButtonLoading(saveBtn, true, "جاري الحفظ...");

  try {
    if (editingProductId) {
      // تعديل: لازم نبعت FormData دايماً عشان الـ route بقى فيه multer،
      // لكن الصور تتبعت بس لو المستخدم اختارها فعلاً
      const formData = new FormData();
      formData.append("title", payload.title);
      formData.append("price", payload.price);
      formData.append("quantity", payload.quantity);
      formData.append("category", payload.category);
      selectedFiles.forEach((file) => formData.append("image", file));

      await api.products.update(editingProductId, formData);
      showToast("تم تحديث المنتج", "success");
    } else {
      // إضافة: لازم صورة واحدة على الأقل
      if (selectedFiles.length === 0) {
        showToast("من فضلك اختر صورة واحدة على الأقل", "error");
        setButtonLoading(saveBtn, false);
        return;
      }

      const formData = new FormData();
      formData.append("title", payload.title);
      formData.append("price", payload.price);
      formData.append("quantity", payload.quantity);
      formData.append("category", payload.category);
      selectedFiles.forEach((file) => formData.append("image", file));

      await api.products.create(formData);
      showToast("تم إضافة المنتج بنجاح", "success");
    }

    closeProductModal();
    loadProductsTable();
  } catch (err) {
    showToast(getErrorMessage(err), "error");
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

/* ====================================
   تبويب الفئات
   ==================================== */

async function loadCategoriesTable() {
  const tbody = document.getElementById("categories-table-body");
  tbody.innerHTML = `<tr class="admin-empty-row"><td colspan="3">جاري التحميل...</td></tr>`;

  try {
    const res = await api.categories.getAll(1, 100);
    allCategories = res.data;

    if (allCategories.length === 0) {
      tbody.innerHTML = `<tr class="admin-empty-row"><td colspan="3">لا توجد فئات بعد</td></tr>`;
      return;
    }

    tbody.innerHTML = allCategories.map(renderCategoryRow).join("");
    attachCategoryRowActions();
  } catch (err) {
    allCategories = [];
    tbody.innerHTML = `<tr class="admin-empty-row"><td colspan="3">لا توجد فئات بعد</td></tr>`;
  }
}

function renderCategoryRow(c) {
  const date = new Date(c.createdAt).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `
    <tr>
      <td>${c.title}</td>
      <td>${date}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn--ghost btn--sm" data-action="edit-category" data-id="${c._id}">تعديل</button>
          <button class="btn btn--danger btn--sm" data-action="delete-category" data-id="${c._id}">حذف</button>
        </div>
      </td>
    </tr>
  `;
}

function attachCategoryRowActions() {
  document.querySelectorAll('[data-action="edit-category"]').forEach((btn) => {
    btn.addEventListener("click", () => openCategoryModal(btn.dataset.id));
  });
  document.querySelectorAll('[data-action="delete-category"]').forEach((btn) => {
    btn.addEventListener("click", () => handleDeleteCategory(btn.dataset.id));
  });
}

async function handleDeleteCategory(id) {
  const confirmed = window.confirm(
    "هل أنت متأكد من حذف هذه الفئة؟ تحذير: المنتجات المرتبطة بها لن تُحذف لكنها قد تظهر بدون فئة."
  );
  if (!confirmed) return;

  try {
    await api.categories.delete(id);
    showToast("تم حذف الفئة", "success");
    loadCategoriesTable();
  } catch (err) {
    showToast(getErrorMessage(err), "error");
  }
}

function openCategoryModal(categoryId = null) {
  editingCategoryId = categoryId;
  const form = document.getElementById("category-form");
  form.reset();

  const title = document.getElementById("category-modal-title");

  if (categoryId) {
    title.textContent = "تعديل الفئة";
    const cat = allCategories.find((c) => c._id === categoryId);
    if (cat) form.title.value = cat.title;
  } else {
    title.textContent = "إضافة فئة";
  }

  document.getElementById("category-modal-overlay").classList.add("is-open");
}

function closeCategoryModal() {
  document.getElementById("category-modal-overlay").classList.remove("is-open");
  editingCategoryId = null;
}

async function handleCategoryFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const saveBtn = document.getElementById("save-category-btn");

  const title = form.title.value.trim();
  if (!title) {
    showToast("من فضلك أدخل اسم الفئة", "error");
    return;
  }

  setButtonLoading(saveBtn, true, "جاري الحفظ...");

  try {
    if (editingCategoryId) {
      await api.categories.update(editingCategoryId, { title });
      showToast("تم تحديث الفئة", "success");
    } else {
      await api.categories.create({ title });
      showToast("تم إضافة الفئة بنجاح", "success");
    }

    closeCategoryModal();
    loadCategoriesTable();
  } catch (err) {
    showToast(getErrorMessage(err), "error");
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

/* ====================================
   تبويب المستخدمين
   ==================================== */

async function loadUsersTable() {
  const tbody = document.getElementById("users-table-body");
  tbody.innerHTML = `<tr class="admin-empty-row"><td colspan="4">جاري التحميل...</td></tr>`;

  try {
    const res = await api.users.getAll(1, 100);
    const users = res.data;

    if (!users || users.length === 0) {
      tbody.innerHTML = `<tr class="admin-empty-row"><td colspan="4">لا يوجد مستخدمون</td></tr>`;
      return;
    }

    const currentUser = getCurrentUser();

    tbody.innerHTML = users
      .map((u) => {
        const isSelf = currentUser && currentUser._id === u._id;
        return `
          <tr>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td><span class="badge badge--${u.role}">${u.role === "admin" ? "أدمن" : "مستخدم"}</span></td>
            <td>
              ${
                isSelf
                  ? `<span class="text-secondary" style="font-size: var(--text-xs);">هذا حسابك</span>`
                  : `<button class="btn btn--danger btn--sm" data-action="delete-user" data-id="${u._id}">حذف</button>`
              }
            </td>
          </tr>
        `;
      })
      .join("");

    document.querySelectorAll('[data-action="delete-user"]').forEach((btn) => {
      btn.addEventListener("click", () => handleDeleteUser(btn.dataset.id));
    });
  } catch (err) {
    tbody.innerHTML = `<tr class="admin-empty-row"><td colspan="4">لا يوجد مستخدمون</td></tr>`;
  }
}

async function handleDeleteUser(id) {
  const confirmed = window.confirm("هل أنت متأكد من حذف هذا المستخدم نهائياً؟");
  if (!confirmed) return;

  try {
    await api.users.delete(id);
    showToast("تم حذف المستخدم", "success");
    loadUsersTable();
  } catch (err) {
    showToast(getErrorMessage(err), "error");
  }
}

/* ====================================
   تهيئة الصفحة
   ==================================== */

document.addEventListener("DOMContentLoaded", () => {
  guardPage({ requireAuth: true, requireAdmin: true });

  initAdminTabs();
  setupFileDropZone();

  loadCategoriesTable().then(() => {
    loadProductsTable();
  });
  loadUsersTable();

  document.getElementById("product-form").addEventListener("submit", handleProductFormSubmit);
  document.getElementById("add-product-btn").addEventListener("click", () => openProductModal());
  document.getElementById("cancel-product-btn").addEventListener("click", closeProductModal);
  document.getElementById("product-modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "product-modal-overlay") closeProductModal();
  });

  document.getElementById("category-form").addEventListener("submit", handleCategoryFormSubmit);
  document.getElementById("add-category-btn").addEventListener("click", () => openCategoryModal());
  document.getElementById("cancel-category-btn").addEventListener("click", closeCategoryModal);
  document.getElementById("category-modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "category-modal-overlay") closeCategoryModal();
  });
});

