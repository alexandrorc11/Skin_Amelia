const AppError = require('../utils/AppError');

// Valida body, query o params con un esquema de zod y deja el resultado limpio en req.datos[origen].
module.exports = (esquema, origen = 'body') => (req, res, next) => {
  const resultado = esquema.safeParse(req[origen]);
  if (!resultado.success) {
    const detalles = resultado.error.issues.map((i) => ({
      campo: i.path.join('.') || origen,
      mensaje: i.message
    }));
    return next(new AppError(400, 'Datos inválidos', detalles));
  }
  req.datos = { ...(req.datos || {}), [origen]: resultado.data };
  next();
};
