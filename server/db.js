const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.json');

let data = null;

function load() {
	if (data) return data;
	try {
		const raw = fs.readFileSync(DB_PATH, 'utf8');
		data = JSON.parse(raw);
	} catch (e) {
		data = {
			users: [],
			products: [],
			materials: [],
			suppliers: [],
			orders: [],
			order_items: [],
			payments: [],
			reservations: [],
			settings: [],
			stockMovements: [],
			supplies: [],
			supply_items: []
		};
		save();
	}
	// ensure newly added collections always exist when loading legacy data
	data.materials = data.materials || [];
	data.stockMovements = data.stockMovements || [];
	data.supplies = data.supplies || [];
	data.supply_items = data.supply_items || [];
	return data;
}

function save() {
	fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function nextId(arr) {
	if (!arr || arr.length === 0) return 1;
	return Math.max(...arr.map(x => x.id || 0)) + 1;
}

function getAll(table) { load(); return data[table] || []; }

function findBy(table, key, value) { load(); const arr = data[table] || []; return arr.find(x => x[key] === value); }

function findByLowerName(table, name) { load(); const arr = data[table] || []; return arr.find(x => (x.name || '').toLowerCase() === (name || '').toLowerCase()); }

function insert(table, obj) { load(); const arr = data[table] || (data[table] = []); const id = nextId(arr); const item = Object.assign({ id }, obj); arr.push(item); save(); return item; }

function update(table, id, changes) { load(); const arr = data[table] || []; const it = arr.find(x => x.id === id); if (!it) return null; Object.assign(it, changes); save(); return it; }

function filter(table, fn) { load(); const arr = data[table] || []; return arr.filter(fn); }

function insertOrder(order, items) {
	load(); const orders = data.orders; const order_items = data.order_items;
	const oid = nextId(orders);
	const ord = Object.assign({ id: oid }, order);
	orders.push(ord);
	items.forEach(it => {
		const iid = nextId(order_items);
		order_items.push(Object.assign({ id: iid, order_id: oid }, it));
	});
	save();
	return ord;
}

function addPayment(payment) { return insert('payments', payment); }

function insertSupply(supply, items) {
	load();
	const supplies = data.supplies || (data.supplies = []);
	const supplyItems = data.supply_items || (data.supply_items = []);
	const sid = nextId(supplies);
	const sup = Object.assign({ id: sid }, supply);
	supplies.push(sup);
	(items || []).forEach(it => {
		const iid = nextId(supplyItems);
		supplyItems.push(Object.assign({ id: iid, supply_id: sid }, it));
	});
	save();
	return sup;
}

function insertReservation(res) {
	// res: { order_id, material_name, qty, status: 'reserved' }
	load(); const arr = data.reservations || (data.reservations = []);
	const id = nextId(arr);
	const item = Object.assign({ id }, res);
	arr.push(item);
	save();
	return item;
}

function getReservationsByOrder(orderId) { load(); return (data.reservations || []).filter(r => r.order_id === orderId); }

function consumeReservations(orderId) {
	load(); const resArr = data.reservations || [];
	const mats = data.materials || [];
	const toConsume = resArr.filter(r => r.order_id === orderId && r.status === 'reserved');
	toConsume.forEach(r => {
		const mat = mats.find(m => (m.name || '').toLowerCase() === (r.material_name || '').toLowerCase());
		if (mat) {
			const current = typeof mat.stock === 'number' ? mat.stock : (mat.qty || 0);
			const nextValue = current - (r.qty || 0);
			mat.stock = nextValue;
			mat.qty = nextValue;
		}
		r.status = 'consumed';
	});
	save();
	return toConsume;
}

function cancelReservations(orderId) {
	load(); const resArr = data.reservations || [];
	const toCancel = resArr.filter(r => r.order_id === orderId && r.status === 'reserved');
	toCancel.forEach(r => { r.status = 'cancelled'; });
	save();
	return toCancel;
}

function getAllReservations() { load(); return data.reservations || []; }

function addStockMovement(movement) {
	load(); const arr = data.stockMovements || (data.stockMovements = []);
	const id = movement && movement.id ? movement.id : nextId(arr);
	const entry = Object.assign({ id }, movement);
	arr.push(entry);
	save();
	return entry;
}

function getStockMovements() { load(); return data.stockMovements || []; }

module.exports = { load, save, getAll, findBy, findByLowerName, insert, update, filter, insertOrder, addPayment, insertReservation, getReservationsByOrder, consumeReservations, cancelReservations, getAllReservations, addStockMovement, getStockMovements, insertSupply };
