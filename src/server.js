const env = require('./config/env');
const { getDb } = require('./config/db');
const { crearApp } = require('./app');
const { crearAdminInicial } = require('./services/auth.service');

async function main() {
  getDb(); // crea el archivo y las tablas si no existen
  if (await crearAdminInicial()) console.log('Administradora inicial creada.');
  crearApp().listen(env.port, () => console.log(`Skin Amelia API escuchando en el puerto ${env.port}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
