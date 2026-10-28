const { z } = require('zod');

z.config(z.locales.es()); // mensajes de validación en español

const texto = (min, max) => z.string().trim().min(min).max(max);
const idParam = z.object({ id: z.coerce.number().int().positive() });

module.exports = { z, texto, idParam };
