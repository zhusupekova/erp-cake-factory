const express = require('express');
const router = express.Router();
const db = require('../db');

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

router.post('/orders', (req, res) => {
  const { supplierId, supplierName, datetime, items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items required' });
  }

  const supplier = supplierId ? db.findBy('suppliers', 'id', Number(supplierId)) : null;
  const supName = supplier ? supplier.name : supplierName;
  if (!supName) return res.status(400).json({ error: 'supplier required' });

  const normalizedItems = items.map((it) => {
    const qty = Number(it.qty || it.quantity || 0);
    const unitCost = Number(it.unitCost != null ? it.unitCost : (it.price || 0));
    return {
      material_id: it.materialId || it.material_id || null,
      material_name: it.materialName || it.material_name || it.name || 'Материал',
      qty,
      unitCost
    };
  });

  const totalCost = normalizedItems.reduce((s, i) => s + (i.qty || 0) * (i.unitCost || 0), 0);
  const supply = db.insertSupply({
    supplierId: supplier ? supplier.id : (supplierId || null),
    supplierName: supName,
    datetime: datetime || new Date().toISOString(),
    status: 'Draft',
    totalCost
  }, normalizedItems);

  res.json({ id: supply.id });
});

router.get('/orders', (req, res) => {
  const { from, to, supplierId, status } = req.query || {};
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  const supplies = db.getAll('supplies') || [];
  const filtered = supplies.filter((s) => {
    const dt = parseDate(s.datetime);
    if (!dt) return false;
    if (fromDate && dt < fromDate) return false;
    if (toDate && dt > toDate) return false;
    if (supplierId && String(s.supplierId || '') !== String(supplierId)) return false;
    if (status && s.status !== status) return false;
    return true;
  });
  res.json(filtered);
});

router.get('/orders/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const supply = db.getAll('supplies').find((s) => s.id === id);
  if (!supply) return res.status(404).json({ error: 'supply not found' });
  const items = db.filter('supply_items', (it) => it.supply_id === id);
  res.json(Object.assign({}, supply, { items }));
});

router.post('/orders/:id/receive', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const supply = db.getAll('supplies').find((s) => s.id === id);
  if (!supply) return res.status(404).json({ error: 'supply not found' });
  if (supply.status === 'Received') return res.status(409).json({ error: 'already_received' });
  const items = db.filter('supply_items', (it) => it.supply_id === id);
  if (!items.length) return res.status(400).json({ error: 'supply has no items' });

  const performer = (req.user && req.user.email) || 'system';
  const nowISO = new Date().toISOString();
  let totalCost = 0;

  items.forEach((it) => {
    const qty = Number(it.qty || 0);
    const unitCost = Number(it.unitCost || 0);
    totalCost += qty * unitCost;

    let material = it.material_id ? db.findBy('materials', 'id', it.material_id) : null;
    if (!material) material = db.findByLowerName('materials', it.material_name);

    if (!material) {
      material = db.insert('materials', {
        name: it.material_name || 'Материал',
        stock: qty,
        qty,
        minStock: 0,
        min_qty: 0,
        unitCost
      });
    } else {
      const current = typeof material.stock === 'number' ? material.stock : (material.qty || 0);
      const next = current + qty;
      db.update('materials', material.id, {
        stock: next,
        qty: next,
        minStock: typeof material.minStock === 'number' ? material.minStock : (material.min_qty || 0),
        min_qty: typeof material.minStock === 'number' ? material.minStock : (material.min_qty || 0),
        unitCost
      });
    }

    const materialId = material.id || it.material_id;
    const materialName = material.name || it.material_name;
    db.addStockMovement({
      materialId,
      materialName,
      type: 'IN',
      quantity: qty,
      date: nowISO,
      reason: `Поставка #${supply.id}`,
      unitCost,
      totalCost: qty * unitCost,
      supplyId: supply.id,
      supplierId: supply.supplierId,
      performedBy: performer
    });
  });

  db.update('supplies', id, { status: 'Received', totalCost: totalCost || supply.totalCost, received_at: nowISO });
  res.json({ ok: true, status: 'Received' });
});

module.exports = router;
