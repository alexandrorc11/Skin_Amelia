const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { cliente, administrador } = require('../models/cuenta.model');

// Hash de relleno: si el correo no existe igual se hace una comparación, para que el
// tiempo de respuesta no revele si una cuenta existe.
const HASH_RELLENO = bcrypt.hashSync('relleno-sin-uso-1', env.bcryptRounds);

const credencialesIncorrectas = () => new AppError(401, 'Correo o contraseña incorrectos');

async function registrarCliente({ nombre, correo, telefono, password }) {
  if (cliente.buscarPorCorreo(correo) || administrador.buscarPorCorreo(correo)) {
    throw new AppError(409, 'El correo ya está registrado. Inicia sesión.');
  }
  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  const id = cliente.crear({ nombre, correo, telefono, passwordHash });
  return { id, nombre, correo, telefono: telefono ?? null };
}

async function iniciarSesion({ correo, password }) {
  let rol = 'cliente';
  let modelo = cliente;
  let cuenta = cliente.buscarPorCorreo(correo);
  if (!cuenta) {
    rol = 'admin';
    modelo = administrador;
    cuenta = administrador.buscarPorCorreo(correo);
  }
  if (!cuenta) {
    await bcrypt.compare(password, HASH_RELLENO);
    throw credencialesIncorrectas();
  }

  if (cuenta.bloqueado_hasta && cuenta.bloqueado_hasta > Date.now()) {
    throw new AppError(429, 'Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intenta más tarde.');
  }

  const correcta = await bcrypt.compare(password, cuenta.password_hash);
  if (!correcta) {
    modelo.registrarFallo(cuenta.id, env.maxIntentosLogin, env.minutosBloqueo * 60 * 1000);
    throw credencialesIncorrectas();
  }

  modelo.reiniciarFallos(cuenta.id);
  const token = jwt.sign({ rol }, env.jwtSecret, {
    algorithm: 'HS256',
    subject: String(cuenta.id),
    expiresIn: env.jwtExpiresIn
  });
  return { token, rol, usuario: { id: cuenta.id, nombre: cuenta.nombre, correo: cuenta.correo } };
}

// Crea la administradora inicial a partir de variables de entorno (sin secretos en el código).
async function crearAdminInicial() {
  if (!env.adminEmail || !env.adminPassword) return false;
  if (administrador.buscarPorCorreo(env.adminEmail)) return false;
  const passwordHash = await bcrypt.hash(env.adminPassword, env.bcryptRounds);
  administrador.crear({ nombre: env.adminNombre, correo: env.adminEmail, passwordHash });
  return true;
}

module.exports = { registrarCliente, iniciarSesion, crearAdminInicial };
