const AppError = require('../utils/AppError');

// Controlador reutilizable para categorías y marcas (entidades con solo un nombre único).
module.exports = (modelo, etiqueta) => ({
  listar: (req, res) => res.json(modelo.listar()),

  crear: (req, res) => {
    const id = modelo.crear(req.datos.body.nombre);
    res.status(201).json(modelo.buscarPorId(id));
  },

  actualizar: (req, res) => {
    const { id } = req.datos.params;
    if (!modelo.actualizar(id, req.datos.body.nombre)) throw new AppError(404, `${etiqueta} no encontrada`);
    res.json(modelo.buscarPorId(id));
  }
});
