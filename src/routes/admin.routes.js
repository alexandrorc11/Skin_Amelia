const { Router } = require('express');
const { autenticar, soloAdmin } = require('../middlewares/auth');

const r = Router();
// Todo lo que cuelga de /api/admin exige sesión y rol de administrador (RS-04).
r.use(autenticar, soloAdmin);
r.use(require('./adminProductos.routes'));
r.use(require('./adminCategoriasMarcas.routes'));

module.exports = r;
