// Заказы (клиентские и админские)

let orders = [];
let payments = [];

function createOrderFromCart(customerName, paymentMethod) {
  const total = getCartTotal();
  if (total <= 0) return null;

  const order = {
    id: orders.length + 1,
    customer: customerName || "Клиент",
    datetime: formatDateTime(),
    items: cartItems.map(i => ({
      name: i.product.name,
      qty: i.qty,
      price: i.product.price
    })),
    total,
    status: "Новый",
    paymentMethod: paymentMethod || "не выбран",
    paid: false
  };

  orders.push(order);
  clearCart();
  renderOrdersAdmin();
  renderClientOrders();
  refreshSummary();
  return order;
}

function addManualOrder(customerName, productId, qty) {
  const product = getProductById(productId);
  if (!product) return;

  const order = {
    id: orders.length + 1,
    customer: customerName,
    datetime: formatDateTime(),
    items: [{ name: product.name, qty, price: product.price }],
    total: product.price * qty,
    status: "Новый",
    paymentMethod: "не выбран",
    paid: false
  };

  orders.push(order);
  renderOrdersAdmin();
  refreshSummary();
}

function markOrderPaid(orderId, method) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  order.paid = true;
  order.paymentMethod = method;
  order.status = "Оплачен";

  payments.push({
    datetime: formatDateTime(),
    orderId: order.id,
    customer: order.customer,
    amount: order.total,
    method
  });

  renderOrdersAdmin();
  renderPaymentsTable();
  refreshSummary();
}

function updateOrderStatus(orderId, newStatus) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = newStatus;
  renderOrdersAdmin();
  renderClientOrders();
  refreshSummary();
}

function renderOrdersAdmin() {
  const tbody = document.getElementById("adminOrdersBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  orders.forEach(o => {
    const tr = document.createElement("tr");
    const itemsText = o.items.map(i => `${i.name} (${i.qty} шт.)`).join(", ");
    tr.innerHTML = `
      <td>${o.id}</td>
      <td>${o.datetime}</td>
      <td>${o.customer}</td>
      <td>${itemsText}</td>
      <td>${formatMoney(o.total)}</td>
      <td>${o.status}</td>
      <td>${o.paid ? "Оплачен" : "Не оплачен (" + o.paymentMethod + ")"}</td>
      <td>
        <button class="btn btn-primary btn-sm" data-pay="${o.id}">Оплатить</button>
        <button class="btn btn-secondary btn-sm" data-status="${o.id}">Готов</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button[data-pay]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-pay"), 10);
      const method = prompt("Способ оплаты (наличные/карта):", "карта") || "карта";
      markOrderPaid(id, method);
    });
  });

  tbody.querySelectorAll("button[data-status]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-status"), 10);
      updateOrderStatus(id, "Готов");
    });
  });
}

function renderClientOrders(currentClientName = "") {
  const tbody = document.getElementById("clientOrdersBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filtered = currentClientName
    ? orders.filter(o => o.customer === currentClientName)
    : orders;

  filtered.forEach(o => {
    const tr = document.createElement("tr");
    const itemsText = o.items.map(i => `${i.name} (${i.qty})`).join(", ");
    tr.innerHTML = `
      <td>${o.id}</td>
      <td>${o.datetime}</td>
      <td>${itemsText}</td>
      <td>${formatMoney(o.total)}</td>
      <td>${o.paid ? o.paymentMethod : "Не оплачено"}</td>
      <td>${o.status}</td>
    `;
    tbody.appendChild(tr);
  });
}

function refreshSummary() {
  const totalOrdersEl = document.getElementById("adminTotalOrders");
  const unpaidEl = document.getElementById("adminUnpaid");
  const totalAmountEl = document.getElementById("adminTotalAmount");

  if (!totalOrdersEl) return;

  totalOrdersEl.textContent = orders.length.toString();
  unpaidEl.textContent = orders.filter(o => !o.paid).length.toString();
  const sum = orders.reduce((s, o) => s + o.total, 0);
  totalAmountEl.textContent = formatMoney(sum);
}

function renderPaymentsTable() {
  const tbody = document.getElementById("paymentsBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  payments.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.datetime}</td>
      <td>${p.orderId}</td>
      <td>${p.customer}</td>
      <td>${formatMoney(p.amount)} (${p.method})</td>
    `;
    tbody.appendChild(tr);
  });
}