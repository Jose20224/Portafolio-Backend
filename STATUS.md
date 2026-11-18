# Estado del proyecto Portafolio — cierre del backend (Parte 8)

## Partes preparadas

| Parte | Alcance | Estado |
|---|---|---|
| 1 | Base del backend, configuración y Supabase | Preparada |
| 2 | Autenticación administrativa y roles | Preparada |
| 3 | API pública del portafolio | Preparada |
| 4 | CRUD administrativo del contenido | Preparada |
| 5 | Mensajes públicos y bandeja administrativa | Preparada |
| 6 | Carga y gestión de imágenes en Storage | Preparada |
| 7 | Panel administrativo React y servicios API | Preparada |
| 8 | Seguridad base, rate limiting, health checks, tests y despliegue | Parche preparado |

## Entregado en Parte 8

- Middleware de rate limit por IP: 120 solicitudes/minuto general y 10 intentos de login/15 minutos.
- Se conserva el rate limit específico del formulario de contacto de Parte 5.
- `GET /api/v1/health/live` y `GET /api/v1/health/ready`, manteniendo `/api/v1/health` como alias de readiness.
- Validación de entorno reforzada: `NODE_ENV`, orígenes exactos, HTTPS requerido en producción y prohibición de Supabase localhost en producción.
- `X-Powered-By` desactivado; Helmet, CORS y ValidationPipe global se conservan.
- Pruebas Node.js para configuración, limitador y firmas binarias de imágenes.
- GitHub Actions en `.github/workflows/backend-ci.yml`.
- Blueprint de Render en `render.yaml` para construir y ejecutar el servicio desde `backend/`.
- Guía de configuración de Render y Vercel en `DEPLOY_BACKEND.md`.

## Pendiente antes de considerar producción validada

1. Aplicar el parche al repositorio y subirlo a GitHub.
2. Ejecutar `npm install --include=dev`, lo que también generará `package-lock.json`; revisar y versionar ese lockfile.
3. Conseguir ejecución verde de `npm run typecheck` y `npm test` en la máquina local o GitHub Actions.
4. Configurar secretos en Render y desplegar el Blueprint.
5. Confirmar `/api/v1/health/ready` con Supabase.
6. Conectar `VITE_API_BASE_URL` en Vercel y ejecutar pruebas reales de login, formulario, CRUD y Storage.
7. Después, hacer que las secciones públicas React consuman `GET /portfolio/*` en vez de datos estáticos.

## Limitaciones técnicas conocidas

- Los límites de solicitudes son por proceso. No son un contador distribuido; antes de escalar a varias instancias se debe sustituir por Redis o por un rate limiter del gateway/WAF.
- Las pruebas añadidas son unitarias. No reemplazan las pruebas E2E contra Supabase ni una auditoría de seguridad externa.
- No se añadió una migración SQL: la fase usa las tablas, RLS y bucket `portfolio-media` creados en fases anteriores.
- El patch ZIP contiene solo los archivos añadidos o reemplazados de Parte 8; no incluye una copia duplicada de todo el backend.
