const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const all = db.getAll('settings') || [];
  const out = {};
  all.forEach(s => out[s.key] = s.value);
  res.json(out);
});

router.post('/', (req, res) => {
  const body = req.body || {};
  // expect { key, value }
  if (!body.key) return res.status(400).json({ error: 'key required' });
  const key = body.key;
  const value = body.value;
  const existing = db.getAll('settings').find(s => s.key === key);
  if (existing) {
    db.update('settings', existing.id, { value });
    return res.json({ ok: true, key, value });
  }
  const created = db.insert('settings', { key, value });
  res.json({ ok: true, key, value: created.value });
});

module.exports = router;
