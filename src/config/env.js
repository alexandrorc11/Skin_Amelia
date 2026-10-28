require('dotenv').config({ quiet: true });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('Falta la variable de entorno JWT_SECRET (revisa .env.example).');
}
if (isProd && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción.');
}

module.exports = {
  NODE_ENV,
  isProd,
  isTest,
  port: Number(process.env.PORT) || 3000,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  dbPath: process.env.DB_PATH || require('path').join(__dirname, '../../data/skin_amelia.db'),
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
  adminNombre: process.env.ADMIN_NOMBRE || 'Administradora',
  adminEmail: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  // Seguridad de acceso
  bcryptRounds: isTest ? 4 : 12, // 4 solo en pruebas para que corran rápido
  maxIntentosLogin: 5,
  minutosBloqueo: 15,
  rateLimitGeneral: Number(process.env.RATE_LIMIT_GENERAL) || 300, // por 15 min
  rateLimitLogin: Number(process.env.RATE_LIMIT_LOGIN) || 20 // por 15 min
};
