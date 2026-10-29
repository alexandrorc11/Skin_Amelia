const jwt = require('jsonwebtoken');
const request = require('supertest');
const { crearApp } = require('../src/app');
const { getDb } = require('../src/config/db');
const { api, resetDb, CLIENTE, registrarCliente, tokenCliente, tokenAdmin, auth } = require('./helpers');

beforeEach(() => resetDb());

describe('HU-01 Registro de cliente', () => {
  test('registra un cliente válido y no expone la contraseña ni el hash', async () => {
    const r = await registrarCliente();
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ nombre: CLIENTE.nombre, correo: CLIENTE.correo });
    expect(JSON.stringify(r.body)).not.toMatch(/password|hash/i);
  });

  test('guarda la contraseña con hash (nunca en texto plano)', async () => {
    await registrarCliente();
    const fila = getDb().prepare('SELECT password_hash FROM cliente WHERE correo = ?').get(CLIENTE.correo);
    expect(fila.password_hash).not.toContain(CLIENTE.password);
    expect(fila.password_hash.startsWith('$2')).toBe(true); // formato bcrypt
  });

  test('normaliza el correo a minúsculas', async () => {
    const r = await registrarCliente({ ...CLIENTE, correo: '  ANA@Example.COM ' });
    expect(r.status).toBe(201);
    expect(r.body.correo).toBe('ana@example.com');
  });

  test('rechaza un correo ya registrado con 409 e invita a iniciar sesión', async () => {
    await registrarCliente();
    const r = await registrarCliente();
    expect(r.status).toBe(409);
    expect(r.body.error).toMatch(/inicia sesión/i);
  });

  test.each([
    ['correo inválido', { correo: 'no-es-correo' }, 'correo'],
    ['contraseña corta', { password: 'Ab1' }, 'password'],
    ['contraseña sin número', { password: 'SoloLetrasAqui' }, 'password'],
    ['contraseña sin letra', { password: '1234567890' }, 'password'],
    ['nombre vacío', { nombre: ' ' }, 'nombre'],
    ['teléfono inválido', { telefono: 'abc' }, 'telefono']
  ])('rechaza %s con 400 y señala el campo', async (_n, cambio, campo) => {
    const r = await registrarCliente({ ...CLIENTE, ...cambio });
    expect(r.status).toBe(400);
    expect(r.body.detalles.map((d) => d.campo)).toContain(campo);
  });

  test('rechaza campos desconocidos (evita asignación masiva de rol)', async () => {
    const r = await registrarCliente({ ...CLIENTE, rol: 'admin' });
    expect(r.status).toBe(400);
  });

  test('rechaza un JSON mal formado con 400', async () => {
    const r = await api().post('/api/auth/registro').set('Content-Type', 'application/json').send('{"nombre": ');
    expect(r.status).toBe(400);
  });
});

describe('HU-02 Inicio de sesión', () => {
  test('con credenciales correctas devuelve token y rol cliente', async () => {
    await registrarCliente();
    const r = await api().post('/api/auth/login').send({ correo: CLIENTE.correo, password: CLIENTE.password });
    expect(r.status).toBe(200);
    expect(r.body.rol).toBe('cliente');
    expect(typeof r.body.token).toBe('string');
    const payload = jwt.decode(r.body.token);
    expect(payload.exp).toBeGreaterThan(payload.iat); // el token expira
  });

  test('contraseña incorrecta y correo inexistente dan el mismo 401 genérico', async () => {
    await registrarCliente();
    const a = await api().post('/api/auth/login').send({ correo: CLIENTE.correo, password: 'Incorrecta1' });
    const b = await api().post('/api/auth/login').send({ correo: 'nadie@example.com', password: 'Incorrecta1' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.error).toBe(b.body.error);
  });

  test('bloquea la cuenta tras 5 intentos fallidos, incluso con la contraseña correcta', async () => {
    await registrarCliente();
    for (let i = 0; i < 5; i++) {
      const r = await api().post('/api/auth/login').send({ correo: CLIENTE.correo, password: 'Incorrecta1' });
      expect(r.status).toBe(401);
    }
    const r = await api().post('/api/auth/login').send({ correo: CLIENTE.correo, password: CLIENTE.password });
    expect(r.status).toBe(429);
  });

  test('un inicio de sesión exitoso reinicia el contador de fallos', async () => {
    await registrarCliente();
    for (let i = 0; i < 4; i++) {
      await api().post('/api/auth/login').send({ correo: CLIENTE.correo, password: 'Incorrecta1' });
    }
    const ok = await api().post('/api/auth/login').send({ correo: CLIENTE.correo, password: CLIENTE.password });
    expect(ok.status).toBe(200);
    const mal = await api().post('/api/auth/login').send({ correo: CLIENTE.correo, password: 'Incorrecta1' });
    expect(mal.status).toBe(401); // no queda bloqueada
  });

  test('el bloqueo termina cuando pasa el tiempo', async () => {
    await registrarCliente();
    getDb().prepare('UPDATE cliente SET bloqueado_hasta = ?').run(Date.now() - 1000);
    const r = await api().post('/api/auth/login').send({ correo: CLIENTE.correo, password: CLIENTE.password });
    expect(r.status).toBe(200);
  });

  test('rechaza un login sin contraseña con 400', async () => {
    const r = await api().post('/api/auth/login').send({ correo: CLIENTE.correo });
    expect(r.status).toBe(400);
  });

  test('la administradora inicia sesión con rol admin', async () => {
    const token = await tokenAdmin();
    const r = await api().get('/api/auth/perfil').set(auth(token));
    expect(r.status).toBe(200);
    expect(r.body.rol).toBe('admin');
  });
});

describe('Autenticación con token', () => {
  test('perfil sin token devuelve 401', async () => {
    expect((await api().get('/api/auth/perfil')).status).toBe(401);
  });

  test('perfil con token basura devuelve 401', async () => {
    expect((await api().get('/api/auth/perfil').set(auth('abc.def.ghi'))).status).toBe(401);
  });

  test('perfil con esquema de autorización distinto a Bearer devuelve 401', async () => {
    expect((await api().get('/api/auth/perfil').set('Authorization', 'Basic abc')).status).toBe(401);
  });

  test('un token expirado devuelve 401', async () => {
    await registrarCliente();
    const vencido = jwt.sign({ rol: 'cliente' }, process.env.JWT_SECRET, { subject: '1', expiresIn: -10 });
    expect((await api().get('/api/auth/perfil').set(auth(vencido))).status).toBe(401);
  });

  test('un token firmado con otra llave devuelve 401', async () => {
    await registrarCliente();
    const falso = jwt.sign({ rol: 'cliente' }, 'otra-llave-distinta-0123456789-abcdef', { subject: '1' });
    expect((await api().get('/api/auth/perfil').set(auth(falso))).status).toBe(401);
  });

  test('un token sin firma (alg none) devuelve 401', async () => {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const sinFirma = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: '1', rol: 'admin' })}.`;
    expect((await api().get('/api/auth/perfil').set(auth(sinFirma))).status).toBe(401);
  });

  test('un token de una cuenta que ya no existe devuelve 401', async () => {
    const token = await tokenCliente();
    getDb().prepare('DELETE FROM cliente').run();
    expect((await api().get('/api/auth/perfil').set(auth(token))).status).toBe(401);
  });

  test('un cliente no puede hacerse pasar por admin cambiando el rol del token', async () => {
    await registrarCliente();
    const manipulado = jwt.sign({ rol: 'admin' }, 'llave-adivinada-0123456789-abcdefghijk', { subject: '1' });
    expect((await api().get('/api/admin/productos').set(auth(manipulado))).status).toBe(401);
  });
});

describe('Protección contra abuso del login', () => {
  test('limita las solicitudes de login por IP (rate limiting)', async () => {
    const limitada = crearApp({ limiteLogin: 3 });
    const intento = () => request(limitada).post('/api/auth/login').send({ correo: 'x@example.com', password: 'Algo1234' });
    for (let i = 0; i < 3; i++) expect((await intento()).status).toBe(401);
    expect((await intento()).status).toBe(429);
  });
});
