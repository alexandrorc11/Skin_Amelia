const { getDb } = require('../config/db');

const BASE = `
  SELECT p.id_producto AS id, p.nombre, p.precio, p.ingredientes, p.tipo_piel_recomendado,
         p.beneficios, p.modo_uso, p.stock, p.stock_minimo, p.activo,
         p.id_categoria, c.nombre AS categoria, p.id_marca, m.nombre AS marca
  FROM producto p
  JOIN categoria c ON c.id_categoria = p.id_categoria
  JOIN marca m ON m.id_marca = p.id_marca`;

function aObjeto(r) {
  if (!r) return undefined;
  return {
    id: r.id,
    nombre: r.nombre,
    precio: r.precio,
    ingredientes: r.ingredientes,
    tiposPiel: r.tipo_piel_recomendado.split(','),
    beneficios: r.beneficios,
    modoUso: r.modo_uso,
    stock: r.stock,
    stockMinimo: r.stock_minimo,
    activo: r.activo === 1,
    categoria: { id: r.id_categoria, nombre: r.categoria },
    marca: { id: r.id_marca, nombre: r.marca }
  };
}

// Escapa comodines de LIKE para que el texto del usuario se trate como texto literal.
const like = (s) => `%${s.replace(/[\\%_]/g, '\\$&')}%`;

module.exports = {
  buscarPorId(id) {
    return aObjeto(getDb().prepare(`${BASE} WHERE p.id_producto = ?`).get(id));
  },

  // Todas las condiciones usan parámetros (?) para evitar inyección SQL.
  listar({ q, tipoPiel, idCategoria, idMarca, precioMin, precioMax, beneficio, soloActivos, limit, offset }) {
    const cond = [];
    const params = [];
    if (soloActivos) cond.push('p.activo = 1');
    if (q) {
      cond.push("(p.nombre LIKE ? ESCAPE '\\' OR m.nombre LIKE ? ESCAPE '\\' OR c.nombre LIKE ? ESCAPE '\\')");
      params.push(like(q), like(q), like(q));
    }
    if (tipoPiel) {
      cond.push("(p.tipo_piel_recomendado LIKE ? OR p.tipo_piel_recomendado LIKE '%todas%')");
      params.push(`%${tipoPiel}%`); // tipoPiel ya viene validado contra una lista fija
    }
    if (idCategoria) { cond.push('p.id_categoria = ?'); params.push(idCategoria); }
    if (idMarca) { cond.push('p.id_marca = ?'); params.push(idMarca); }
    if (precioMin !== undefined) { cond.push('p.precio >= ?'); params.push(precioMin); }
    if (precioMax !== undefined) { cond.push('p.precio <= ?'); params.push(precioMax); }
    if (beneficio) { cond.push("p.beneficios LIKE ? ESCAPE '\\'"); params.push(like(beneficio)); }

    const where = cond.length ? ` WHERE ${cond.join(' AND ')}` : '';
    const db = getDb();
    const { total } = db.prepare(`
      SELECT COUNT(*) AS total FROM producto p
      JOIN categoria c ON c.id_categoria = p.id_categoria
      JOIN marca m ON m.id_marca = p.id_marca${where}`).get(...params);
    const filas = db.prepare(`${BASE}${where} ORDER BY p.nombre COLLATE NOCASE, p.id_producto LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);
    return { items: filas.map(aObjeto), total };
  },

  crear(d) {
    const r = getDb().prepare(`
      INSERT INTO producto (id_categoria, id_marca, nombre, precio, ingredientes,
                            tipo_piel_recomendado, beneficios, modo_uso, stock, stock_minimo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(d.idCategoria, d.idMarca, d.nombre, d.precio, d.ingredientes,
        d.tiposPiel.join(','), d.beneficios, d.modoUso, d.stock, d.stockMinimo);
    return Number(r.lastInsertRowid);
  },

  actualizar(id, d) {
    return getDb().prepare(`
      UPDATE producto SET id_categoria = ?, id_marca = ?, nombre = ?, precio = ?, ingredientes = ?,
             tipo_piel_recomendado = ?, beneficios = ?, modo_uso = ?, stock = ?, stock_minimo = ?
      WHERE id_producto = ?`)
      .run(d.idCategoria, d.idMarca, d.nombre, d.precio, d.ingredientes,
        d.tiposPiel.join(','), d.beneficios, d.modoUso, d.stock, d.stockMinimo, id).changes > 0;
  },

  cambiarEstado(id, activo) {
    return getDb().prepare('UPDATE producto SET activo = ? WHERE id_producto = ?').run(activo ? 1 : 0, id).changes > 0;
  }
};
