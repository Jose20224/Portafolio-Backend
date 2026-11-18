# Portafolio Backend — Partes 1 a 6

Entrega acumulada del backend NestJS + Supabase para el portafolio profesional.

## Contenido

1. Base del backend, configuración, health check y cliente Supabase.
2. Autenticación y autorización administrativa `owner`/`editor`.
3. API pública de perfil, enlaces, habilidades, categorías y proyectos publicados.
4. CRUD administrativo de perfil, redes, habilidades, categorías, proyectos y relaciones.
5. Formulario público de contacto, protección anti-spam y bandeja administrativa.
6. Gestión de imágenes en Supabase Storage: URL firmada, carga, comprobación binaria, listado y eliminación segura. Los endpoints públicos entregan también las URLs públicas de perfil/proyectos/colaboradores.

## Requisitos

- Node.js 22.12 o superior.
- Proyecto Supabase `PortaFolio_BD` con el esquema previamente creado.
- Variables configuradas en `backend/.env` a partir de `backend/.env.example`.
- Usuario administrador en `public.admin_users`.

## Instalación

```powershell
cd backend
npm install
npm run typecheck
npm run build
npm run start:dev
```

Prefijo de API: `/api/v1`.

## Seguridad

La clave `SUPABASE_SECRET_KEY` se utiliza solo dentro del proceso backend. No copiarla a Vite ni a ninguna variable `VITE_`. Los endpoints administrativos exigen un access token de Supabase validado y rol vigente en `admin_users`.

El bucket `portfolio-media` es público porque aloja imágenes de contenido público. No usarlo para documentos privados o información confidencial.

## Documentación

- `backend/README.md`: partes 1–5.
- `backend/README-PARTE-6.md`: bucket, rutas y flujo de carga.
- `GUIA_SUBIDA_MANUAL.md`: integración en el repositorio y comandos Git.
- `STATUS.md`: estado y validaciones.
