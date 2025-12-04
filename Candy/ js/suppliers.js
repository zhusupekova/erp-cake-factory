// Поставщики (упрощённо)

let suppliers = [];

function addSupplier(name, contact) {
  if (!name) return;
  suppliers.push({
    id: suppliers.length + 1,
    name,
    contact
  });
  renderSuppliers();
}

function renderSuppliers() {
  const tbody = document.getElementById("suppliersBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  suppliers.forEach((s, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${s.name}</td>
      <td>${s.contact}</td>
    `;
    tbody.appendChild(tr);
  });
}