// Главный файл: логика экранов, форма логина, обработчики

let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const btnClientLogout = document.getElementById("btnClientLogout");
  const btnAdminLogout = document.getElementById("btnAdminLogout");
  const btnCartCheckout = document.getElementById("btnCartCheckout");
  const materialForm = document.getElementById("materialForm");
  const supplierForm = document.getElementById("supplierForm");
  const orderForm = document.getElementById("orderForm");
  const btnRefreshReport = document.getElementById("btnRefreshReport");
  const btnPrintPdf = document.getElementById("btnPrintPdf");

  // инициализация
  renderCatalog();
  renderMaterialsTable();
  renderSuppliers();
  refreshSummary();
  renderPaymentsTable();
  fillOrderProductSelect();

  if (loginForm) {
    loginForm.addEventListener("submit", onLoginSubmit);
  }

  if (btnClientLogout) {
    btnClientLogout.addEventListener("click", logout);
  }
  if (btnAdminLogout) {
    btnAdminLogout.addEventListener("click", logout);
  }

  if (btnCartCheckout) {
    btnCartCheckout.addEventListener("click", () => {
      if (!currentUser || currentUser.role !== "client") {
        alert("Сначала войдите как клиент.");
        return;
      }
      if (cartItems.length === 0) {
        alert("Корзина пуста.");
        return;
      }
      // Способ оплаты клиент пока просто указывает текстом
      const method = prompt("Способ оплаты (наличные/карта):", "карта") || "карта";
      const order = createOrderFromCart(currentUser.name, method);
      if (order) {
        alert("Заказ создан! Номер: " + order.id);
        renderClientOrders(currentUser.name);
        rebuildAllReports();
      }
    });
  }

  if (materialForm) {
    materialForm.addEventListener("submit", e => {
      e.preventDefault();
      const name = document.getElementById("materialName").value.trim();
      const delta = parseFloat(document.getElementById("materialDelta").value) || 0;
      const op = document.getElementById("materialOp").value;

      if (!name || delta <= 0) return;

      addMaterialMovement(name, op === "in" ? delta : -delta);
      renderMaterialsTable();
      rebuildAllReports();
      materialForm.reset();
    });
  }

  if (supplierForm) {
    supplierForm.addEventListener("submit", e => {
      e.preventDefault();
      const name = document.getElementById("supplierName").value.trim();
      const contact = document.getElementById("supplierContact").value.trim();
      addSupplier(name, contact);
      supplierForm.reset();
    });
  }

  if (orderForm) {
    orderForm.addEventListener("submit", e => {
      e.preventDefault();
      const customer = document.getElementById("orderCustomer").value.trim();
      const productId = parseInt(document.getElementById("orderProductSelect").value, 10);
      const qty = parseInt(document.getElementById("orderQty").value, 10) || 1;
      if (!customer) {
        alert("Введите имя клиента");
        return;
      }
      addManualOrder(customer, productId, qty);
      orderForm.reset();
    });
  }

  if (btnRefreshReport) {
    btnRefreshReport.addEventListener("click", () => {
      rebuildAllReports();
    });
  }

  if (btnPrintPdf) {
    btnPrintPdf.addEventListener("click", () => {
      window.print();
    });
  }
});

function fillOrderProductSelect() {
  const select = document.getElementById("orderProductSelect");
  if (!select) return;
  select.innerHTML = "";
  PRODUCTS.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.name} (${formatMoney(p.price)})`;
    select.appendChild(opt);
  });
}

function onLoginSubmit(event) {
  event.preventDefault();
  const name = document.getElementById("loginName").value.trim();
  const role = document.getElementById("loginRole").value;
  if (!name) {
    alert("Введите имя пользователя");
    return;
  }
  currentUser = { name, role };
  document.getElementById("headerUser").textContent =
    `${name} (${role})`;

  if (role === "client") {
    showScreen("client");
    renderClientOrders(name);
  } else {
    showScreen("admin");
    applyRoleAccess(role);
    renderOrdersAdmin();
    renderPaymentsTable();
    rebuildAllReports();
  }
}

function logout() {
  currentUser = null;
  document.getElementById("headerUser").textContent = "Не авторизован";
  showScreen("login");
}

function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById("screen-" + name).classList.add("active");
}

function applyRoleAccess(role) {
  const allowed = ROLE_ACCESS[role] || [];
  document.querySelectorAll("#screen-admin .card[data-access]").forEach(card => {
    const acc = card.getAttribute("data-access");
    if (allowed.includes(acc)) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  });
}