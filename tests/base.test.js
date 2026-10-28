const request = require('supertest');
const { crearApp } = require('../src/app');
const { api } = require('./helpers');

describe('Base del proyecto: seguridad general y manejo de errores', () => {
  test('GET /api/salud responde 200', async () => {
    const r = await api().get('/api/salud');
    expect(r.status).toBe(200);
    expect(r.body.estado).toBe('ok');
  });

  test('incluye cabeceras de seguridad y no revela el framework', async () => {
    const r = await api().get('/api/salud');
    expect(r.headers['x-powered-by']).toBeUndefined();
    expect(r.headers['x-content-type-options']).toBe('nosniff');
  });

  test('una ruta inexistente devuelve 404 en JSON', async () => {
    const r = await api().get('/api/no-existe');
    expect(r.status).toBe(404);
    expect(r.body.error).toBeDefined();
  });

  test('un JSON mal formado devuelve 400', async () => {
    const r = await api().post('/api/salud').set('Content-Type', 'application/json').send('{"a": ');
    expect(r.status).toBe(400);
  });

  test('un cuerpo demasiado grande devuelve 413', async () => {
    const r = await api().post('/api/salud').send({ texto: 'x'.repeat(20000) });
    expect(r.status).toBe(413);
  });

  test('limita las solicitudes generales por IP (rate limiting)', async () => {
    const limitada = crearApp({ limiteGeneral: 3 });
    for (let i = 0; i < 3; i++) expect((await request(limitada).get('/api/salud')).status).toBe(200);
    expect((await request(limitada).get('/api/salud')).status).toBe(429);
  });
});
