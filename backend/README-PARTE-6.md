# Parte 6 — Supabase Storage: imágenes del portafolio

Esta entrega acumula las Partes 1–5 e incorpora una API administrativa para cargar, listar, verificar y eliminar imágenes del bucket `portfolio-media`.

## Estado del bucket verificado

El proyecto Supabase ya tiene el bucket `portfolio-media` configurado como público, con límite de 8 MiB por archivo y estos MIME permitidos: `image/jpeg`, `image/png`, `image/webp`, `image/avif` e `image/gif`. Las políticas existentes restringen INSERT/UPDATE/DELETE/SELECT a administradores `owner` y `editor` en las carpetas `profile`, `projects` y `collaborators`.

No se requiere migración SQL ni cambio de políticas para esta parte. La API NestJS usa su cliente de servidor con `SUPABASE_SECRET_KEY`; nunca se envía esta clave al navegador. La creación de URLs firmadas está detrás de los guards de administrador.

## Rutas administrativas

Todas requieren `Authorization: Bearer <access_token>` y rol `owner` o `editor`.

| Método | Ruta | Uso |
|---|---|---|
| POST | `/api/v1/admin/storage/upload-url` | Solicitar URL de carga firmada |
| POST | `/api/v1/admin/storage/confirm-upload` | Confirmar archivo y verificar firma binaria |
| GET | `/api/v1/admin/storage/objects?folder=projects&limit=50&offset=0` | Listar imágenes de una carpeta |
| DELETE | `/api/v1/admin/storage/objects` | Eliminar imagen no referenciada |

### Solicitar URL firmada

```json
{
  "area": "projects",
  "fileName": "captura-del-proyecto.png",
  "contentType": "image/png",
  "size": 348120
}
```

`area` acepta `profile`, `projects` o `collaborators`. `contentType` acepta únicamente los cinco MIME admitidos por el bucket. `size` debe estar entre 1 byte y 8 MiB. El servidor genera el nombre y UUID de ruta; el navegador no puede elegir una ruta arbitraria. La URL y su token expiran en dos horas y solo se permite cargar una vez en esa ruta.

Respuesta (campos principales): `bucket`, `path`, `token`, `signedUrl`, `publicUrl`, `contentType`, `maxFileSize`, `expiresInSeconds` y `cacheControl`.

### Subir y confirmar

1. El frontend pide `/upload-url` con el nombre, MIME y tamaño del `File`.
2. Sube los bytes mediante `PUT` directamente al `signedUrl`, con el encabezado `Content-Type` coincidente y el archivo como cuerpo.
3. Llama a `/confirm-upload` enviando `{ "path": "projects/...png" }`.
4. El backend descarga el objeto para comprobar el tamaño y la firma real JPEG/PNG/WebP/AVIF/GIF. Si los bytes no corresponden a la extensión generada, intenta eliminar el objeto y devuelve HTTP 400.
5. La respuesta de confirmación contiene `path` y `publicUrl`. La API pública del portafolio ahora también devuelve `hero_image_url` en el perfil, `card_image_url` y `cover_image_url` en cada proyecto, y `avatar_url` en cada colaborador. Guarda únicamente `path` en `hero_image_path`, `card_image_path`, `cover_image_path` o `avatar_path`, según corresponda.

La validación del servidor se realiza después de que Storage haya recibido el archivo; mientras no se confirme, no se debe guardar su ruta en el perfil/proyecto. Los límites de tamaño y MIME también los impone el propio bucket.

### Listado y eliminación

`GET /objects` admite `folder`, `limit` (1–100) y `offset`. Devuelve nombre, ruta, tamaño, MIME, fechas y URL pública.

`DELETE /objects` recibe `{ "path": "projects/...png" }`. Solo acepta rutas de las carpetas administradas y no permite traversal ni rutas externas. Antes de borrar comprueba las referencias en `portfolio_profile.hero_image_path`, `projects.card_image_path`, `projects.cover_image_path` y `project_collaborators.avatar_path`. Si está en uso responde HTTP 409; reemplaza primero la referencia desde el CRUD correspondiente. Los archivos eliminados y cargados se registran en `admin_activity_logs`.

## Integración React

Se agregó `src/services/api/storage.js` y se exporta desde `src/services/api/index.js`.

```js
import { uploadPortfolioImage } from './services/api/storage';

const uploaded = await uploadPortfolioImage(file, {
  area: 'projects',
  token: accessToken,
});

// Guardar uploaded.path en la propiedad de imagen del proyecto.
// uploaded.publicUrl se puede usar para previsualizar inmediatamente.
```

También están disponibles `createPortfolioUploadUrl`, `confirmPortfolioUpload`, `getPortfolioMedia` y `deletePortfolioMedia`. `uploadPortfolioImage` realiza el flujo de carga + confirmación, sin necesitar `@supabase/supabase-js` en el frontend.

## Notas de seguridad y operación

- El bucket es público: cualquier persona que conozca una URL pública puede ver la imagen. No guardar documentos privados ni información sensible aquí.
- Solo el backend entrega tokens firmados; la clave `SUPABASE_SECRET_KEY` permanece en el backend.
- Cada carga usa un UUID nuevo, sin sobrescribir ficheros ya publicados. Esto reduce problemas de caché CDN.
- El backend valida la firma binaria del archivo durante confirmación, además del tamaño y MIME informado.
- No se elimina una imagen enlazada desde el contenido del portafolio.
- Si se pierde la respuesta del paso de confirmación, el archivo puede quedar cargado sin referencia. El listado permite encontrarlo; se puede eliminar cuando se confirme que no está enlazado.
- La comprobación de firma carga temporalmente el objeto completo en memoria. El bucket limita los archivos a 8 MiB, por lo que el consumo está acotado.

## Comandos locales

```powershell
cd backend
npm install
npm run typecheck
npm run build
npm run start:dev
```

La prueba completa de carga debe hacerse desde un administrador real en un entorno de desarrollo; no se suben imágenes de prueba a producción durante la preparación del paquete.
