const { Router } = require('express');

const r = Router();
r.use(require('./adminProductos.routes'));
r.use(require('./adminCategoriasMarcas.routes'));

module.exports = r;
