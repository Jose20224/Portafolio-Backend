# Portafolio API — Parte 2

Esta carpeta contiene el backend completo de las Partes 1 y 2. Consulta el `README.md` de la raíz del paquete para ver el procedimiento completo de instalación, alta del primer administrador, rutas y pruebas manuales.

## Nuevas rutas

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET /api/v1/admin/session`
- `GET /api/v1/admin/owner-check` (solo `owner`)

## Módulos nuevos

- `src/auth`: login, renovación de sesión, validación de administradores y cierre de sesión.
- `src/common/decorators`: decoradores `CurrentAdmin` y `Roles`.
- `src/common/guards`: validación de JWT y control de roles.
- `src/admin`: endpoints privados de comprobación de sesión y permisos.

## Variables de entorno

Actualiza `FRONTEND_ORIGINS` en el `.env` existente para incluir:

`https://portafolio-frontend-alpha.vercel.app`

Mantén `SUPABASE_SECRET_KEY` exclusivamente en el servidor.
