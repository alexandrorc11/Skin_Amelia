const { z, texto } = require('./comun.validator');

const TIPOS_PIEL = ['seca', 'grasa', 'mixta', 'normal', 'sensible', 'todas'];

const producto = z.object({
  nombre: texto(2, 120),
  precio: z.number().positive().max(1000000),
  ingredientes: texto(2, 2000),
  tiposPiel: z.array(z.enum(TIPOS_PIEL)).min(1).max(TIPOS_PIEL.length),
  beneficios: texto(0, 500).default(''),
  modoUso: texto(2, 1000),
  stock: z.number().int().min(0).max(100000).default(0),
  stockMinimo: z.number().int().min(0).max(100000).default(0),
  idCategoria: z.number().int().positive(),
  idMarca: z.number().int().positive()
}).strict(); // .strict(): rechaza campos desconocidos (evita asignación masiva)

const estadoProducto = z.object({ activo: z.boolean() }).strict();

// Búsqueda: solo letras, números, espacios y . , ' - (CU-03, excepción E1)
const textoBusqueda = z.string().trim().max(100)
  .regex(/^[\p{L}\p{N}\s.,'-]*$/u, 'La búsqueda contiene caracteres no permitidos');

const listaProductos = z.object({
  q: textoBusqueda.optional(),
  tipoPiel: z.enum(TIPOS_PIEL).optional(),
  idCategoria: z.coerce.number().int().positive().optional(),
  idMarca: z.coerce.number().int().positive().optional(),
  precioMin: z.coerce.number().min(0).optional(),
  precioMax: z.coerce.number().min(0).optional(),
  beneficio: textoBusqueda.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12)
}).refine((d) => d.precioMin === undefined || d.precioMax === undefined || d.precioMin <= d.precioMax, {
  message: 'precioMin no puede ser mayor que precioMax',
  path: ['precioMin']
});

module.exports = { producto, estadoProducto, listaProductos, TIPOS_PIEL };
