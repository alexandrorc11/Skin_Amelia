const request = require('supertest');
const bcrypt = require('bcryptjs');
const { crearApp } = require('../src/app');
const { resetDb } = require('../src/config/db');

const app = crearApp();
const api = () => request(app);

const CLIENTE = { nombre: 'Ana Prueba', correo: 'ana@example.com', telefono: '4491234567', password: 'Segura123' };
const ADMIN = { nombre: 'Admin Prueba', correo: 'admin@example.com', password: 'Admin12345' };

async function registrarCliente(datos = CLIENTE) {
  return api().post('/api/auth/registro').send(datos);
}

async function tokenCliente(datos = CLIENTE) {
  await registrarCliente(datos);
  const r = await api().post('/api/auth/login').send({ correo: datos.correo, password: datos.password });
  return r.body.token;
}

async function tokenAdmin() {
  const { administrador } = require('../src/models/cuenta.model'); // se carga aquí: pertenece al módulo de cuentas
  administrador.crear({
    nombre: ADMIN.nombre,
    correo: ADMIN.correo,
    passwordHash: bcrypt.hashSync(ADMIN.password, 4)
  });
  const r = await api().post('/api/auth/login').send({ correo: ADMIN.correo, password: ADMIN.password });
  return r.body.token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// Producto válido de ejemplo (necesita una categoría y marca existentes)
const productoValido = (idCategoria, idMarca, extra = {}) => ({
  nombre: 'Limpiador facial suave',
  precio: 250,
  ingredientes: 'Agua, glicerina, ácido hialurónico',
  tiposPiel: ['seca', 'sensible'],
  beneficios: 'Hidratación, limpieza suave',
  modoUso: 'Aplicar sobre rostro húmedo y enjuagar.',
  stock: 10,
  stockMinimo: 2,
  idCategoria,
  idMarca,
  ...extra
});

// Crea una categoría y una marca directamente en la base y devuelve sus ids
function catalogoBase() {
  const { categoria, marca } = require('../src/models/nombreUnico.model');
  return { idCategoria: categoria.crear('Limpiadores'), idMarca: marca.crear('Marca Demo') };
}

module.exports = { api, app, resetDb, CLIENTE, ADMIN, registrarCliente, tokenCliente, tokenAdmin, auth, productoValido, catalogoBase };
