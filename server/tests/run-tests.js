const db = require('../db');

function assert(cond, msg){ if (!cond) { console.error('FAIL:', msg); process.exit(2); } }

console.log('Running DB smoke tests...');
const users = db.getAll('users');
assert(users.length > 0, 'users seeded');
const prods = db.getAll('products');
assert(prods.length > 0, 'products seeded');
const mats = db.getAll('materials');
assert(mats.length > 0, 'materials seeded');

console.log('All quick DB tests passed.');
