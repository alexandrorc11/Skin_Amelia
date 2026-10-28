const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const { limitadorGeneral } = require('./middlewares/limitadores');
const { noEncontrado, errorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const categoriasMarcasRoutes = require('./routes/categoriasMarcas.routes');
const adminRoutes = require('./routes/admin.routes');

// Fábrica de la app: permite crear instancias distintas en las pruebas (p. ej. con límites bajos).
function crearApp(opciones = {}) {
  const limiteGeneral = opciones.limiteGeneral ?? env.rateLimitGeneral;
  const limiteLogin = opciones.limiteLogin ?? env.rateLimitLogin;

  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins.length ? env.corsOrigins : false }));
  app.use(express.json({ limit: '10kb' }));
  app.use('/api', limitadorGeneral(limiteGeneral));

  app.get('/api/salud', (req, res) => res.json({ estado: 'ok' }));
  app.use('/api/auth', authRoutes({ limiteLogin }));
  app.use('/api/admin', adminRoutes);
  app.use('/api', productosRoutes);
  app.use('/api', categoriasMarcasRoutes);

  app.use(noEncontrado);
  app.use(errorHandler);
  return app;
}

module.exports = { crearApp };
