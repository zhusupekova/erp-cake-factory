const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const db = require('./db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-prod';

app.use(cors());
app.use(express.json());

// Serve demo static files (Candy/project) so the UI and API are on same origin
const demoPath = path.join(__dirname, '..', 'Candy', 'project');
app.use(express.static(demoPath));

// For SPA routes, return index.html for non-API requests
app.get(/^(?!\/api).*/, (req, res, next) => {
	const indexFile = path.join(demoPath, 'index.html');
	if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
	return next();
});

// Mount extracted route modules
const auth = require('./routes/auth');
const products = require('./routes/products');
const materials = require('./routes/materials');
const suppliers = require('./routes/suppliers');
const orders = require('./routes/orders');
const reports = require('./routes/reports');
const settings = require('./routes/settings');
const purchase = require('./routes/purchase');

app.use('/api/auth', auth);
app.use('/api/products', products);
app.use('/api/materials', materials);
app.use('/api/suppliers', suppliers);
app.use('/api/orders', orders);
app.use('/api/reports', reports);
app.use('/api/settings', settings);
app.use('/api/purchase', purchase);

// Serve simple health
app.get('/api/health', (req,res)=> res.json({ ok: true }));

app.listen(PORT, '0.0.0.0', ()=> console.log('Server listening on', PORT));
