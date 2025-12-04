// Простые полезные функции

function formatMoney(value) {
  return value.toFixed(2) + " сом";
}

function formatDateTime(date = new Date()) {
  return date.toLocaleString("ru-RU");
}