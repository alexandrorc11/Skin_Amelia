const { Router } = require('express');
const validar = require('../middlewares/validar');
const { idParam } = require('../validators/comun.validator');
const { listaProductos } = require('../validators/producto.validator');
const ctrl = require('../controllers/producto.controller');

// Rutas públicas: clientes sin sesión (solo ven productos activos).
const r = Router();
r.get('/productos', validar(listaProductos, 'query'), ctrl.listarPublico);
r.get('/productos/:id', validar(idParam, 'params'), ctrl.detallePublico);

module.exports = r;
