-- Esquema derivado del modelo ER (Sprint 1). En este sprint se implementan las
-- entidades de cuentas y catálogo; carrito, pedido, pago y reseña llegan en sprints siguientes.

CREATE TABLE IF NOT EXISTS cliente (
  id_cliente        INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre            TEXT    NOT NULL,
  correo            TEXT    NOT NULL UNIQUE,
  telefono          TEXT,
  password_hash     TEXT    NOT NULL,
  intentos_fallidos INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta   INTEGER
);

CREATE TABLE IF NOT EXISTS administrador (
  id_admin          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre            TEXT    NOT NULL,
  correo            TEXT    NOT NULL UNIQUE,
  password_hash     TEXT    NOT NULL,
  intentos_fallidos INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta   INTEGER
);

CREATE TABLE IF NOT EXISTS categoria (
  id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre       TEXT NOT NULL UNIQUE COLLATE NOCASE
);

CREATE TABLE IF NOT EXISTS marca (
  id_marca INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre   TEXT NOT NULL UNIQUE COLLATE NOCASE
);

CREATE TABLE IF NOT EXISTS producto (
  id_producto           INTEGER PRIMARY KEY AUTOINCREMENT,
  id_categoria          INTEGER NOT NULL REFERENCES categoria(id_categoria),
  id_marca              INTEGER NOT NULL REFERENCES marca(id_marca),
  nombre                TEXT    NOT NULL,
  precio                REAL    NOT NULL CHECK (precio > 0),
  ingredientes          TEXT    NOT NULL,
  tipo_piel_recomendado TEXT    NOT NULL,
  beneficios            TEXT    NOT NULL DEFAULT '',
  modo_uso              TEXT    NOT NULL,
  stock                 INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo          INTEGER NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  activo                INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_producto_categoria ON producto(id_categoria);
CREATE INDEX IF NOT EXISTS idx_producto_marca ON producto(id_marca);
CREATE INDEX IF NOT EXISTS idx_producto_activo ON producto(activo);
