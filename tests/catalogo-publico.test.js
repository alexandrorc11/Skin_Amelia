const { getDb } = require('../src/config/db');
const { api, resetDb, tokenCliente, tokenAdmin, auth, productoValido, catalogoBase } = require('./helpers');

let admin;
let ids;

beforeEach(async () => {
  resetDb();
  admin = await tokenAdmin();
  ids = catalogoBase();
});

const crear = (datos) => api().post('/api/admin/productos').set(auth(admin)).send(datos);

describe('HU-03/04/05/06 Catálogo público: detalle, búsqueda y filtros', () => {
  beforeEach(async () => {
    const { categoria, marca } = require('../src/models/nombreUnico.model');
    const cat2 = categoria.crear('Serums');
    const marca2 = marca.crear('Otra Marca');
    await crear(productoValido(ids.idCategoria, ids.idMarca, { nombre: 'Limpiador espumoso', precio: 150, tiposPiel: ['grasa'], beneficios: 'Control de grasa' }));
    await crear(productoValido(ids.idCategoria, ids.idMarca, { nombre: 'Limpiador cremoso', precio: 300, tiposPiel: ['seca'], beneficios: 'Hidratación' }));
    await crear(productoValido(cat2, marca2, { nombre: 'Serum de vitamina C', precio: 500, tiposPiel: ['todas'], beneficios: 'Luminosidad' }));
    const oculto = await crear(productoValido(cat2, marca2, { nombre: 'Serum oculto', precio: 100 }));
    await api().patch(`/api/admin/productos/${oculto.body.id}/estado`).set(auth(admin)).send({ activo: false });
  });

  test('lista solo productos activos, ordenados por nombre, con precio, marca y categoría', async () => {
    const r = await api().get('/api/productos');
    expect(r.status).toBe(200);
    expect(r.body.total).toBe(3);
    expect(r.body.items.map((p) => p.nombre)).toEqual(['Limpiador cremoso', 'Limpiador espumoso', 'Serum de vitamina C']);
    expect(r.body.items[0]).toEqual(expect.objectContaining({ precio: 300, marca: expect.any(Object), categoria: expect.any(Object) }));
  });

  test('el detalle muestra ingredientes, tipos de piel, modo de uso y beneficios', async () => {
    const lista = await api().get('/api/productos?q=cremoso');
    const r = await api().get(`/api/productos/${lista.body.items[0].id}`);
    expect(r.status).toBe(200);
    expect(r.body).toEqual(expect.objectContaining({
      ingredientes: expect.any(String), tiposPiel: ['seca'], modoUso: expect.any(String), beneficios: 'Hidratación', stock: 10
    }));
  });

  test('el detalle de un producto inexistente devuelve 404', async () => {
    expect((await api().get('/api/productos/9999')).status).toBe(404);
  });

  test('busca por nombre, por marca y por categoría sin distinguir mayúsculas', async () => {
    expect((await api().get('/api/productos?q=LIMPIADOR')).body.total).toBe(2);
    expect((await api().get('/api/productos?q=otra marca')).body.total).toBe(1);
    expect((await api().get('/api/productos?q=serums')).body.total).toBe(1);
  });

  test('una búsqueda sin coincidencias devuelve lista vacía con 200', async () => {
    const r = await api().get('/api/productos?q=inexistente');
    expect(r.status).toBe(200);
    expect(r.body.items).toEqual([]);
  });

  test('rechaza una búsqueda con caracteres no permitidos (400) y la tabla sigue intacta', async () => {
    const r = await api().get('/api/productos').query({ q: "'; DROP TABLE producto; --" });
    expect(r.status).toBe(400);
    expect(getDb().prepare('SELECT COUNT(*) n FROM producto').get().n).toBe(4);
  });

  test('un texto con comillas pero sin caracteres peligrosos se trata como texto, no como SQL', async () => {
    const r = await api().get('/api/productos').query({ q: "' OR 1 OR '" });
    expect(r.status).toBe(200);
    expect(r.body.total).toBe(0); // si fuera inyección devolvería todo el catálogo
  });

  test('los comodines % y _ no se aceptan en la búsqueda (400)', async () => {
    expect((await api().get('/api/productos').query({ q: 'Limpiador_espumoso' })).status).toBe(400);
    expect((await api().get('/api/productos').query({ q: '%' })).status).toBe(400);
  });

  test('filtra por tipo de piel (incluye los productos para "todas")', async () => {
    const r = await api().get('/api/productos?tipoPiel=grasa');
    expect(r.body.items.map((p) => p.nombre)).toEqual(['Limpiador espumoso', 'Serum de vitamina C']);
  });

  test('filtra por rango de precio, categoría, marca y beneficio', async () => {
    expect((await api().get('/api/productos?precioMin=200&precioMax=400')).body.items.map((p) => p.nombre)).toEqual(['Limpiador cremoso']);
    expect((await api().get(`/api/productos?idCategoria=${ids.idCategoria}`)).body.total).toBe(2);
    expect((await api().get(`/api/productos?idMarca=${ids.idMarca}`)).body.total).toBe(2);
    expect((await api().get('/api/productos?beneficio=hidrat')).body.items.map((p) => p.nombre)).toEqual(['Limpiador cremoso']);
  });

  test('combina varios filtros a la vez (todos deben cumplirse)', async () => {
    const r = await api().get(`/api/productos?idCategoria=${ids.idCategoria}&tipoPiel=seca&precioMax=350&q=limpiador`);
    expect(r.body.items.map((p) => p.nombre)).toEqual(['Limpiador cremoso']);
  });

  test('rechaza filtros inválidos con 400', async () => {
    expect((await api().get('/api/productos?precioMin=500&precioMax=100')).status).toBe(400);
    expect((await api().get('/api/productos?tipoPiel=escamosa')).status).toBe(400);
    expect((await api().get('/api/productos?precioMin=-5')).status).toBe(400);
    expect((await api().get('/api/productos?limit=1000')).status).toBe(400);
  });

  test('pagina los resultados', async () => {
    const p1 = await api().get('/api/productos?limit=2&page=1');
    const p2 = await api().get('/api/productos?limit=2&page=2');
    expect(p1.body.items).toHaveLength(2);
    expect(p2.body.items).toHaveLength(1);
    expect(p1.body.totalPaginas).toBe(2);
  });
});
