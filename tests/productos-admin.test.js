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

describe('HU-14 Registrar producto (administradora)', () => {
  test('crea un producto completo y lo devuelve con 201', async () => {
    const r = await crear(productoValido(ids.idCategoria, ids.idMarca));
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({
      nombre: 'Limpiador facial suave',
      precio: 250,
      tiposPiel: ['seca', 'sensible'],
      activo: true,
      categoria: { nombre: 'Limpiadores' },
      marca: { nombre: 'Marca Demo' }
    });
  });

  test('sin sesión devuelve 401', async () => {
    const r = await api().post('/api/admin/productos').send(productoValido(ids.idCategoria, ids.idMarca));
    expect(r.status).toBe(401);
  });

  test('un cliente recibe 403 (HU-23)', async () => {
    const cliente = await tokenCliente();
    const r = await api().post('/api/admin/productos').set(auth(cliente)).send(productoValido(ids.idCategoria, ids.idMarca));
    expect(r.status).toBe(403);
    expect((await api().get('/api/admin/productos').set(auth(cliente))).status).toBe(403);
  });

  test('con datos incompletos devuelve 400 e indica los campos', async () => {
    const r = await crear({ nombre: 'Solo nombre' });
    expect(r.status).toBe(400);
    const campos = r.body.detalles.map((d) => d.campo);
    expect(campos).toEqual(expect.arrayContaining(['precio', 'ingredientes', 'tiposPiel', 'modoUso', 'idCategoria', 'idMarca']));
  });

  test.each([
    ['precio cero', { precio: 0 }],
    ['precio negativo', { precio: -5 }],
    ['precio como texto', { precio: '250' }],
    ['stock negativo', { stock: -1 }],
    ['stock decimal', { stock: 1.5 }],
    ['tipo de piel inválido', { tiposPiel: ['escamosa'] }],
    ['tipos de piel vacío', { tiposPiel: [] }],
    ['nombre demasiado largo', { nombre: 'x'.repeat(121) }]
  ])('rechaza %s con 400', async (_n, cambio) => {
    const r = await crear(productoValido(ids.idCategoria, ids.idMarca, cambio));
    expect(r.status).toBe(400);
  });

  test('rechaza campos que el cliente no debe controlar (id, activo)', async () => {
    const r = await crear(productoValido(ids.idCategoria, ids.idMarca, { id: 99, activo: false }));
    expect(r.status).toBe(400);
  });

  test('rechaza una categoría o marca inexistente con 400', async () => {
    expect((await crear(productoValido(9999, ids.idMarca))).status).toBe(400);
    expect((await crear(productoValido(ids.idCategoria, 9999))).status).toBe(400);
  });
});

describe('HU-15 y HU-16 Editar y dar de baja', () => {
  test('edita un producto y los cambios se ven en el catálogo', async () => {
    const { body: p } = await crear(productoValido(ids.idCategoria, ids.idMarca));
    const r = await api().put(`/api/admin/productos/${p.id}`).set(auth(admin))
      .send(productoValido(ids.idCategoria, ids.idMarca, { precio: 300, nombre: 'Limpiador renovado' }));
    expect(r.status).toBe(200);
    const detalle = await api().get(`/api/productos/${p.id}`);
    expect(detalle.body).toMatchObject({ nombre: 'Limpiador renovado', precio: 300 });
  });

  test('editar un producto inexistente devuelve 404', async () => {
    const r = await api().put('/api/admin/productos/9999').set(auth(admin)).send(productoValido(ids.idCategoria, ids.idMarca));
    expect(r.status).toBe(404);
  });

  test('un id que no es número devuelve 400', async () => {
    const r = await api().put('/api/admin/productos/abc').set(auth(admin)).send(productoValido(ids.idCategoria, ids.idMarca));
    expect(r.status).toBe(400);
  });

  test('dar de baja oculta el producto al público pero lo conserva para la administradora', async () => {
    const { body: p } = await crear(productoValido(ids.idCategoria, ids.idMarca));
    const baja = await api().patch(`/api/admin/productos/${p.id}/estado`).set(auth(admin)).send({ activo: false });
    expect(baja.status).toBe(200);
    expect(baja.body.activo).toBe(false);

    expect((await api().get(`/api/productos/${p.id}`)).status).toBe(404);
    expect((await api().get('/api/productos')).body.total).toBe(0);
    const panel = await api().get('/api/admin/productos').set(auth(admin));
    expect(panel.body.total).toBe(1);
    // sigue existiendo en la base (historial)
    expect(getDb().prepare('SELECT COUNT(*) n FROM producto').get().n).toBe(1);
  });

  test('un producto dado de baja se puede reactivar', async () => {
    const { body: p } = await crear(productoValido(ids.idCategoria, ids.idMarca));
    await api().patch(`/api/admin/productos/${p.id}/estado`).set(auth(admin)).send({ activo: false });
    await api().patch(`/api/admin/productos/${p.id}/estado`).set(auth(admin)).send({ activo: true });
    expect((await api().get(`/api/productos/${p.id}`)).status).toBe(200);
  });

  test('cambiar el estado de un producto inexistente devuelve 404 y un valor no booleano 400', async () => {
    expect((await api().patch('/api/admin/productos/9999/estado').set(auth(admin)).send({ activo: false })).status).toBe(404);
    const { body: p } = await crear(productoValido(ids.idCategoria, ids.idMarca));
    expect((await api().patch(`/api/admin/productos/${p.id}/estado`).set(auth(admin)).send({ activo: 'no' })).status).toBe(400);
  });
});

