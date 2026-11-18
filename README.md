# Portafolio — Parte 7: panel administrativo React

Esta entrega integra el panel administrativo en el frontend existente `Portafolio-Frontend` y añade la conexión con la API desarrollada en las Partes 1 a 6.

## Qué contiene

- Inicio de sesión administrativo y restauración de sesión mediante refresh token.
- Rutas protegidas bajo `/admin`.
- Resumen con contadores de proyectos, categorías, habilidades y mensajes nuevos.
- Gestión del perfil profesional, visibilidad pública y carga de imagen principal.
- Gestión de proyectos: crear, editar, publicar, retirar de publicación y eliminar.
- Gestión de tecnologías, aspectos destacados y colaboradores por proyecto.
- CRUD de categorías, habilidades y redes sociales.
- Bandeja de mensajes con búsqueda, filtros, detalle y cambio de estado.
- Biblioteca de imágenes para las carpetas `profile`, `projects` y `collaborators`.
- Formulario público de contacto conectado a `POST /api/v1/contact/messages`.
- Cliente HTTP y servicios JS acumulados de las partes anteriores.

## Requisitos

- El frontend existente con React 19, Vite 8, React Router 7, Tailwind CSS 4 y Framer Motion.
- Node.js compatible con el proyecto actual.
- Backend de las Partes 1 a 6 desplegado y con su `.env` configurado.
- Cuenta creada en Supabase Auth y autorizada en `public.admin_users`.

No se añadieron dependencias npm nuevas.

## Rutas nuevas

| Ruta | Acceso |
|---|---|
| `/admin/login` | Público, solo para iniciar sesión |
| `/admin` | Administrador |
| `/admin/perfil` | Administrador |
| `/admin/proyectos` | Administrador |
| `/admin/categorias` | Administrador |
| `/admin/habilidades` | Administrador |
| `/admin/redes` | Administrador |
| `/admin/mensajes` | Administrador |
| `/admin/medios` | Administrador |

El panel no muestra el Navbar ni el Footer públicos. No modifica las rutas públicas de inicio, proyectos o detalle.

## Variables de entorno del frontend

Crear `.env.local` a partir de `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

En Vercel, definir `VITE_API_BASE_URL` con la URL desplegada del backend, incluyendo `/api/v1`, y volver a desplegar el frontend.

## Integración necesaria del Backend

La revisión del código acumulado encontró que `backend/src/admin-portfolio/admin-portfolio.module.ts` no estaba importado en `backend/src/app.module.ts`. Sin ese import, las rutas `/api/v1/admin/portfolio/*` devuelven 404 aunque los controllers y services existan.

Este paquete incluye el archivo corregido en:

`backend-patch/src/app.module.ts`

Copiarlo sobre:

`Portafolio-Backend/backend/src/app.module.ts`

La corrección importa `AdminPortfolioModule`. No modifica el esquema de Supabase.

## Límites funcionales

- La marca `replied` de un mensaje es un estado de seguimiento; el sistema no envía correos automáticamente.
- Los archivos que continúan asociados al perfil o a un proyecto no pueden eliminarse desde la biblioteca.
- Los nuevos proyectos se guardan como borradores y deben publicarse explícitamente.
- La vista pública existente conserva los componentes de diseño. La carga dinámica completa del contenido público desde las rutas `/portfolio/*` queda para una mejora separada; esta parte conecta el panel administrativo y el formulario de contacto.
- No se incluyó gestión de usuarios administradores; esa acción queda reservada al flujo de propietario y no es necesaria para el CRUD de contenido.

## Verificación

La sintaxis JSX/JavaScript y las rutas relativas se verifican en la entrega. El build completo con Vite debe ejecutarse en el repositorio real, con sus dependencias instaladas y las variables configuradas.
