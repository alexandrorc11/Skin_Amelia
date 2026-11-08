const { Router } = require('express');
const validar = require('../middlewares/validar');
const { idParam } = require('../validators/comun.validator');
const { nombreSimple } = require('../validators/nombreUnico.validator');
const { categoria, marca } = require('../models/nombreUnico.model');
const nombreUnico = require('../controllers/nombreUnico.controller');

const categorias = nombreUnico(categoria, 'Categoría');
const marcas = nombreUnico(marca, 'Marca');

// Administración de categorías y marcas (ya protegidas por admin.routes.js).
const r = Router();
r.post('/categorias', validar(nombreSimple), categorias.crear);
r.put('/categorias/:id', validar(idParam, 'params'), validar(nombreSimple), categorias.actualizar);
r.post('/marcas', validar(nombreSimple), marcas.crear);
r.put('/marcas/:id', validar(idParam, 'params'), validar(nombreSimple), marcas.actualizar);

module.exports = r;
