// Каталог изделий кондитерской

const PRODUCTS = [
  { id: 1, name: "Торт «Наполеон»", price: 800, category: "Торты" },
  { id: 2, name: "Торт «Красный бархат»", price: 950, category: "Торты" },
  { id: 3, name: "Чизкейк ванильный", price: 700, category: "Чизкейки" },
  { id: 4, name: "Эклер ванильный", price: 120, category: "Пирожные" },
  { id: 5, name: "Макаруны ассорти (6 шт)", price: 450, category: "Пирожные" }
];

function getProductById(id) {
  return PRODUCTS.find(p => p.id === id);
}