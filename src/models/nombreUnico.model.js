const { getDb } = require('../config/db');

// Fábrica para entidades simples con solo un nombre único (categoría y marca).
function crearModeloNombre({ tabla, idCol }) {
  return {
    listar() {
      return getDb().prepare(`SELECT ${idCol} AS id, nombre FROM ${tabla} ORDER BY nombre COLLATE NOCASE`).all();
    },
    buscarPorId(id) {
      return getDb().prepare(`SELECT ${idCol} AS id, nombre FROM ${tabla} WHERE ${idCol} = ?`).get(id);
    },
    crear(nombre) {
      const r = getDb().prepare(`INSERT INTO ${tabla} (nombre) VALUES (?)`).run(nombre);
      return Number(r.lastInsertRowid);
    },
    actualizar(id, nombre) {
      return getDb().prepare(`UPDATE ${tabla} SET nombre = ? WHERE ${idCol} = ?`).run(nombre, id).changes > 0;
    }
  };
}

module.exports = {
  categoria: crearModeloNombre({ tabla: 'categoria', idCol: 'id_categoria' }),
  marca: crearModeloNombre({ tabla: 'marca', idCol: 'id_marca' })
};
