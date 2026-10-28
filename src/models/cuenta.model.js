const { getDb } = require('../config/db');

// Fábrica de modelos de cuenta (cliente y administrador comparten la misma lógica).
// Los nombres de tabla/columna son constantes del código, nunca vienen del usuario.
function crearModeloCuenta({ tabla, idCol, conTelefono }) {
  const select = `SELECT *, ${idCol} AS id FROM ${tabla}`;
  return {
    crear({ nombre, correo, telefono, passwordHash }) {
      const cols = ['nombre', 'correo', 'password_hash'];
      const vals = [nombre, correo, passwordHash];
      if (conTelefono) {
        cols.push('telefono');
        vals.push(telefono ?? null);
      }
      const marcas = cols.map(() => '?').join(', ');
      const r = getDb().prepare(`INSERT INTO ${tabla} (${cols.join(', ')}) VALUES (${marcas})`).run(...vals);
      return Number(r.lastInsertRowid);
    },
    buscarPorCorreo(correo) {
      return getDb().prepare(`${select} WHERE correo = ?`).get(correo);
    },
    buscarPorId(id) {
      return getDb().prepare(`${select} WHERE ${idCol} = ?`).get(id);
    },
    // Suma un intento fallido; al llegar al máximo bloquea la cuenta. Devuelve true si quedó bloqueada.
    registrarFallo(id, maxIntentos, bloqueoMs) {
      const db = getDb();
      const tx = db.transaction(() => {
        db.prepare(`UPDATE ${tabla} SET intentos_fallidos = intentos_fallidos + 1 WHERE ${idCol} = ?`).run(id);
        const { intentos_fallidos: n } = db.prepare(`SELECT intentos_fallidos FROM ${tabla} WHERE ${idCol} = ?`).get(id);
        if (n >= maxIntentos) {
          db.prepare(`UPDATE ${tabla} SET intentos_fallidos = 0, bloqueado_hasta = ? WHERE ${idCol} = ?`)
            .run(Date.now() + bloqueoMs, id);
          return true;
        }
        return false;
      });
      return tx();
    },
    reiniciarFallos(id) {
      getDb().prepare(`UPDATE ${tabla} SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE ${idCol} = ?`).run(id);
    }
  };
}

module.exports = {
  cliente: crearModeloCuenta({ tabla: 'cliente', idCol: 'id_cliente', conTelefono: true }),
  administrador: crearModeloCuenta({ tabla: 'administrador', idCol: 'id_admin', conTelefono: false })
};
