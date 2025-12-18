const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireFields } = require('../utils/validate');

router.get('/', (req, res) => {
  const rows = db.getAll('suppliers');
  rows.sort((a,b) => (a.id||0) - (b.id||0));
  res.json(rows);
});

router.post('/', (req, res) => {
  const missing = requireFields(req.body, ['name']);
  if (missing.length) return res.status(400).json({ error: 'missing ' + missing.join(',') });
  const { name, contact } = req.body;
  const item = db.insert('suppliers', { name, contact: contact || null });
  res.json({ id: item.id });
});

module.exports = router;
