const { getDb, resetDb } = require('../src/config/db');

beforeEach(() => resetDb());

describe('Administradora inicial por variables de entorno', () => {
  const cargar = (correo, password) => {
    jest.resetModules();
    process.env.ADMIN_EMAIL = correo;
    process.env.ADMIN_PASSWORD = password;
    return require('../src/services/auth.service');
  };

  afterEach(() => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
  });

  test('no crea nada si no hay variables configuradas', async () => {
    const svc = cargar('', '');
    expect(await svc.crearAdminInicial()).toBe(false);
  });

  test('crea la cuenta con la contraseña en hash y no la duplica al reiniciar', async () => {
    const svc = cargar('Dueña@Example.com', 'ClaveInicial1');
    expect(await svc.crearAdminInicial()).toBe(true);
    expect(await svc.crearAdminInicial()).toBe(false);
    // jest.resetModules() recarga la base; consultamos con la misma instancia del servicio
    const { getDb: db2 } = require('../src/config/db');
    const filas = db2().prepare('SELECT correo, password_hash FROM administrador').all();
    expect(filas).toHaveLength(1);
    expect(filas[0].correo).toBe('dueña@example.com');
    expect(filas[0].password_hash).not.toContain('ClaveInicial1');
  });
});
