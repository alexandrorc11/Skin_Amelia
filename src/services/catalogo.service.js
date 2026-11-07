const AppError = require('../utils/AppError');
const productos = require('../models/producto.model');
const { categoria, marca } = require('../models/nombreUnico.model');

function exigirReferencias({ idCategoria, idMarca }) {
  if (!categoria.buscarPorId(idCategoria)) throw new AppError(400, 'La categoría indicada no existe');
  if (!marca.buscarPorId(idMarca)) throw new AppError(400, 'La marca indicada no existe');
}

function listar(filtros, { soloActivos }) {
  const { page, limit, ...resto } = filtros;
  const { items, total } = productos.listar({ ...resto, soloActivos, limit, offset: (page - 1) * limit });
  return { items, total, page, limit, totalPaginas: Math.max(1, Math.ceil(total / limit)) };
}

function obtenerPublico(id) {
  const p = productos.buscarPorId(id);
  // Un producto dado de baja no es accesible para clientes (HU-04)
  if (!p || !p.activo) throw new AppError(404, 'Producto no encontrado');
  return p;
}

function crearProducto(datos) {
  exigirReferencias(datos);
  return productos.buscarPorId(productos.crear(datos));
}

function actualizarProducto(id, datos) {
  exigirReferencias(datos);
  if (!productos.actualizar(id, datos)) throw new AppError(404, 'Producto no encontrado');
  return productos.buscarPorId(id);
}

function cambiarEstadoProducto(id, activo) {
  if (!productos.cambiarEstado(id, activo)) throw new AppError(404, 'Producto no encontrado');
  return productos.buscarPorId(id);
}

module.exports = { listar, obtenerPublico, crearProducto, actualizarProducto, cambiarEstadoProducto };
