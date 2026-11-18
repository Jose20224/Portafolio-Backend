# Estado del proyecto — Portafolio Backend (Partes 1–6)

## Entrega acumulada

| Parte | Contenido | Estado |
|---|---|---|
| 1 | Estructura NestJS, configuración, cliente Supabase, health check | Preparada |
| 2 | Login, refresh, logout, validación de JWT, roles owner/editor | Preparada |
| 3 | Endpoints públicos del portafolio | Preparada |
| 4 | CRUD administrativo de contenido y auditoría | Preparada |
| 5 | Mensajes públicos de contacto, rate limit y bandeja administrativa | Preparada |
| 6 | Supabase Storage: URL firmada, confirmación de imagen, listado y eliminación | Preparada |
| 7 | Integración de todas las pantallas del panel administrativo React | Pendiente |
| 8 | Pruebas integrales, hardening final, observabilidad y despliegue | Pendiente |

## Parte 6: detalles implementados

- Rutas autenticadas para solicitar URL firmada de carga, confirmar, listar y eliminar imágenes.
- API pública enriquecida con `hero_image_url`, `card_image_url`, `cover_image_url` y `avatar_url` a partir de las rutas del bucket.
- Validación de los campos `*_image_path`/`avatar_path` para aceptar rutas relativas dentro de la carpeta correspondiente, no URLs arbitrarias.
- Carpetas restringidas a `profile`, `projects` y `collaborators`.
- MIME permitido: JPEG, PNG, WebP, AVIF y GIF.
- Límite de tamaño: 8 MiB (coincide con la configuración verificada del bucket).
- Nombre de archivo normalizado y prefijado con UUID; no se sobrescriben activos.
- Confirmación de carga: descarga en servidor, límite de bytes y verificación de firma binaria.
- Eliminación bloqueada si el path está enlazado en perfil, proyectos o colaboradores.
- Auditoría en `admin_activity_logs` para acciones upload/delete.
- Servicio JavaScript de frontend que hace el flujo de URL firmada + PUT directo a Storage + confirmación.

## Supabase comprobado

Bucket existente: `portfolio-media`, público, límite 8,388,608 bytes, MIME `image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/gif`.

Políticas ya existentes: `portfolio_media_admin_insert`, `portfolio_media_admin_update`, `portfolio_media_admin_delete`, `portfolio_media_admin_select`; todas acotan el bucket y las carpetas a `profile`, `projects`, `collaborators` y los roles `owner`/`editor`.

No se modificó el esquema ni las políticas; por tanto, no se añadió migración SQL.

## Validaciones de esta entrega

- 39 archivos TypeScript: transpilation sintáctica con 0 diagnósticos.
- Grafo de imports relativos: 0 rutas faltantes.
- Archivos JavaScript del servicio de frontend: `node --check` correcto.
- Archivos JSON: válidos.
- Firmas binarias: 6/6 pruebas locales (JPEG, PNG, GIF, WebP, AVIF y contenido no válido).
- `npm install --ignore-scripts --no-audit --no-fund` excedió 45 segundos y no llegó a completar; por ello no se ejecutó `npm run typecheck` ni `npm run build`.
- No se ejecutó una carga real a Supabase, para no dejar archivos de prueba en el bucket del proyecto.

## Pendiente antes de producción

1. Ejecutar typecheck y build completos con Node 22.12+ y las dependencias instaladas.
2. Probar el flujo real de carga con un usuario owner y otro editor, incluido un archivo inválido.
3. Confirmar si el frontend ya almacena la ruta `path` en los campos de imagen, no URL completa.
4. Agregar limpieza periódica de archivos huérfanos si aumenta el uso.
5. Implementar las pantallas React en la Parte 7.
6. Ejecutar pruebas de autorización, carga concurrente, límites y errores en la Parte 8.

## GitHub

No se pudo publicar esta entrega desde la integración. Al crear ramas en este repositorio, GitHub respondió `403 Resource not accessible by integration`. No se realizó ningún push ni commit.
