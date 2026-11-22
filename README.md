# Skin Amelia — API (Sprint 2)

Tienda en línea para un negocio de skincare. Este sprint entrega el **primer flujo funcional con persistencia**:
registro e inicio de sesión de clientes, catálogo con búsqueda y filtros, y administración de productos,
categorías y marcas por parte de la administradora.

## Requisitos
- Node.js 20 o superior

## Instalación y configuración
```bash
npm install
cp .env.example .env     # en Windows: copy .env.example .env
```
Edita `.env` y completa al menos:
- `JWT_SECRET`: genera una con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `ADMIN_EMAIL` y `ADMIN_PASSWORD`: la cuenta de administradora se crea sola al arrancar si no existe.

> El archivo `.env` está en `.gitignore`: **nunca** se sube al repositorio.

## Ejecutar
```bash
npm start            # servidor en http://localhost:3000
npm run seed         # (opcional) carga productos de ejemplo para la demo
```
Los datos se guardan en un archivo SQLite (`data/skin_amelia.db`), por lo que se conservan al reiniciar.

## Pruebas automatizadas
```bash
npm test             # pruebas de integración (HTTP + base de datos)
npm run test:cov     # con reporte de cobertura (carpeta coverage/)
```
Las pruebas usan una base en memoria y variables propias (`tests/setup-env.js`); no necesitan `.env`.
Cubren flujos exitosos, entradas inválidas y restricciones de acceso. Incluyen una prueba de persistencia
que cierra y vuelve a abrir la base de datos.

## Endpoints

| Método | Ruta | Acceso | Historia |
|---|---|---|---|
| POST | `/api/auth/registro` | Público | HU-01 |
| POST | `/api/auth/login` | Público | HU-02 |
| GET | `/api/auth/perfil` | Sesión iniciada | HU-02 |
| GET | `/api/productos` | Público | HU-03, HU-05, HU-06 |
| GET | `/api/productos/:id` | Público | HU-04 |
| GET | `/api/categorias`, `/api/marcas` | Público | HU-17 |
| GET | `/api/admin/productos` | Administradora | HU-14 |
| POST | `/api/admin/productos` | Administradora | HU-14 |
| PUT | `/api/admin/productos/:id` | Administradora | HU-15 |
| PATCH | `/api/admin/productos/:id/estado` | Administradora | HU-16 |
| POST / PUT | `/api/admin/categorias(/:id)`, `/api/admin/marcas(/:id)` | Administradora | HU-17 |

Filtros de `GET /api/productos`: `q`, `tipoPiel`, `idCategoria`, `idMarca`, `precioMin`, `precioMax`, `beneficio`, `page`, `limit`.

Códigos HTTP usados: 200, 201, 400 (datos inválidos), 401 (sin sesión o token inválido), 403 (sin permiso),
404, 409 (duplicado), 413, 429 (demasiados intentos) y 500.

## Organización del código (separación de responsabilidades)
```
src/
  routes/        define las rutas y encadena middlewares (qué URL, quién entra, qué se valida)
  middlewares/   autenticación, rol, validación de entradas, límites de intentos, manejo de errores
  controllers/   reciben la petición y arman la respuesta; no tocan la base de datos
  services/      reglas de negocio (login con bloqueo, verificar categoría/marca, etc.)
  models/        acceso a la base de datos (consultas parametrizadas)
  validators/    esquemas de validación de entradas
  config/        variables de entorno, conexión y esquema de la base
tests/           pruebas de integración
```

## Controles de seguridad implementados
| Control | Dónde |
|---|---|
| Contraseñas con hash (bcrypt) y política mínima (RS-01, RS-02) | `services/auth.service.js`, `validators` |
| Token firmado con expiración; algoritmo fijo (RS-03) | `services/auth.service.js`, `middlewares/auth.js` |
| Acceso por rol: cliente / administradora (RS-04) | `middlewares/auth.js`, `routes/admin.routes.js` |
| Validación de entradas en el servidor, rechazo de campos desconocidos (RS-06) | `middlewares/validar.js`, `validators` |
| Consultas parametrizadas contra inyección SQL (RS-06) | `models/` |
| Bloqueo tras 5 intentos fallidos y límite de solicitudes (RS-07) | `services/auth.service.js`, `middlewares/limitadores.js` |
| Secretos en variables de entorno; `.env` ignorado por git (RS-11) | `config/env.js`, `.gitignore` |
| Cabeceras de seguridad y CORS restringido (RS-12) | `app.js` (helmet, cors) |
| Mensajes de error genéricos, sin detalles internos (RS-14) | `middlewares/errorHandler.js` |

## Flujo de trabajo con Git (Gitflow)
- `main`: versiones estables. `develop`: integración. `feature/HU-XX-nombre`: una rama por historia.
- Todo entra a `develop` mediante pull request (con la plantilla de `.github/pull_request_template.md`) y al menos una revisión.
- Commits con mensajes claros: `feat(catalogo): agregar filtro por tipo de piel (#12)`.
- Al cerrar el sprint: `release/sprint-2` → `main`, con etiqueta de versión.

## Pendiente para próximos sprints
Carrito, pedidos, pagos, inventario automático, reseñas, notificaciones, reportes, pruebas E2E,
infraestructura de despliegue y CI/CD completo.
