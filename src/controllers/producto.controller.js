const catalogo = require('../services/catalogo.service');

// ----- Públicos (solo productos activos) -----
exports.listarPublico = (req, res) => {
  res.json(catalogo.listar(req.datos.query, { soloActivos: true }));
};

exports.detallePublico = (req, res) => {
  res.json(catalogo.obtenerPublico(req.datos.params.id));
};

// ----- Administración -----
exports.listarAdmin = (req, res) => {
  res.json(catalogo.listar(req.datos.query, { soloActivos: false }));
};

exports.crear = (req, res) => {
  res.status(201).json(catalogo.crearProducto(req.datos.body));
};

exports.actualizar = (req, res) => {
  res.json(catalogo.actualizarProducto(req.datos.params.id, req.datos.body));
};

exports.cambiarEstado = (req, res) => {
  res.json(catalogo.cambiarEstadoProducto(req.datos.params.id, req.datos.body.activo));
};
