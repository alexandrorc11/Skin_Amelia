const { Router } = require('express');
const validar = require('../middlewares/validar');
const { idParam } = require('../validators/comun.validator');
const v = require('../validators/producto.validator');
const ctrl = require('../controllers/producto.controller');

// Administración de productos (ya protegidas por admin.routes.js).
const r = Router();
r.get('/productos', validar(v.listaProductos, 'query'), ctrl.listarAdmin);
r.post('/productos', validar(v.producto), ctrl.crear);
r.put('/productos/:id', validar(idParam, 'params'), validar(v.producto), ctrl.actualizar);
r.patch('/productos/:id/estado', validar(idParam, 'params'), validar(v.estadoProducto), ctrl.cambiarEstado);

module.exports = r;
