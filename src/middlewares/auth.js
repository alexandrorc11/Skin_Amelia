const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { cliente, administrador } = require('../models/cuenta.model');

const MODELOS = { cliente, admin: administrador };

// Autenticación: exige un token Bearer válido y que la cuenta todavía exista.
function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) return next(new AppError(401, 'Autenticación requerida'));

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    return next(new AppError(401, 'Token inválido o expirado'));
  }

  const modelo = MODELOS[payload.rol];
  const cuenta = modelo && modelo.buscarPorId(Number(payload.sub));
  if (!cuenta) return next(new AppError(401, 'Token inválido o expirado'));

  req.usuario = { id: cuenta.id, rol: payload.rol, nombre: cuenta.nombre, correo: cuenta.correo };
  next();
}

// Autorización por rol (RNF-04).
const soloRol = (rol) => (req, res, next) =>
  req.usuario && req.usuario.rol === rol
    ? next()
    : next(new AppError(403, 'No tienes permiso para realizar esta acción'));

module.exports = { autenticar, soloAdmin: soloRol('admin'), soloCliente: soloRol('cliente') };
