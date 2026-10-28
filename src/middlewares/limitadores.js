const rateLimit = require('express-rate-limit');

const crear = (limit, mensaje) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: mensaje }
});

module.exports = {
  limitadorGeneral: (limit) => crear(limit, 'Demasiadas solicitudes, intenta más tarde'),
  limitadorLogin: (limit) => crear(limit, 'Demasiados intentos de inicio de sesión, intenta más tarde')
};
