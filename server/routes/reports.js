const express = require('express');
const router = express.Router();
const db = require('../db');

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

router.get('/finance', (req, res) => {
  const { from, to, paidOnly } = req.query;
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  const paidFilter = paidOnly === 'true' || paidOnly === true || paidOnly === '1';

  const orders = db.getAll('orders') || [];
  const filteredOrders = orders.filter(o => {
    const dt = parseDate(o.datetime);
    if (!dt) return false;
    if (fromDate && dt < fromDate) return false;
    if (toDate && dt > toDate) return false;
    if (paidFilter && !o.paid) return false;
    return true;
  });

  const revenueTotal = filteredOrders.reduce((s, o) => s + (o.total || 0), 0);
  const paidRevenue = filteredOrders.filter(o => o.paid).reduce((s, o) => s + (o.total || 0), 0);
  const unpaidRevenue = revenueTotal - paidRevenue;

  const movements = (db.getStockMovements() || []).filter(m => {
    const dt = parseDate(m.date);
    if (!dt) return false;
    if (fromDate && dt < fromDate) return false;
    if (toDate && dt > toDate) return false;
    return m.type === 'OUT';
  });

  const costOfGoods = movements.reduce((s, m) => {
    const unit = m.unitCost != null ? m.unitCost : 0;
    const qty = m.quantity || 0;
    const totalCost = m.totalCost != null ? m.totalCost : unit * qty;
    return s + totalCost;
  }, 0);

  res.json({
    period: { from: fromDate ? fromDate.toISOString() : null, to: toDate ? toDate.toISOString() : null },
    revenue: { total: revenueTotal, paid: paidRevenue, unpaid: unpaidRevenue },
    costOfGoods,
    profit: paidRevenue - costOfGoods
  });
});

router.get('/inventory', (req, res) => {
  const mats = db.getAll('materials');
  res.json(mats);
});

router.get('/warehouse', (req, res) => {
  const mats = db.getAll('materials') || [];
  const report = mats.map(m => {
    const stock = typeof m.stock === 'number' ? m.stock : (m.qty || 0);
    const minStock = typeof m.minStock === 'number' ? m.minStock : (m.min_qty || 0);
    return {
      id: m.id,
      name: m.name,
      stock,
      minStock,
      status: stock < minStock ? 'Мало' : 'OK'
    };
  });
  res.json(report);
});

router.get('/warehouse/movements', (req, res) => {
  const { from, to, type, supplierId, supplyId } = req.query || {};
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  const movements = (db.getStockMovements() || []).filter(m => {
    const dt = parseDate(m.date);
    if (!dt) return false;
    if (fromDate && dt < fromDate) return false;
    if (toDate && dt > toDate) return false;
    if (type && m.type !== type) return false;
    if (supplierId && String(m.supplierId || '') !== String(supplierId)) return false;
    if (supplyId && String(m.supplyId || '') !== String(supplyId)) return false;
    return true;
  }).sort((a, b) => {
    const aTime = new Date(a.date || 0).getTime();
    const bTime = new Date(b.date || 0).getTime();
    return bTime - aTime;
  });
  res.json(movements);
});

router.get('/schedule', (req, res) => {
  // Return scheduled and running productions
  const orders = db.getAll('orders').filter(o => o.production_scheduled_start || o.production_started_at || o.production_ends_at);
  const out = orders.map(o => ({ id: o.id, customer: o.customer, status: o.status, scheduled_start: o.production_scheduled_start || null, started_at: o.production_started_at || null, ends_at: o.production_ends_at || null }));
  // include reservation summary
  const withRes = out.map(o => {
    const resv = db.getReservationsByOrder(o.id) || [];
    const reserved = resv.reduce((s,r)=>s+(r.status === 'reserved' ? r.qty : 0), 0);
    const consumed = resv.reduce((s,r)=>s+(r.status === 'consumed' ? r.qty : 0), 0);
    return Object.assign({}, o, { reserved_qty: reserved, consumed_qty: consumed });
  });
  res.json(withRes.sort((a,b)=> (a.scheduled_start||a.started_at||a.ends_at||'') > (b.scheduled_start||b.started_at||b.ends_at||'') ? 1 : -1));
});

module.exports = router;
