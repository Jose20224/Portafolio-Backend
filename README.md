# Portafolio Backend — Parte 4

Esta entrega integra las Partes 1, 2 y 3 y agrega la **Parte 4: CRUD administrativo**. Contiene el backend NestJS completo del paquete, utilidades HTTP/API del frontend React y los `.gitignore`.

## Incluye

- Autenticación administrativa Supabase Auth, renovación/cierre de sesión y guards de rol.
- API pública de perfil, enlaces, habilidades, categorías y proyectos publicados.
- CRUD administrativo de perfil, enlaces sociales, habilidades, categorías y proyectos.
- CRUD individual de tecnologías, aspectos destacados y colaboradores de cada proyecto.
- Acciones explícitas para publicar y retirar proyectos.
- Registro de actividad en `admin_activity_logs`.
- `.gitignore` de raíz y de `backend/`.

## Aplicar

1. Descarga y extrae el ZIP.
2. Copia/combina su contenido sobre la raíz local de `Portafolio-Backend`.
3. Conserva el `.env` real local. No sobrescribas ni subas ese archivo.
4. En `backend/`, configura `.env` tomando como base `.env.example`.
5. Instala y valida:

```powershell
cd backend
npm install
npm run typecheck
npm run build
npm run start:dev
```

La API se sirve bajo `/api/v1`. Revisa `backend/README.md` para el detalle de rutas y ejemplos JSON.

## Estado

Revisa `STATUS.md` para ver qué partes están preparadas y qué falta antes de producción.

## GitHub

El archivo `GUIA_SUBIDA_MANUAL.md` contiene el procedimiento para crear una rama y subir la entrega si no se puede aplicar directamente desde la integración de GitHub.
