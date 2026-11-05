const { z, texto } = require('./comun.validator');

const passwordSegura = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede exceder 72 caracteres')
  .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
  .regex(/[0-9]/, 'La contraseña debe incluir al menos un número');

const registro = z.object({
  nombre: texto(2, 100),
  correo: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  telefono: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, 'Teléfono inválido').optional(),
  password: passwordSegura
}).strict();

const login = z.object({
  correo: z.string().trim().toLowerCase().max(254),
  password: z.string().min(1).max(72)
}).strict();

module.exports = { registro, login };
