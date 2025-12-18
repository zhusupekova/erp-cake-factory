const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireFields } = require('../utils/validate');

router.post('/', (req, res) => {
  const missing = requireFields(req.body, ['items']);
  if (missing.length) return res.status(400).json({ error: 'missing ' + missing.join(',') });
  const { customer, items, paymentMethod } = req.body;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items must be non-empty array' });
  const total = items.reduce((s,i)=>s + (i.qty||0) * (i.price||0), 0);
  const now = new Date().toISOString();
  // compute required materials based on product recipes
  const prodMap = {};
  const materialsNeeded = {};
  items.forEach(it => {
    // try to locate product by name
    const prod = db.findByLowerName('products', it.name) || null;
    if (!prod || !prod.recipe) return;
    (prod.recipe || []).forEach(ing => {
      const perUnit = typeof ing.quantity === 'number' ? ing.quantity : (ing.qtyPerUnit || 0);
      const need = perUnit * (it.qty || 0);
      const key = ing.materialId || ing.name;
      if (!key) return;
      materialsNeeded[key] = (materialsNeeded[key] || 0) + need;
      prodMap[key] = ing;
    });
  });
  const required_materials = Object.keys(materialsNeeded).map(key => {
    const lookupName = prodMap[key] && prodMap[key].name ? prodMap[key].name : key;
    const mat = (typeof key === 'number') ? db.findBy('materials', 'id', key) : (db.findByLowerName('materials', lookupName) || {});
    const inStockQty = typeof mat.stock === 'number' ? mat.stock : (mat.qty || 0);
    const requiredQty = materialsNeeded[key];
    const missingQty = Math.max(0, requiredQty - inStockQty);
    return { id: mat.id, name: mat.name || lookupName, requiredQty, inStockQty, missingQty };
  });

  const shortages = required_materials.filter(m => m.missingQty > 0);
  if (shortages.length) {
    return res.status(400).json({ error: 'materials_missing', missing: shortages });
  }

  const order = { customer: customer || 'Клиент', datetime: now, total, status: 'Новый', payment_method: paymentMethod || 'не выбран', paid: 0, required_materials };
  const created = db.insertOrder(order, items.map(it => ({ product_name: it.name, qty: it.qty, price: it.price })));
  res.json({ id: created.id });
});

router.get('/', (req, res) => {
  const rows = db.getAll('orders');
  rows.sort((a,b) => (b.id||0) - (a.id||0));
  res.json(rows);
});

router.post('/:id/pay', (req, res) => {
  const id = parseInt(req.params.id,10);
  const { method } = req.body;
  const order = db.getAll('orders').find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'order not found' });
  db.update('orders', id, { paid: 1, payment_method: method || 'карта', status: 'Оплачен' });
  db.addPayment({ datetime: new Date().toISOString(), order_id: id, amount: order.total, method: method || 'карта' });
  res.json({ ok: true });
});

router.post('/:id/status', (req, res) => {
  const id = parseInt(req.params.id,10);
  const { status } = req.body;
  db.update('orders', id, { status: status || 'В производстве' });
  res.json({ ok: true });
});

// Start production: check materials and decrement stock if available
router.post('/:id/start-production', (req, res) => {
  const id = parseInt(req.params.id,10);
  const order = db.getAll('orders').find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'order not found' });

  if (order.materials_consumed) {
    return res.status(409).json({ error: 'materials_already_consumed' });
  }

  // === СПИСАНИЕ СЫРЬЯ ПО РЕЦЕПТУ ===
  const orderItems = db.filter('order_items', it => it.order_id === id);
  if (!orderItems.length) {
    return res.status(400).json({ error: 'order_has_no_items' });
  }

  const usageMap = new Map();

  for (const item of orderItems) {
    const product = db.findByLowerName('products', item.product_name);
    if (!product || !Array.isArray(product.recipe)) {
      return res.status(400).json({ error: `У товара нет рецепта: ${item.product_name}` });
    }

    for (const recipeItem of product.recipe) {
      const perUnit = typeof recipeItem.quantity === 'number' ? recipeItem.quantity : (recipeItem.qtyPerUnit || 0);
      if (!perUnit || !(item.qty || 0)) continue;
      const material = (recipeItem.materialId != null)
        ? db.findBy('materials', 'id', recipeItem.materialId)
        : db.findByLowerName('materials', recipeItem.name);
      if (!material) {
        return res.status(400).json({ error: `Материал не найден для рецепта: ${recipeItem.name || recipeItem.materialId}` });
      }
      const key = material.id;
      const current = usageMap.get(key) || { material, required: 0 };
      current.required += perUnit * (item.qty || 0);
      usageMap.set(key, current);
    }
  }

  for (const entry of usageMap.values()) {
    const material = entry.material;
    const stockValue = typeof material.stock === 'number' ? material.stock : (material.qty || 0);
    if (stockValue < entry.required) {
      return res.status(400).json({ error: `Недостаточно сырья: ${material.name}` });
    }
  }

  const nowISO = new Date().toISOString();
  const consumptionSummary = [];

  for (const entry of usageMap.values()) {
    const material = entry.material;
    const before = typeof material.stock === 'number' ? material.stock : (material.qty || 0);
    const after = before - entry.required;
    const unitCost = material.unitCost != null ? material.unitCost : 0;
    const updated = db.update('materials', material.id, {
      stock: after,
      qty: after,
      minStock: typeof material.minStock === 'number' ? material.minStock : (material.min_qty || 0),
      min_qty: typeof material.minStock === 'number' ? material.minStock : (material.min_qty || 0),
      unitCost
    });
    db.addStockMovement({
      materialId: material.id,
      materialName: material.name,
      type: 'OUT',
      quantity: entry.required,
      date: nowISO,
      reason: `Производство заказа #${order.id}`,
      orderId: order.id,
      unitCost,
      totalCost: entry.required * unitCost,
      performedBy: (req.user && req.user.email) || 'system'
    });
    consumptionSummary.push({
      name: material.name,
      materialId: material.id,
      requiredQty: entry.required,
      inStockQty: updated ? (typeof updated.stock === 'number' ? updated.stock : (updated.qty || 0)) : after,
      missingQty: 0
    });
  }

  // compute production duration from order items
  const items = orderItems;
  let totalMinutes = 0;
  items.forEach(it => {
    const prod = db.findByLowerName('products', it.product_name);
    if (prod && prod.productionTimeMinutes) totalMinutes += (prod.productionTimeMinutes || 0) * (it.qty || 0);
  });
  const now = new Date();
  // read capacity from settings if present
  const setting = (db.getAll('settings') || []).find(s => s.key === 'production_capacity');
  const capacity = parseInt(setting ? setting.value : process.env.PRODUCTION_CAPACITY, 10) || 2;

  // Build slot availability based on existing running productions
  const running = db.filter('orders', o => o.status === 'В производстве' && o.production_ends_at).map(o => ({ id: o.id, endsAt: new Date(o.production_ends_at) }));
  // initialize slots to now
  const slots = new Array(capacity).fill(null).map(() => new Date(now));
  // assign existing running jobs to earliest slots by end time
  const sortedEnds = running.map(r => r.endsAt).sort((a,b)=>a-b);
  sortedEnds.forEach(endTime => {
    // find earliest slot
    let idx = 0; for (let i=1;i<slots.length;i++) if (slots[i] < slots[idx]) idx = i;
    // slot becomes available at max(current slot available, endTime)
    slots[idx] = new Date(Math.max(slots[idx].getTime(), endTime.getTime()));
  });
  // pick earliest available slot for this job
  let pickIdx = 0; for (let i=1;i<slots.length;i++) if (slots[i] < slots[pickIdx]) pickIdx = i;
  const startAt = new Date(Math.max(slots[pickIdx].getTime(), now.getTime()));
  const ends = new Date(startAt.getTime() + totalMinutes * 60000);

  // update order: if startAt is now, mark as in production; otherwise mark as scheduled
  const status = (startAt.getTime() <= now.getTime() + 1000) ? 'В производстве' : 'Назначено';
  const updates = { status, production_scheduled_start: startAt.toISOString(), production_ends_at: ends.toISOString() };
  if (status === 'В производстве') updates.production_started_at = now.toISOString();
  updates.materials_consumed = true;
  updates.required_materials = consumptionSummary;
  db.update('orders', id, updates);
  res.json({ ok: true, status: updates.status, production_scheduled_start: updates.production_scheduled_start, production_ends_at: updates.production_ends_at });
});

// Mark production complete (force)
router.post('/:id/complete-production', (req, res) => {
  const id = parseInt(req.params.id,10);
  const order = db.getAll('orders').find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'order not found' });
  // consume reserved materials for this order
  db.consumeReservations(id);
  db.update('orders', id, { status: 'Готов', production_completed_at: new Date().toISOString() });
  res.json({ ok: true });
});

// Cancel scheduled production: restore reserved materials if possible and clear schedule
router.post('/:id/cancel-production', (req, res) => {
  const id = parseInt(req.params.id,10);
  const order = db.getAll('orders').find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'order not found' });
  // cancel reserved materials (if still reserved)
  db.cancelReservations(id);
  db.update('orders', id, { status: 'Новый', production_scheduled_start: null, production_started_at: null, production_ends_at: null });
  res.json({ ok: true });
});

// Reschedule production for order: accepts { minutesFromNow } or { startAt: ISO }
router.post('/:id/reschedule', (req, res) => {
  const id = parseInt(req.params.id,10);
  const body = req.body || {};
  const minutesFromNow = typeof body.minutesFromNow === 'number' ? body.minutesFromNow : null;
  const startAtISO = body.startAt || null;
  const order = db.getAll('orders').find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'order not found' });
  // compute totalMinutes for order
  const items = db.filter('order_items', it => it.order_id === id);
  let totalMinutes = 0;
  items.forEach(it => {
    const prod = db.findByLowerName('products', it.product_name);
    if (prod && prod.productionTimeMinutes) totalMinutes += (prod.productionTimeMinutes || 0) * (it.qty || 0);
  });
  const now = new Date();
  const startAt = startAtISO ? new Date(startAtISO) : (minutesFromNow != null ? new Date(now.getTime() + minutesFromNow * 60000) : null);
  if (!startAt) return res.status(400).json({ error: 'startAt or minutesFromNow required' });
  const ends = new Date(startAt.getTime() + totalMinutes * 60000);
  db.update('orders', id, { production_scheduled_start: startAt.toISOString(), production_ends_at: ends.toISOString(), status: 'Назначено' });
  res.json({ ok: true, scheduled_start: startAt.toISOString(), ends_at: ends.toISOString() });
});

module.exports = router;
