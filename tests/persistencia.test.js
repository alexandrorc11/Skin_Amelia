// Comprueba que los datos sobreviven al reinicio: se usa un archivo real en lugar de memoria.
const fs = require('fs');
const os = require('os');
const path = require('path');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skin-amelia-'));
process.env.DB_PATH = path.join(dir, 'prueba.db');

afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

test('los datos persisten después de cerrar y volver a abrir la base de datos', () => {
  let db = require('../src/config/db');
  let { categoria, marca } = require('../src/models/nombreUnico.model');
  let productos = require('../src/models/producto.model');

  const idCategoria = categoria.crear('Serums');
  const idMarca = marca.crear('Marca Demo');
  const id = productos.crear({
    nombre: 'Serum persistente', precio: 400, ingredientes: 'Vitamina C', tiposPiel: ['mixta'],
    beneficios: '', modoUso: 'Por la mañana', stock: 5, stockMinimo: 1, idCategoria, idMarca
  });
  db.closeDb(); // simula apagar el servidor

  jest.resetModules(); // simula arrancar de nuevo
  db = require('../src/config/db');
  productos = require('../src/models/producto.model');
  const guardado = productos.buscarPorId(id);
  expect(guardado).toMatchObject({ nombre: 'Serum persistente', precio: 400, stock: 5 });
  db.closeDb();
});
