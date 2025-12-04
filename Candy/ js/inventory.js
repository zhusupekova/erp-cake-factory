// Склад сырья (очень простой учёт)

let materials = [
  { id: 1, name: "Мука", qty: 100, minQty: 20 },
  { id: 2, name: "Сахар", qty: 80, minQty: 15 },
  { id: 3, name: "Масло сливочное", qty: 50, minQty: 10 }
];

function addMaterialMovement(name, delta) {
  let mat = materials.find(m => m.name.toLowerCase() === name.toLowerCase());
  if (!mat) {
    mat = {
      id: materials.length + 1,
      name,
      qty: 0,
      minQty: 10
    };
    materials.push(mat);
  }
  mat.qty += delta;
}

function renderMaterialsTable() {
  const tbody = document.getElementById("materialsBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  materials.forEach((m, index) => {
    const tr = document.createElement("tr");
    const low = m.qty < m.minQty ? " style='color:#e91e63; font-weight:bold;'" : "";

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${m.name}</td>
      <td${low}>${m.qty}</td>
      <td>${m.minQty}</td>
    `;
    tbody.appendChild(tr);
  });
}