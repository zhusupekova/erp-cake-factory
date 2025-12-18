const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireFields } = require('../utils/validate');

router.get('/', (req, res) => {
  const rows = db.getAll('materials');
  rows.sort((a,b) => (a.id||0) - (b.id||0));
  res.json(rows);
});

router.post('/move', (req, res) => {
  const missing = requireFields(req.body, ['name', 'delta']);
  if (missing.length) return res.status(400).json({ error: 'missing ' + missing.join(',') });
  const { name, delta, unitCost } = req.body;
  const change = Number(delta);
  if (Number.isNaN(change)) return res.status(400).json({ error: 'delta must be numeric' });
  const costProvided = unitCost != null && !Number.isNaN(Number(unitCost));
  const performer = (req.user && req.user.email) || 'system';
  const m = db.findByLowerName('materials', name);
  if (m) {
    const current = typeof m.stock === 'number' ? m.stock : (m.qty || 0);
    const nextStock = current + change;
    const nextUnitCost = costProvided ? Number(unitCost) : (m.unitCost != null ? m.unitCost : 0);
    const updated = db.update('materials', m.id, {
      stock: nextStock,
      qty: nextStock,
      minStock: typeof m.minStock === 'number' ? m.minStock : (m.min_qty || 0),
      min_qty: typeof m.minStock === 'number' ? m.minStock : (m.min_qty || 0),
      unitCost: nextUnitCost
    });
    db.addStockMovement({
      materialId: updated.id,
      materialName: updated.name,
      type: change >= 0 ? 'IN' : 'OUT',
      quantity: Math.abs(change),
      date: new Date().toISOString(),
      reason: 'Ручная корректировка склада',
      unitCost: nextUnitCost,
      totalCost: Math.abs(change) * nextUnitCost,
      performedBy: performer
    });
    return res.json({ id: m.id });
  }
  const initialUnitCost = costProvided ? Number(unitCost) : 0;
  const item = db.insert('materials', { name, stock: change, qty: change, minStock: 10, min_qty: 10, unitCost: initialUnitCost });
  db.addStockMovement({
    materialId: item.id,
    materialName: item.name,
    type: change >= 0 ? 'IN' : 'OUT',
    quantity: Math.abs(change),
    date: new Date().toISOString(),
    reason: 'Новый материал',
    unitCost: initialUnitCost,
    totalCost: Math.abs(change) * initialUnitCost,
    performedBy: performer
  });
  res.json({ id: item.id });
});

module.exports = router;
