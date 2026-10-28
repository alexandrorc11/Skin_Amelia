const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const env = require('./env');

let db = null;

function getDb() {
  if (!db) {
    if (env.dbPath !== ':memory:') {
      fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });
    }
    db = new Database(env.dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  }
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

// Solo para pruebas: deja las tablas vacías entre casos de prueba.
function resetDb() {
  if (!env.isTest) throw new Error('resetDb solo puede usarse en pruebas');
  getDb().exec(`
    DELETE FROM producto; DELETE FROM categoria; DELETE FROM marca;
    DELETE FROM cliente; DELETE FROM administrador;
    DELETE FROM sqlite_sequence;
  `);
}

module.exports = { getDb, closeDb, resetDb };
