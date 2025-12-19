// Client-side persistence for demo: saves core arrays to localStorage
(function(){
  const KEY = 'erp_demo_state_v1';

  function loadState(){
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      if (s.PRODUCTS) window.PRODUCTS = s.PRODUCTS;
      if (s.materials) window.materials = s.materials;
      if (s.suppliers) window.suppliers = s.suppliers;
      if (s.cartItems) window.cartItems = s.cartItems;
      if (s.cartDiscount) window.cartDiscount = s.cartDiscount;
      if (s.orders) window.orders = s.orders;
      if (s.payments) window.payments = s.payments;
      if (s.currentUser) window.currentUser = s.currentUser;
      if (s.shiftAssignments) window.shiftAssignments = s.shiftAssignments;
      if (s.notifyPrefs) window.notifyPrefs = s.notifyPrefs;
      if (s.readyProducts) window.readyProducts = s.readyProducts;
      if (s.shipments) window.shipments = s.shipments;
      if (s.qcChecks) window.qcChecks = s.qcChecks;
      return true;
    } catch (e){ console.warn('loadState failed', e); return false; }
  }

  function saveState(){
    try {
      const s = {
        PRODUCTS: window.PRODUCTS,
        materials: window.materials,
        suppliers: window.suppliers,
        cartItems: window.cartItems,
        cartDiscount: window.cartDiscount,
        orders: window.orders,
        payments: window.payments,
        currentUser: window.currentUser,
        shiftAssignments: window.shiftAssignments,
        notifyPrefs: window.notifyPrefs,
        readyProducts: window.readyProducts,
        shipments: window.shipments,
        qcChecks: window.qcChecks
      };
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (e){ console.warn('saveState failed', e); }
  }

  function wrap(fnName){
    try {
      const orig = window[fnName];
      if (typeof orig !== 'function') return;
      window[fnName] = function(...args){
        const res = orig.apply(this, args);
        try { saveState(); } catch(e){}
        return res;
      };
    } catch(e){}
  }

  document.addEventListener('DOMContentLoaded', () => {
    const had = loadState();
    // wrap mutating functions so they persist
    const toWrap = [
      'addToCart','removeFromCart','changeCartQty','clearCart',
      'createOrderFromCart','addManualOrder','markOrderPaid','updateOrderStatus',
      'addMaterialMovement','addSupplier',
      'applyPromo','resetPromo','assignJobToShift','removeJobFromShift',
      'saveNotifyPrefs','recordQualityCheck','addReadyStock','releaseReadyStock',
      'createShipment','updateShipmentStatus'
    ];
    toWrap.forEach(wrap);

    // if we loaded state, re-render UI
    if (had) {
      if (typeof renderCatalog === 'function') renderCatalog();
      if (typeof renderCart === 'function') renderCart();
      if (typeof renderMaterialsTable === 'function') renderMaterialsTable();
      if (typeof renderSuppliers === 'function') renderSuppliers();
      if (typeof renderOrdersAdmin === 'function') renderOrdersAdmin();
      if (typeof renderPaymentsTable === 'function') renderPaymentsTable();
      if (typeof renderClientOrders === 'function') renderClientOrders(currentUser ? currentUser.name : '');
      if (typeof refreshSummary === 'function') refreshSummary();
      if (typeof rebuildReports === 'function') rebuildReports();
    }
  });

  // expose save/load for convenience
  function exportState() {
    try {
      const s = {
        PRODUCTS: window.PRODUCTS,
        materials: window.materials,
        suppliers: window.suppliers,
        cartItems: window.cartItems,
        cartDiscount: window.cartDiscount,
        orders: window.orders,
        payments: window.payments,
        currentUser: window.currentUser,
        shiftAssignments: window.shiftAssignments,
        notifyPrefs: window.notifyPrefs,
        readyProducts: window.readyProducts,
        shipments: window.shipments,
        qcChecks: window.qcChecks
      };
      return JSON.stringify(s, null, 2);
    } catch (e) { console.warn('exportState failed', e); return null; }
  }

  function importState(json) {
    try {
      const s = typeof json === 'string' ? JSON.parse(json) : json;
      if (s.PRODUCTS) window.PRODUCTS = s.PRODUCTS;
      if (s.materials) window.materials = s.materials;
      if (s.suppliers) window.suppliers = s.suppliers;
      if (s.cartItems) window.cartItems = s.cartItems;
      if (s.cartDiscount) window.cartDiscount = s.cartDiscount;
      if (s.orders) window.orders = s.orders;
      if (s.payments) window.payments = s.payments;
      if (s.currentUser) window.currentUser = s.currentUser;
      if (s.shiftAssignments) window.shiftAssignments = s.shiftAssignments;
      if (s.notifyPrefs) window.notifyPrefs = s.notifyPrefs;
      if (s.readyProducts) window.readyProducts = s.readyProducts;
      if (s.shipments) window.shipments = s.shipments;
      if (s.qcChecks) window.qcChecks = s.qcChecks;
      saveState();
      return true;
    } catch (e) { console.warn('importState failed', e); return false; }
  }

  window.erpStorage = { loadState, saveState, exportState, importState, KEY };

})();
