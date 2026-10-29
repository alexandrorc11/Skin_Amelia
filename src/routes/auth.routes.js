const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validar = require('../middlewares/validar');
const { autenticar } = require('../middlewares/auth');
const { limitadorLogin } = require('../middlewares/limitadores');
const v = require('../validators/auth.validator');
const ctrl = require('../controllers/auth.controller');

module.exports = ({ limiteLogin }) => {
  const r = Router();
  r.post('/registro', validar(v.registro), asyncHandler(ctrl.registro));
  r.post('/login', limitadorLogin(limiteLogin), validar(v.login), asyncHandler(ctrl.login));
  r.get('/perfil', autenticar, ctrl.perfil);
  return r;
};
