/* ====================================
   منطق صفحة طلباتي
   ==================================== */

const STATUS_LABELS = {
  pending: "قيد الانتظار",
  paid: "تم الدفع",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

async function loadMyOrders() {
  const list = document.getElementById("orders-list");
  if (!list) return;

  renderLoadingSkeleton(list, 3);

  try {
    const res = await api.orders.getMine();
    const orders = res.data;

    if (!orders || orders.length === 0) {
      renderEmptyState(list, "لا توجد لديك أي طلبات حتى الآن", "📦");
      return;
    }

    // أحدث الطلبات أولاً
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    list.innerHTML = orders.map(renderOrderCard).join("");
    attachOrderActions();
  } catch (err) {
    renderEmptyState(list, "لا توجد لديك أي طلبات حتى الآن", "📦");
  }
}

function renderOrderCard(order) {
  const date = new Date(order.createdAt).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const itemsHtml = order.products
    .map((item) => {
      const p = item.oneproduct;
      const imageUrl = p && p.image && p.image[0] ? `${BASE_URL}/${p.image[0]}` : "assets/img/placeholder.svg";
      const title = p ? p.title : "منتج محذوف";

      return `
        <div class="order-item">
          <div class="order-item__image">
            <img src="${imageUrl}" alt="${title}" />
          </div>
          <div class="order-item__info">
            <div class="order-item__title">${title}</div>
            <div class="order-item__meta">الكمية: ${item.quantity} × ${item.price} ج.م</div>
          </div>
        </div>
      `;
    })
    .join("");

  const canPay = order.status === "pending";
  const canDelete = order.status === "pending";

  return `
    <div class="order-card" data-order-id="${order._id}">
      <div class="order-card__header">
        <div>
          <div class="order-card__id">رقم الطلب: ${order._id}</div>
          <div class="order-card__date">${date}</div>
        </div>
        <span class="order-status order-status--${order.status}">${STATUS_LABELS[order.status] || order.status}</span>
      </div>

      <div class="order-card__items">
        ${itemsHtml}
      </div>

      <div class="order-card__shipping">
        📍 ${order.shippingAddress?.address || "—"}
      </div>

      <div class="order-card__footer">
        <div class="order-card__total">الإجمالي: <span>${order.totalPrice} ج.م</span></div>
        <div class="order-card__actions">
          ${canPay ? `<button class="btn btn--primary btn--sm" data-action="pay" data-id="${order._id}">تأكيد الدفع</button>` : ""}
          ${canDelete ? `<button class="btn btn--danger btn--sm" data-action="delete" data-id="${order._id}">حذف الطلب</button>` : ""}
        </div>
      </div>
    </div>
  `;
}

function attachOrderActions() {
  document.querySelectorAll('[data-action="pay"]').forEach((btn) => {
    btn.addEventListener("click", () => handlePayOrder(btn));
  });
  document.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener("click", () => handleDeleteOrder(btn));
  });
}

async function handlePayOrder(btn) {
  const id = btn.dataset.id;
  setButtonLoading(btn, true, "جاري التأكيد...");

  try {
    await api.orders.markAsPaid(id);
    showToast("تم تأكيد الدفع، سنتواصل معك قريباً", "success");
    loadMyOrders();
  } catch (err) {
    showToast(getErrorMessage(err), "error");
    setButtonLoading(btn, false);
  }
}

async function handleDeleteOrder(btn) {
  const id = btn.dataset.id;
  const confirmed = window.confirm("هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.");
  if (!confirmed) return;

  setButtonLoading(btn, true, "جاري الحذف...");

  try {
    await api.orders.delete(id);
    showToast("تم حذف الطلب", "success");
    loadMyOrders();
  } catch (err) {
    showToast(getErrorMessage(err), "error");
    setButtonLoading(btn, false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  guardPage({ requireAuth: true });
  loadMyOrders();
});