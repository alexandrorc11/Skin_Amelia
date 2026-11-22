// Carga datos de ejemplo para la demostración del Sprint 2: node scripts/seed-demo.js
// (necesita el archivo .env con JWT_SECRET, igual que el servidor)
const { getDb } = require('../src/config/db');
const { categoria, marca } = require('../src/models/nombreUnico.model');
const productos = require('../src/models/producto.model');

const db = getDb();
if (db.prepare('SELECT COUNT(*) n FROM producto').get().n > 0) {
  console.log('Ya hay productos; no se cargan datos de ejemplo.');
  process.exit(0);
}

const cat = Object.fromEntries(['Limpiadores', 'Serums', 'Bloqueadores', 'Contorno de ojos', 'Parches']
  .map((n) => [n, categoria.crear(n)]));
const mar = Object.fromEntries(['Marca Demo A', 'Marca Demo B'].map((n) => [n, marca.crear(n)]));

const ejemplos = [
  ['Limpiador facial suave', 'Limpiadores', 'Marca Demo A', 220, 'Agua, glicerina, ácido hialurónico', ['seca', 'sensible'], 'Limpieza suave e hidratación', 'Aplicar sobre rostro húmedo, masajear y enjuagar.', 15],
  ['Gel limpiador control de grasa', 'Limpiadores', 'Marca Demo B', 180, 'Agua, ácido salicílico, extracto de té verde', ['grasa', 'mixta'], 'Control de grasa', 'Usar mañana y noche.', 20],
  ['Serum de vitamina C', 'Serums', 'Marca Demo A', 450, 'Ácido ascórbico, ácido ferúlico', ['todas'], 'Luminosidad y antioxidante', 'Aplicar por la mañana antes del bloqueador.', 8],
  ['Serum de niacinamida', 'Serums', 'Marca Demo B', 390, 'Niacinamida, zinc', ['grasa', 'mixta', 'normal'], 'Poros y control de brillo', 'Aplicar 2-3 gotas mañana y noche.', 12],
  ['Bloqueador solar FPS 50', 'Bloqueadores', 'Marca Demo A', 320, 'Filtros UVA/UVB, vitamina E', ['todas'], 'Protección solar', 'Aplicar 15 minutos antes de salir y reaplicar cada 2 horas.', 25],
  ['Contorno de ojos con cafeína', 'Contorno de ojos', 'Marca Demo B', 350, 'Cafeína, péptidos', ['todas'], 'Ojeras e hinchazón', 'Aplicar con ligeros golpecitos bajo el ojo.', 6],
  ['Parches hidratantes de ojos', 'Parches', 'Marca Demo B', 260, 'Colágeno, ácido hialurónico', ['seca', 'normal'], 'Hidratación intensiva', 'Colocar 15 minutos y retirar.', 30]
];

for (const [nombre, c, m, precio, ingredientes, tiposPiel, beneficios, modoUso, stock] of ejemplos) {
  productos.crear({ nombre, precio, ingredientes, tiposPiel, beneficios, modoUso, stock, stockMinimo: 3, idCategoria: cat[c], idMarca: mar[m] });
}
console.log(`Datos de ejemplo cargados: ${ejemplos.length} productos.`);
