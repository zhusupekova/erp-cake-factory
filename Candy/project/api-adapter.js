// API adapter: when server is available, sync demo UI with backend API
(async function(){
  const API_BASE = window.ERP_API_BASE || 'http://localhost:4000';
  function getToken(){ return localStorage.getItem('erp_token'); }
  async function apiRequest(path, opts={}){
    const headers = opts.headers || {};
    headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API_BASE + path, Object.assign({}, opts, { headers }));
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(res.status + ' ' + txt);
    }
    return res.json().catch(()=>null);
  }

  // quick health check
  try {
    const h = await fetch(API_BASE + '/api/health');
    if (!h.ok) throw new Error('no api');
  } catch (e) {
    console.info('API adapter: backend not reachable at', API_BASE);
    return; // leave demo as-is
  }

  console.info('API adapter: backend reachable, switching demo to API mode');

  async function syncFromApi() {
    try {
      const prods = await apiRequest('/api/products');
      window.PRODUCTS = prods || window.PRODUCTS;
      const mats = await apiRequest('/api/materials');
      window.materials = mats || window.materials;
      const sups = await apiRequest('/api/suppliers');
      window.suppliers = sups || window.suppliers;
      const purch = await apiRequest('/api/purchase/orders');
      window.supplies = purch || window.supplies;
      const orders = await apiRequest('/api/orders');
      window.orders = orders || window.orders;
      const payments = await apiRequest('/api/reports/finance');
      // payments endpoint not exact; fetch payments via orders to rebuild payments array locally
      // fetch payments table separately if available
      // call existing renders
      if (typeof renderCatalog === 'function') renderCatalog();
      if (typeof renderMaterialsTable === 'function') renderMaterialsTable();
      if (typeof renderSuppliers === 'function') renderSuppliers();
      if (typeof renderSupplies === 'function') renderSupplies();
      if (typeof renderOrdersAdmin === 'function') renderOrdersAdmin();
      if (typeof renderPaymentsTable === 'function') renderPaymentsTable();
      if (typeof renderClientOrders === 'function') renderClientOrders(currentUser ? currentUser.name : '');
      if (typeof refreshSummary === 'function') refreshSummary();
      if (typeof rebuildReports === 'function') rebuildReports();
      if (typeof renderProcurementNeeds === 'function') renderProcurementNeeds();
    } catch (err) {
      console.warn('syncFromApi failed', err);
    }
  }

  // Override login handler to call API
  window.onLoginSubmit = async function(e){
    e.preventDefault();
    const name = document.getElementById('loginName').value.trim();
    const role = document.getElementById('loginRole').value;
    // prefer explicit email/password fields if provided
    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    const email = emailField && emailField.value.trim() ? emailField.value.trim() : (document.getElementById('loginName').value.trim().includes('@') ? document.getElementById('loginName').value.trim() : (name.replace(/\s/g, '.') + '@example.com'));
    const password = passwordField && passwordField.value ? passwordField.value : 'admin';
    if (!name) { alert('Введите имя пользователя'); return; }
    try {
      const resp = await apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      if (resp && resp.token) {
        localStorage.setItem('erp_token', resp.token);
        window.currentUser = resp.user;
        document.getElementById('headerUser').textContent = `${resp.user.name} (${resp.user.role})`;
        if (resp.user.role === 'client') {
          showScreen('client');
          renderClientOrders(resp.user.name);
        } else {
          showScreen('admin');
          applyRoleAccess(resp.user.role);
          renderOrdersAdmin();
          renderPaymentsTable();
          rebuildReports();
        }
        await syncFromApi();
        showToast('Вход через API: ' + resp.user.name, 'info');
      } else {
        // fallback to original behavior
        window.currentUser = { name, role };
        document.getElementById('headerUser').textContent = `${name} (${role})`;
        if (role === 'client') { showScreen('client'); renderClientOrders(name); }
        else { showScreen('admin'); applyRoleAccess(role); renderOrdersAdmin(); renderPaymentsTable(); rebuildReports(); }
      }
    } catch (err) {
      console.warn('API login failed, falling back', err);
      window.currentUser = { name, role };
      document.getElementById('headerUser').textContent = `${name} (${role})`;
      if (role === 'client') { showScreen('client'); renderClientOrders(name); }
      else { showScreen('admin'); applyRoleAccess(role); renderOrdersAdmin(); renderPaymentsTable(); rebuildReports(); }
    }
  };

  // Override createOrderFromCart to post to API
  // itemsParam: optional explicit items array (allows passing snapshot from UI)
  const _localCreateOrderFromCart = window.createOrderFromCart || null;
  window.createOrderFromCart = async function(customerName, paymentMethod, itemsParam){
    console.debug('[API adapter] createOrderFromCart called', { customerName, paymentMethod, itemsParam, cartSnapshot: window.cartItems });
    try {
      const src = (Array.isArray(itemsParam) && itemsParam.length > 0) ? itemsParam : (window.cartItems || []);
      const items = src.map(i => ({
        name: i.name || (i.product && i.product.name) || 'item',
        qty: i.qty || i.quantity || i.qtyPerUnit || 1,
        price: i.price || (i.product && i.product.price) || 0
      }));
      if (!items || items.length === 0) { alert('Корзина пуста — добавьте товары перед созданием заказа'); return null; }
      const payload = { customer: customerName, items, paymentMethod };
      console.debug('[API adapter] POST /api/orders payload', payload);
      const resp = await apiRequest('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
      await syncFromApi();
      if (!resp || !resp.id) return null;

      // авто-старт производства через API, чтобы попасть в очередь
      try {
        await apiRequest('/api/orders/' + resp.id + '/start-production', { method: 'POST' });
        await syncFromApi();
      } catch (e) {
        console.warn('auto start production failed', e);
      }

      showToast('Заказ создан (API) № ' + resp.id, 'success');
      return resp;
    } catch (err) {
      console.error('[API adapter] createOrderFromCart error', err);
      // fallback to local implementation if available
      try {
        if (_localCreateOrderFromCart) {
          console.debug('[API adapter] falling back to local createOrderFromCart');
          return await _localCreateOrderFromCart(customerName, paymentMethod, itemsParam);
        }
      } catch (e) { console.error('[API adapter] fallback failed', e); }
      alert('Ошибка создания заказа: ' + err.message);
      return null;
    }
  };

  window.addManualOrder = async function(customerName, productId, qty){
    try {
      const prod = (window.PRODUCTS || []).find(p=>p.id === productId) || { name: 'item', price: 0 };
      const items = [{ name: prod.name, qty, price: prod.price }];
      const resp = await apiRequest('/api/orders', { method: 'POST', body: JSON.stringify({ customer: customerName, items }) });
      await syncFromApi();
      showToast('Заказ создан вручную (API)', 'success');
    } catch (err) { console.error(err); alert('Ошибка: ' + err.message); }
  };

  window.markOrderPaid = async function(orderId, method){
    try {
      await apiRequest('/api/orders/' + orderId + '/pay', { method: 'POST', body: JSON.stringify({ method }) });
      await syncFromApi();
      showToast('Оплата зарегистрирована (API)', 'success');
    } catch (err) { console.error(err); alert('Ошибка оплаты: ' + err.message); }
  };

  window.addMaterialMovement = async function(name, delta){
    try {
      await apiRequest('/api/materials/move', { method: 'POST', body: JSON.stringify({ name, delta }) });
      await syncFromApi();
      showToast('Движение по складу сохранено (API)', 'success');
    } catch (err) { console.error(err); alert('Ошибка склада: ' + err.message); }
  };

  window.createPurchaseOrder = async function(supplierId, materialName, qty, unitCost){
    try {
      const payload = { supplierId, items: [{ name: materialName, qty, unitCost }] };
      const resp = await apiRequest('/api/purchase/orders', { method: 'POST', body: JSON.stringify(payload) });
      await syncFromApi();
      showToast('Заказ поставщику создан (API) № ' + (resp && resp.id ? resp.id : ''), 'success');
    } catch (err) {
      console.error(err); alert('Ошибка создания заказа поставщику: ' + err.message);
    }
  };

  window.receivePurchaseOrder = async function(supplyId){
    try {
      await apiRequest('/api/purchase/orders/' + supplyId + '/receive', { method: 'POST' });
      await syncFromApi();
      showToast('Поставка принята (API)', 'success');
    } catch (err) {
      console.error(err); alert('Ошибка при приёмке: ' + err.message);
    }
  };

  window.addSupplier = async function(name, contact){
    try {
      await apiRequest('/api/suppliers', { method: 'POST', body: JSON.stringify({ name, contact }) });
      await syncFromApi();
      showToast('Поставщик добавлен (API)', 'success');
    } catch (err) { console.error(err); alert('Ошибка: ' + err.message); }
  };

  // initial sync
  await syncFromApi();

})();
