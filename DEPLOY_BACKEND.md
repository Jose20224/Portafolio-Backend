# Cierre del backend y conexión con Portafolio-Frontend

Esta entrega es un **parche de la Parte 8** para aplicar sobre el repositorio existente `Jose20224/Portafolio-Backend`. No sustituye los módulos de las Partes 1 a 7.

## 1. Qué se cierra en esta parte

- Límite general de 120 solicitudes por minuto y por IP.
- Límite de 10 solicitudes de inicio de sesión cada 15 minutos por IP.
- El límite existente del formulario de contacto se conserva.
- `/api/v1/health/live` comprueba que el proceso HTTP responde sin consultar Supabase.
- `/api/v1/health/ready` comprueba la conexión con Supabase; responde `503` si la base de datos no está disponible.
- `/api/v1/health` se conserva por compatibilidad y funciona como readiness check.
- Validación estricta de `NODE_ENV`, `FRONTEND_ORIGINS`, `PORT`, `TRUST_PROXY_HOPS` y credenciales de Supabase al iniciar.
- Se desactiva la cabecera `X-Powered-By`; se conserva Helmet, CORS exacto y el `ValidationPipe` global.
- Pruebas automatizadas para validación de entorno, límites de solicitudes y firmas de imagen.
- Pipeline de GitHub Actions para validar el backend.
- Blueprint `render.yaml` para desplegar el servicio NestJS en Render.

No se requiere una migración SQL nueva para esta entrega.

## 2. Cómo aplicar el parche

Desde la raíz local del repositorio `Portafolio-Backend`, extrae el ZIP y copia el contenido de su carpeta `backend/` sobre la carpeta `backend/` del repositorio. Copia también `render.yaml` y `.github/workflows/backend-ci.yml` en las ubicaciones equivalentes.

Confirma que se reemplazaron estos archivos:

- `backend/package.json`
- `backend/.env.example`
- `backend/src/main.ts`
- `backend/src/config/validate-environment.ts`
- `backend/src/health/health.controller.ts`

Y que se añadieron:

- `backend/src/common/middleware/api-rate-limit.middleware.ts`
- `backend/test/environment-validation.test.mjs`
- `backend/test/image-signature.test.mjs`
- `backend/test/api-rate-limit.middleware.test.mjs`
- `render.yaml`
- `.github/workflows/backend-ci.yml`

## 3. Validar en local (PowerShell)

```powershell
cd .\backend
Copy-Item .env.example .env
```

Edita `backend/.env` con las claves reales de Supabase. Para desarrollo local usa:

```env
NODE_ENV=development
PORT=3000
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
TRUST_PROXY_HOPS=0
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_TU_CLAVE
SUPABASE_SECRET_KEY=sb_secret_TU_CLAVE
```

Luego ejecuta:

```powershell
npm install --include=dev
npm run typecheck
npm test
npm run start:dev
```

`npm test` ejecuta el build de NestJS y luego las pruebas de Node.js. Si `npm install` crea `package-lock.json`, conserva ese archivo en el repositorio para que las instalaciones futuras puedan ser reproducibles.

En otra terminal verifica:

```powershell
Invoke-RestMethod http://localhost:3000/api/v1/health/live
Invoke-RestMethod http://localhost:3000/api/v1/health/ready
```

La segunda ruta requiere que Supabase esté disponible y que `portfolio_profile` exista.

## 4. Despliegue del backend en Render

El archivo `render.yaml` define un servicio Node con `rootDir: backend`, compilación, pruebas y health check de readiness. Render usa `PORT` automáticamente.

1. Sube el parche al repositorio `Portafolio-Backend`.
2. En Render, crea un Blueprint y conecta `Jose20224/Portafolio-Backend`, rama `main`.
3. Revisa que el recurso detectado se llame `portafolio-api` y que el directorio raíz sea `backend`.
4. Cuando Render solicite las variables secretas, configura:

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Clave publishable del proyecto |
| `SUPABASE_SECRET_KEY` | Clave secret del proyecto; solo backend |
| `FRONTEND_ORIGINS` | Origen exacto de Vercel, sin ruta ni `/` final |
| `TRUST_PROXY_HOPS` | `1` con el proxy estándar de Render |

`SUPABASE_SECRET_KEY` debe configurarse como variable secreta de Render. No se escribe en `render.yaml`, no se sube a Git y nunca se coloca en el frontend.

Para el dominio de frontend actualmente utilizado, el origen sería:

```env
FRONTEND_ORIGINS=https://portafolio-frontend-alpha.vercel.app
```

Añade otros dominios propios separados por coma, por ejemplo `https://www.midominio.com`. En producción todos deben usar HTTPS. No incluyas `*`, rutas (`/admin`) ni barras finales. Para trabajar en local, configura esos orígenes en el entorno local, no en producción.

5. Despliega y comprueba que Render marque el health check como correcto.
6. Verifica las dos rutas:

```text
https://TU-SERVICIO.onrender.com/api/v1/health/live
https://TU-SERVICIO.onrender.com/api/v1/health/ready
```

La ruta `ready` debe indicar `dependencies.database: connected`. No publiques ni compartas el valor de las claves cuando revises los logs.

## 5. Conectar el frontend desplegado en Vercel

En el proyecto `Portafolio-Frontend`, define esta variable en Vercel para Production y Preview según el entorno:

```env
VITE_API_BASE_URL=https://TU-SERVICIO.onrender.com/api/v1
```

No agregues `/` al final. En desarrollo local, el valor debe ser:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Después de cambiar la variable en Vercel, crea un nuevo deployment: las variables `VITE_*` se incorporan al bundle durante el build.

**El frontend solo necesita la URL del API.** No añadas `SUPABASE_SECRET_KEY`, service-role ni claves secretas a `VITE_*`, al código React, a GitHub ni al navegador. La comunicación con Supabase y el uso de la clave secret ocurren dentro del backend.

Si el sitio tiene dominio propio, agrega su origen exacto a `FRONTEND_ORIGINS` en Render y vuelve a desplegar el backend. CORS solo controla qué orígenes de navegador pueden leer respuestas; no reemplaza la autenticación ni el rate limit.

## 6. Rutas para la conexión del frontend

Todas las rutas siguientes llevan el prefijo `https://TU-SERVICIO.onrender.com/api/v1`.

### Contenido público

| Método | Endpoint | Uso en React |
|---|---|---|
| GET | `/portfolio/profile` | Perfil y contenido principal del hero |
| GET | `/portfolio/social-links` | Redes sociales visibles |
| GET | `/portfolio/skills` | Habilidades agrupadas en `technical`, `tools`, `interests` |
| GET | `/portfolio/categories` | Categorías activas |
| GET | `/portfolio/projects?page=1&limit=12` | Listado público paginado |
| GET | `/portfolio/projects?category=web` | Filtrar por slug de categoría |
| GET | `/portfolio/projects?featured=true` | Proyectos destacados |
| GET | `/portfolio/projects/:slug` | Detalle público por slug |
| POST | `/contact/messages` | Enviar formulario de contacto |

El listado devuelve `items` y `pagination`. El backend solo publica proyectos con `is_published = true` y perfiles con `is_public = true`.

### Administración

Todas las rutas de administración necesitan `Authorization: Bearer <accessToken>`.

| Método | Endpoint | Uso |
|---|---|---|
| POST | `/auth/login` | Iniciar sesión administrativa |
| POST | `/auth/refresh` | Renovar sesión |
| GET | `/auth/me` | Validar sesión y recuperar el admin |
| POST | `/auth/logout` | Cerrar sesión |
| GET/PATCH | `/admin/portfolio/profile` | Consultar/editar perfil |
| GET/POST/PATCH/DELETE | `/admin/portfolio/projects` y subrutas | Gestionar proyectos y relaciones |
| GET/POST/PATCH/DELETE | `/admin/portfolio/categories` y subrutas | Gestionar categorías |
| GET/POST/PATCH/DELETE | `/admin/portfolio/skills` y subrutas | Gestionar habilidades |
| GET/POST/PATCH/DELETE | `/admin/portfolio/social-links` y subrutas | Gestionar redes sociales |
| GET | `/admin/contact-messages` | Bandeja y filtros de mensajes |
| GET | `/admin/contact-messages/stats` | Estadísticas de mensajes |
| PATCH | `/admin/contact-messages/:id/status` | Cambiar estado del mensaje |
| POST | `/admin/storage/upload-url` | Solicitar URL firmada para cargar imagen |
| POST | `/admin/storage/confirm-upload` | Confirmar y validar imagen |
| GET/DELETE | `/admin/storage/objects` | Listar/eliminar imágenes no referenciadas |

Los administradores deben existir en Supabase Auth y tener una fila activa en `public.admin_users` con rol `owner` o `editor`. El ejemplo de alta inicial está en `backend/sql/create-first-owner.example.sql`; crea primero el usuario en Supabase Auth, copia su UUID y reemplaza los valores de ejemplo. No inventes un UUID ni reutilices uno ajeno.

## 7. Controles de seguridad y límites conocidos

- Helmet, CORS por origen exacto, validación global con rechazo de propiedades no declaradas y validación de entorno al iniciar.
- Rate limit general: 120 solicitudes por minuto por IP.
- Login: 10 intentos cada 15 minutos por IP.
- El formulario público conserva los límites propios de la Parte 5.
- Los contadores se guardan en memoria del proceso. Se reinician al reiniciar la API y no se comparten entre réplicas. Para escalar horizontalmente o mitigar ataques distribuidos, usa un rate limiter compartido (por ejemplo Redis) o las reglas del gateway/WAF antes de aumentar instancias.
- `TRUST_PROXY_HOPS` afecta la IP usada por los límites. Mantén `1` únicamente con la configuración estándar de Render; si usas otro proveedor, define el número de proxies confiables de acuerdo con su topología. No pongas un valor alto a ciegas.
- La ruta `health/live` no consulta Supabase y queda exenta del rate limit para que el proveedor pueda comprobar que el proceso responde. `health/ready` sí consulta Supabase.
- No se han ejecutado aún pruebas E2E contra una instancia real, login real ni subida/eliminación real en Storage; esas comprobaciones se hacen después de configurar los secretos y desplegar.

## 8. Qué significa que el backend esté listo

Con esta entrega quedan definidos el build, las pruebas unitarias iniciales, los límites básicos, CORS estricto, variables de producción y el Blueprint. La salida a producción se considera validada cuando:

- GitHub Actions termina en verde.
- Render termina el build y pasa `/api/v1/health/ready`.
- El frontend en Vercel llama al backend con `VITE_API_BASE_URL`.
- Se prueba el formulario público.
- Se prueba login, `/auth/me`, CRUD administrativo y Storage con una cuenta `owner` o `editor` real.

La integración de las pantallas públicas React para reemplazar sus datos estáticos por las rutas `/portfolio/*` es la siguiente tarea del frontend; esta entrega no modifica los componentes públicos de React.
