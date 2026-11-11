// Matriz de control de acceso: cada ruta de administración debe exigir sesión (401) y rol admin (403).
const { api, resetDb, tokenCliente, tokenAdmin, auth } = require('./helpers');

const RUTAS_ADMIN = [
  ['get', '/api/admin/productos'],
  ['post', '/api/admin/productos'],
  ['put', '/api/admin/productos/1'],
  ['patch', '/api/admin/productos/1/estado'],
  ['post', '/api/admin/categorias'],
  ['put', '/api/admin/categorias/1'],
  ['post', '/api/admin/marcas'],
  ['put', '/api/admin/marcas/1']
];

let cliente;
let admin;

beforeEach(async () => {
  resetDb();
  cliente = await tokenCliente();
  admin = await tokenAdmin();
});

describe.each(RUTAS_ADMIN)('%s %s', (metodo, ruta) => {
  test('sin sesión devuelve 401', async () => {
    expect((await api()[metodo](ruta).send({})).status).toBe(401);
  });

  test('con sesión de cliente devuelve 403', async () => {
    expect((await api()[metodo](ruta).set(auth(cliente)).send({})).status).toBe(403);
  });

  test('con sesión de administradora no es rechazada por permisos', async () => {
    const r = await api()[metodo](ruta).set(auth(admin)).send({});
    expect([401, 403]).not.toContain(r.status);
  });
});

describe('Rutas públicas del catálogo', () => {
  test.each(['/api/productos', '/api/categorias', '/api/marcas'])('%s no exige sesión', async (ruta) => {
    expect((await api().get(ruta)).status).toBe(200);
  });
});
