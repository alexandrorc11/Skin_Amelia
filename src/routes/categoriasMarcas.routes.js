const { Router } = require('express');
const { categoria, marca } = require('../models/nombreUnico.model');
const nombreUnico = require('../controllers/nombreUnico.controller');

const categorias = nombreUnico(categoria, 'Categoría');
const marcas = nombreUnico(marca, 'Marca');

// Rutas públicas: listas para los filtros del catálogo.
const r = Router();
r.get('/categorias', categorias.listar);
r.get('/marcas', marcas.listar);

module.exports = r;
