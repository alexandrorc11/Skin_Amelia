const { z, texto } = require('./comun.validator');

const nombreSimple = z.object({ nombre: texto(2, 80) }).strict();

module.exports = { nombreSimple };
