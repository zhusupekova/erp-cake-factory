const db = require('./db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DATA_PATH = process.env.DB_PATH || path.join(__dirname, 'data.json');

console.log('Initializing JSON database...');

const seed = {
  users: [],
  products: [],
  materials: [],
  suppliers: [],
  orders: [],
  order_items: [],
  payments: [],
  settings: [],
  reservations: [],
  stockMovements: [],
  supplies: [],
  supply_items: []
};

if (!fs.existsSync(DATA_PATH)) {
  // seed users
  const adminHash = bcrypt.hashSync('admin', 8);
  seed.users.push({ id: 1, name: 'Admin', email: 'admin@example.com', password: adminHash, role: 'admin' });
  seed.users.push({ id: 2, name: 'Client Demo', email: 'client@example.com', role: 'client' });

  // seed products
  seed.products.push({ id: 1, name: 'Торт «Наполеон»', price: 800, category: 'Торты', recipe: [ { name: 'Мука', qtyPerUnit: 2 }, { name: 'Сахар', qtyPerUnit: 1.5 }, { name: 'Масло сливочное', qtyPerUnit: 0.5 } ], productionTimeMinutes: 240 });
  seed.products.push({ id: 2, name: 'Торт «Красный бархат»', price: 950, category: 'Торты', recipe: [ { name: 'Мука', qtyPerUnit: 1.8 }, { name: 'Сахар', qtyPerUnit: 1.6 }, { name: 'Масло сливочное', qtyPerUnit: 0.6 } ], productionTimeMinutes: 200 });
  seed.products.push({ id: 3, name: 'Чизкейк ванильный', price: 700, category: 'Чизкейки', recipe: [ { name: 'Мука', qtyPerUnit: 0.5 }, { name: 'Сахар', qtyPerUnit: 0.8 }, { name: 'Масло сливочное', qtyPerUnit: 0.3 } ], productionTimeMinutes: 180 });
  seed.products.push({ id: 4, name: 'Эклер ванильный', price: 120, category: 'Пирожные', recipe: [ { name: 'Мука', qtyPerUnit: 0.3 }, { name: 'Сахар', qtyPerUnit: 0.2 }, { name: 'Масло сливочное', qtyPerUnit: 0.1 } ], productionTimeMinutes: 30 });
  seed.products.push({ id: 5, name: 'Макаруны ассорти (6 шт.)', price: 450, category: 'Пирожные', recipe: [ { name: 'Мука', qtyPerUnit: 0.2 }, { name: 'Сахар', qtyPerUnit: 0.5 }, { name: 'Масло сливочное', qtyPerUnit: 0.1 } ], productionTimeMinutes: 60 });

  // seed materials
  seed.materials.push({ id: 1, name: 'Мука', stock: 100, qty: 100, minStock: 20, min_qty: 20, unitCost: 45 });
  seed.materials.push({ id: 2, name: 'Сахар', stock: 80, qty: 80, minStock: 15, min_qty: 15, unitCost: 40 });
  seed.materials.push({ id: 3, name: 'Масло сливочное', stock: 50, qty: 50, minStock: 10, min_qty: 10, unitCost: 150 });

  // default runtime settings
  seed.settings.push({ id: 1, key: 'production_capacity', value: 2 });

  fs.writeFileSync(DATA_PATH, JSON.stringify(seed, null, 2), 'utf8');
  console.log('Wrote', DATA_PATH);
} else {
  console.log(DATA_PATH, 'already exists — leaving intact');
}

console.log('JSON database initialization complete.');
