const authService = require('../services/auth.service');

exports.registro = async (req, res) => {
  const cliente = await authService.registrarCliente(req.datos.body);
  res.status(201).json(cliente);
};

exports.login = async (req, res) => {
  res.json(await authService.iniciarSesion(req.datos.body));
};

exports.perfil = (req, res) => {
  res.json(req.usuario);
};
