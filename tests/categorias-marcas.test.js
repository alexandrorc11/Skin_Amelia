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

describe('HU-17 Categorías y marcas', () => {
  test('crea, lista y edita categorías; el nombre es único sin importar mayúsculas', async () => {
    const dup = await api().post('/api/admin/categorias').set(auth(admin)).send({ nombre: 'limpiadores' });
    expect(dup.status).toBe(409);
    const nueva = await api().post('/api/admin/categorias').set(auth(admin)).send({ nombre: 'Serums' });
    expect(nueva.status).toBe(201);
    const edit = await api().put(`/api/admin/categorias/${nueva.body.id}`).set(auth(admin)).send({ nombre: 'Sérums' });
    expect(edit.body.nombre).toBe('Sérums');
    const lista = await api().get('/api/categorias');
    expect(lista.body.map((c) => c.nombre)).toEqual(expect.arrayContaining(['Limpiadores', 'Sérums']));
  });

  test('crea, lista y edita marcas; editar una inexistente devuelve 404', async () => {
    const nueva = await api().post('/api/admin/marcas').set(auth(admin)).send({ nombre: 'Otra Marca' });
    expect(nueva.status).toBe(201);
    expect((await api().get('/api/marcas')).body).toHaveLength(2);
    expect((await api().put('/api/admin/marcas/9999').set(auth(admin)).send({ nombre: 'X Y' })).status).toBe(404);
  });

  test('un cliente no puede crear categorías ni marcas', async () => {
    const cliente = await tokenCliente();
    expect((await api().post('/api/admin/categorias').set(auth(cliente)).send({ nombre: 'Hack' })).status).toBe(403);
    expect((await api().post('/api/admin/marcas').set(auth(cliente)).send({ nombre: 'Hack' })).status).toBe(403);
  });

  test('una categoría o marca puede existir sin productos', async () => {
    expect((await api().get('/api/categorias')).body).toHaveLength(1);
    expect((await api().get('/api/productos')).body.total).toBe(0);
  });
});

