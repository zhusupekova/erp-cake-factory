// Права доступа по ролям для блоков админ-панели
// Используем data-access на card'ах

const ROLE_ACCESS = {
  admin: ["orders", "inventory", "suppliers", "payments", "reports"],
  manager: ["orders"],
  accountant: ["payments", "reports"],
  warehouse: ["inventory", "suppliers"],
  client: [] // клиент админку не видит
};