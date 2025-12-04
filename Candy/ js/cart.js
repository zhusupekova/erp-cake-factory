// Корзина клиента

let cartItems = [];

function addToCart(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const existing = cartItems.find(i => i.product.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cartItems.push({ product, qty: 1 });
  }
  renderCart();
}

function removeFromCart(productId) {
  cartItems = cartItems.filter(i => i.product.id !== productId);
  renderCart();
}

function changeCartQty(productId, qty) {
  const item = cartItems.find(i => i.product.id === productId);
  if (!item) return;
  item.qty = Math.max(1, qty);
  renderCart();
}

function getCartTotal() {
  return cartItems.reduce((sum, item) => sum + item.qty * item.product.price, 0);
}

function clearCart() {
  cartItems = [];
  renderCart();
}

function renderCatalog() {
  const container = document.getElementById("catalog");
  if (!container) return;
  container.innerHTML = "";

  PRODUCTS.forEach(p => {
    const div = document.createElement("div");
    div.className = "catalog-item";
    div.innerHTML = `
      <h4>${p.name}</h4>
      <p class="muted">${p.category}</p>
      <p class="price">${formatMoney(p.price)}</p>
      <button class="btn btn-primary" data-id="${p.id}">В корзину</button>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll("button[data-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-id"), 10);
      addToCart(id);
    });
  });
}

function renderCart() {
  const tbody = document.getElementById("cartItemsBody");
  const totalEl = document.getElementById("cartTotal");
  if (!tbody || !totalEl) return;

  tbody.innerHTML = "";
  cartItems.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.product.name}</td>
      <td>
        <input type="number" min="1" value="${item.qty}" data-id="${item.product.id}" style="width:60px;" />
      </td>
      <td>${formatMoney(item.product.price)}</td>
      <td>${formatMoney(item.product.price * item.qty)}</td>
      <td><button class="btn btn-secondary btn-sm" data-remove="${item.product.id}">×</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("input[data-id]").forEach(input => {
    input.addEventListener("change", () => {
      const id = parseInt(input.getAttribute("data-id"), 10);
      const qty = parseInt(input.value, 10);
      changeCartQty(id, qty);
    });
  });

  tbody.querySelectorAll("button[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-remove"), 10);
      removeFromCart(id);
    });
  });

  totalEl.textContent = formatMoney(getCartTotal());
}