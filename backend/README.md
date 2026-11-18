# Portafolio API — Parte 4: CRUD administrativo

Esta entrega acumula las Partes 1–3 e incorpora el CRUD protegido para el contenido del portafolio. La Parte 4 reutiliza los guards de Supabase Auth y la consulta del rol `owner`/`editor` en `admin_users`.

## Requisitos

- Node.js 22.12 o superior.
- Proyecto Supabase `PortaFolio_BD` con el esquema inicial descrito en la documentación del proyecto.
- Variables configuradas según `.env.example`.
- Al menos un usuario Supabase Auth habilitado en `public.admin_users`.

## Ejecución

```powershell
cd backend
npm install
npm run typecheck
npm run build
npm run start:dev
```

La API usa `/api/v1` como prefijo global.

## Autorización

Todas las rutas de `/api/v1/admin/portfolio` exigen `Authorization: Bearer <access_token>`.

- `owner`: lectura y escritura del contenido.
- `editor`: lectura y escritura del contenido.
- Usuario no autenticado, desactivado o no registrado en `admin_users`: acceso denegado.

El rol se obtiene desde `public.admin_users` en el backend. No se toma del navegador ni de `user_metadata`.

## Endpoints del CRUD

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/v1/admin/portfolio/profile` | Leer perfil completo para administración |
| PATCH | `/api/v1/admin/portfolio/profile` | Actualizar perfil |
| GET | `/api/v1/admin/portfolio/social-links` | Listar enlaces sociales |
| POST | `/api/v1/admin/portfolio/social-links` | Crear enlace social |
| PATCH | `/api/v1/admin/portfolio/social-links/:id` | Actualizar enlace |
| DELETE | `/api/v1/admin/portfolio/social-links/:id` | Eliminar enlace |
| GET | `/api/v1/admin/portfolio/skills` | Listar habilidades |
| POST | `/api/v1/admin/portfolio/skills` | Crear habilidad |
| PATCH | `/api/v1/admin/portfolio/skills/:id` | Actualizar habilidad |
| DELETE | `/api/v1/admin/portfolio/skills/:id` | Eliminar habilidad |
| GET | `/api/v1/admin/portfolio/categories` | Listar categorías activas e inactivas |
| POST | `/api/v1/admin/portfolio/categories` | Crear categoría |
| PATCH | `/api/v1/admin/portfolio/categories/:id` | Actualizar categoría |
| DELETE | `/api/v1/admin/portfolio/categories/:id` | Eliminar categoría sin proyectos vinculados |
| GET | `/api/v1/admin/portfolio/projects?page=1&limit=20` | Listar todos los proyectos, publicados o no |
| POST | `/api/v1/admin/portfolio/projects` | Crear proyecto como borrador |
| GET | `/api/v1/admin/portfolio/projects/:id` | Consultar proyecto por UUID con relaciones |
| PATCH | `/api/v1/admin/portfolio/projects/:id` | Actualizar datos del proyecto |
| DELETE | `/api/v1/admin/portfolio/projects/:id` | Eliminar proyecto y sus relaciones en cascada |
| POST | `/api/v1/admin/portfolio/projects/:id/publish` | Publicar proyecto |
| POST | `/api/v1/admin/portfolio/projects/:id/unpublish` | Retirar proyecto de publicación |

### Filtros de proyectos

`GET /api/v1/admin/portfolio/projects` acepta `page`, `limit` (máximo 100), `status` (`in_progress`, `completed`, `archived`), `category_id` (UUID), `is_published` y `is_featured` (`true`/`false`). Devuelve `items` y `pagination`.

### Relaciones del proyecto

Cada grupo tiene su propio CRUD para evitar actualizar varias tablas con una secuencia REST que no sería transaccional:

| Relación | Rutas |
|---|---|
| Tecnologías | `/api/v1/admin/portfolio/projects/:projectId/technologies` |
| Aspectos destacados | `/api/v1/admin/portfolio/projects/:projectId/highlights` |
| Colaboradores | `/api/v1/admin/portfolio/projects/:projectId/collaborators` |

En las tres rutas se usan `GET` y `POST` sobre la colección; `PATCH` y `DELETE` usan además `/:childId`.

## Ejemplos

Crear una categoría:

```json
{
  "name": "Desarrollo web",
  "slug": "desarrollo-web",
  "label": "Web",
  "description": "Aplicaciones y sitios web",
  "sort_order": 1,
  "is_active": true
}
```

Crear un proyecto (se crea sin publicar):

```json
{
  "category_id": "UUID_DE_CATEGORIA",
  "slug": "mi-proyecto",
  "title": "Mi proyecto",
  "short_description": "Descripción breve",
  "full_description": "Descripción completa del proyecto",
  "status": "completed",
  "is_featured": false,
  "sort_order": 1
}
```

Agregar una habilidad técnica:

```json
{
  "group_type": "technical",
  "name": "TypeScript",
  "level": 80,
  "sort_order": 1,
  "is_visible": true
}
```

Las habilidades de grupo `tools` e `interests` deben tener `level: null`; las habilidades `technical` necesitan un nivel entero de 0 a 100.

## Reglas de integridad y auditoría

- Los identificadores UUID se validan en las rutas antes de consultar la base de datos.
- Los slugs se validan como minúsculas, números y guiones, de acuerdo con las restricciones SQL.
- Un proyecto nuevo o reasignado debe utilizar una categoría activa.
- No se puede eliminar una categoría que tenga proyectos asociados; la API responde HTTP 409.
- Al eliminar un proyecto, Postgres elimina en cascada sus tecnologías, destacados y colaboradores (restricciones confirmadas en el esquema actual).
- Los cambios crean entradas en `admin_activity_logs`, sin guardar contraseñas, tokens ni contenido completo del proyecto.
- Si el insert de auditoría falla después de una modificación, la modificación no se revierte porque son operaciones REST separadas; el error queda en el log del servidor. La Parte 8 debe agregar monitorización/alertas de auditoría o mover las mutaciones críticas a RPC transaccionales.
- Los errores comunes de duplicado y relaciones se traducen a HTTP 409; datos que incumplen checks/not-null se traducen a HTTP 400.

## Seguridad

El cliente con `SUPABASE_SECRET_KEY` se utiliza exclusivamente en el proceso NestJS. No se agrega al frontend ni a variables `VITE_`. El frontend debe consumir los endpoints del backend con el access token recibido en login.

La API aplica validación global con `whitelist`, `forbidNonWhitelisted` y `transform`. No agregues propiedades nuevas a los DTO sin validarlas explícitamente.

## Límites de esta parte

Esta parte no implementa carga de imágenes/archivos; los campos `*_image_path` y `avatar_path` almacenan rutas/referencias que se gestionarán en la Parte 6. Tampoco implementa mensajes de contacto, gestión de administradores ni la conexión de las pantallas React; quedan para las partes siguientes.


---

# Parte 5: mensajes de contacto

La Parte 5 utiliza la tabla existente `public.contact_messages`; no requiere una migración. Sus estados existentes son `new`, `read`, `replied` y `archived`.

## Formulario público

| Método | Ruta | Acceso | Uso |
|---|---|---|---|
| POST | `/api/v1/contact/messages` | Público | Recibir un mensaje de contacto (HTTP 202) |

Cuerpo de ejemplo:

```json
{
  "name": "Nombre de prueba",
  "email": "prueba@example.com",
  "subject": "Consulta",
  "message": "Mensaje de prueba con al menos diez caracteres.",
  "website": "",
  "formStartedAt": 1795000000000
}
```

- `name`: 2–100 caracteres después de recortar espacios.
- `email`: correo válido, máximo 254 caracteres; se guarda en minúsculas.
- `subject`: opcional, máximo 150 caracteres.
- `message`: 10–5000 caracteres.
- `website`: honeypot oculto; debe permanecer vacío.
- `formStartedAt`: timestamp Unix en milisegundos (`Date.now()`) capturado al abrir/inicializar el formulario.

El servidor valida los campos, normaliza texto y crea el registro con el estado por defecto `new`. Un campo honeypot rellenado o un envío en menos de 1.8 segundos recibe la misma respuesta genérica que un envío válido, pero no se guarda. Se limita a 5 mensajes por IP/hora y 3 por correo/hora. Al exceder el límite, responde HTTP 429.

El rate limit se mantiene en memoria del proceso y usa huellas SHA-256 para las claves de IP/correo. No persiste esos datos, no comparte estado entre varias réplicas y se reinicia cuando el proceso se reinicia; para producción con varias instancias debe usarse un almacén distribuido como Redis o un limitador del gateway. Honeypot + tiempo + rate limit no sustituyen CAPTCHA/Turnstile ante ataques más sofisticados.

## Bandeja administrativa

Todas las rutas requieren `Authorization: Bearer <access_token>` y rol `owner` o `editor`.

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/v1/admin/contact-messages` | Listar mensajes con filtros y paginación |
| GET | `/api/v1/admin/contact-messages/stats` | Conteos total y por estado |
| GET | `/api/v1/admin/contact-messages/:id` | Consultar detalle por UUID |
| PATCH | `/api/v1/admin/contact-messages/:id/status` | Cambiar estado del mensaje |

Filtros del listado: `page` (mínimo 1), `limit` (1–50), `status` y `q` (busca en nombre, correo y asunto). Ejemplo: `?status=new&page=1&limit=20&q=consulta`.

Cuerpo para actualizar estado:

```json
{ "status": "read" }
```

La transición registra una entrada en `admin_activity_logs` con acción `status_change`. No se expone un endpoint para borrar mensajes. El estado `replied` indica que el administrador marcó la conversación como respondida; **no envía correo electrónico**.

## Integración React

Se agregaron estos módulos al cliente API:

```js
import { submitContactMessage } from './services/api/contact';
import {
  getContactMessages,
  getContactMessageStats,
  getContactMessage,
  updateContactMessageStatus,
} from './services/api/adminContactMessages';
```

El envío público no requiere token. Las funciones administrativas reciben `options` con `{ token, signal }` igual que el resto del cliente HTTP.

## IP y proxy confiable

`TRUST_PROXY_HOPS` controla la cantidad de proxies confiables que Express debe considerar al resolver `request.ip`. Por seguridad, el valor por defecto es `0`. Configura el número exacto de proxies confiables solo después de confirmar la arquitectura de red; un valor incorrecto puede permitir manipular la IP o agrupar a todos los visitantes detrás de un mismo proxy.
