/* ====================================
   طبقة موحدة للتواصل مع الـ Backend
   كل استدعاءات fetch بتمر من هنا
   ==================================== */

/**
 * يرجع الـ token المخزن في localStorage (لو موجود)
 */
function getToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

/**
 * دالة أساسية بتعمل أي request للـ API
 * @param {string} endpoint - المسار بعد الـ BASE_URL، مثال: "/product/api/get"
 * @param {object} options - خيارات إضافية: method, body, isFormData
 */
async function apiRequest(endpoint, options = {}) {
  const { method = "GET", body = null, isFormData = false } = options;

  const headers = {};

  // لو مش FormData (يعني JSON عادي) نحط الـ Content-Type
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // لو فيه توكن مسجل، نبعته في كل request
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions = {
    method,
    headers
  };

  if (body) {
    fetchOptions.body = isFormData ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);
  } catch (networkErr) {
    // فشل في الاتصال بالسيرفر نفسه (سيرفر مقفول، مشكلة شبكة...)
    throw {
      message: "تعذر الاتصال بالسيرفر. تأكد إن السيرفر شغال.",
      statusCode: 0
    };
  }

  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    data = null;
  }

  if (!response.ok) {
    // بنرمي error موحد الشكل عشان نتعامل معاه بسهولة في كل مكان
    throw {
      message: (data && data.message) || "حدث خطأ غير متوقع",
      statusCode: response.status,
      data
    };
  }

  return data;
}

/* ====================================
   اختصارات جاهزة لكل الـ Endpoints
   (بناءً على ملفات الـ Routes اللي بعتها بالظبط)
   ==================================== */

const api = {
  // ---------- AUTH / USERS ----------
  auth: {
    register: (payload) =>
      apiRequest("/user/api/auth/register", { method: "POST", body: payload }),

    login: (payload) =>
      apiRequest("/user/api/auth/login", { method: "POST", body: payload }),
  },

  users: {
    getAll: (page = 1, limit = 10) =>
      apiRequest(`/user/api/get?page=${page}&limit=${limit}`),

    delete: (id) =>
      apiRequest(`/user/api/delete/${id}`, { method: "DELETE" }),
  },

  // ---------- CATEGORIES ----------
  categories: {
    getAll: (page = 1, limit = 50) =>
      apiRequest(`/category/api/get?page=${page}&limit=${limit}`),

    getById: (id) =>
      apiRequest(`/category/api/get/${id}`),

    create: (payload) =>
      apiRequest("/category/api/post", { method: "POST", body: payload }),

    update: (id, payload) =>
      apiRequest(`/category/api/patch/${id}`, { method: "PUT", body: payload }),

    delete: (id) =>
      apiRequest(`/category/api/delete/${id}`, { method: "DELETE" }),
  },

  // ---------- PRODUCTS ----------
  products: {
    getAll: (page = 1, limit = 12) =>
      apiRequest(`/product/api/get?page=${page}&limit=${limit}`),

    getById: (id) =>
      apiRequest(`/product/api/get/${id}`),

    // payload لازم يكون FormData جاهز (فيه الصور)
    create: (formData) =>
      apiRequest("/product/api/post", { method: "POST", body: formData, isFormData: true }),

    update: (id, formData) =>
    apiRequest(`/product/api/patch/${id}`, { method: "PATCH", body: formData, isFormData: true }),

    delete: (id) =>
      apiRequest(`/product/api/delete/${id}`, { method: "DELETE" }),
  },

  // ---------- ORDERS ----------
  orders: {
    create: (payload) =>
      apiRequest("/order/api/post", { method: "POST", body: payload }),

    getMine: () =>
      apiRequest("/order/api/get"),

    markAsPaid: (id) =>
      apiRequest(`/order/api/patch/${id}`, { method: "PATCH" }),

    delete: (id) =>
      apiRequest(`/order/api/delete/${id}`, { method: "DELETE" }),
  },
};