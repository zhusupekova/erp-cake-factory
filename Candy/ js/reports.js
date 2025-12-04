// Отчёты (выручка + склад)

let revenueChartInstance = null;

function buildFinanceReport() {
  const container = document.getElementById("financeReportContainer");
  if (!container) return;

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const paidRevenue = orders.filter(o => o.paid).reduce((s, o) => s + o.total, 0);

  container.innerHTML = `
    <p><b>Общая сумма заказов:</b> ${formatMoney(totalRevenue)}</p>
    <p><b>Оплачено:</b> ${formatMoney(paidRevenue)}</p>
    <p><b>Не оплачено:</b> ${formatMoney(totalRevenue - paidRevenue)}</p>
  `;

  // График выручки по заказам
  const ctx = document.getElementById("revenueChart");
  if (!ctx) return;

  const labels = orders.map(o => "#" + o.id);
  const data = orders.map(o => o.total);

  if (revenueChartInstance) {
    revenueChartInstance.destroy();
  }

  revenueChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Сумма заказа (сом)",
        data
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function buildInventoryReport() {
  const container = document.getElementById("inventoryReportContainer");
  if (!container) return;

  let html = "<h4>Состояние склада сырья</h4>";
  html += "<ul>";
  materials.forEach(m => {
    const mark = m.qty < m.minQty ? " (ниже минимума!)" : "";
    html += `<li>${m.name}: ${m.qty} кг, минимум ${m.minQty} кг${mark}</li>`;
  });
  html += "</ul>";

  container.innerHTML = html;
}

function rebuildAllReports() {
  buildFinanceReport();
  buildInventoryReport();
}