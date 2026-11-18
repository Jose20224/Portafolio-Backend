# Guía para incorporar la Parte 6 al repositorio

Esta entrega contiene las Partes 1–6. Si ya incorporaste la Parte 5, puedes copiar únicamente las adiciones de esta parte, conservando tus cambios locales. Si no has incorporado las anteriores, usa este paquete completo como base.

## 1. Copiar archivos

Desde el ZIP copia sobre el repositorio:

- `backend/src/storage/` (carpeta nueva)
- `backend/src/app.module.ts` (actualizado para importar `StorageModule`)
- `src/services/api/storage.js` (servicio frontend nuevo)
- `src/services/api/index.js` (agrega la exportación del servicio)
- `backend/README-PARTE-6.md`, `README.md`, `STATUS.md` y esta guía.

No reemplaces componentes visuales de React; esta parte agrega servicios y endpoints, no pantallas.

## 2. Configuración

No se requieren nuevas variables de entorno. Verifica que `backend/.env` ya contenga:

```env
SUPABASE_URL=https://dhklhaklgrlbgvfmnnjf.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_TU_CLAVE
SUPABASE_SECRET_KEY=sb_secret_TU_CLAVE
```

No copies `SUPABASE_SECRET_KEY` al frontend.

## 3. Comprobar bucket en Supabase

El bucket esperado es `portfolio-media`, público, límite 8 MiB, con MIME JPEG/PNG/WebP/AVIF/GIF y políticas para `profile`, `projects` y `collaborators`. La configuración actual fue consultada y coincide. No hay que ejecutar SQL adicional para esta parte.

## 4. Instalar y validar

```powershell
cd backend
npm install
npm run typecheck
npm run build
npm run start:dev
```

## 5. Probar con un usuario administrador

1. Inicia sesión usando el flujo existente y conserva `accessToken` en memoria.
2. Desde React llama a `uploadPortfolioImage(file, { area: 'projects', token: accessToken })`.
3. La función pide URL firmada al backend, carga el archivo directamente a Storage y solicita confirmación al backend.
4. Guarda `uploaded.path` en `card_image_path` o `cover_image_path` del proyecto mediante el CRUD de la Parte 4.
5. Usa `uploaded.publicUrl` para previsualizar el archivo.
6. Antes de borrar un archivo, elimina o reemplaza su referencia en el contenido. El backend responde HTTP 409 si sigue en uso.

Ejemplo:

```js
import { uploadPortfolioImage } from './services/api/storage';

const uploaded = await uploadPortfolioImage(file, {
  area: 'projects',
  token: accessToken,
});

const projectPayload = {
  card_image_path: uploaded.path,
};
// Envía projectPayload mediante PATCH /api/v1/admin/portfolio/projects/:id.
```

## 6. Git

Desde la raíz del repositorio:

```powershell
git status
git switch -c feature/part-6-storage
git add backend/src/storage backend/src/app.module.ts src/services/api/storage.js src/services/api/index.js backend/README-PARTE-6.md README.md STATUS.md GUIA_SUBIDA_MANUAL.md
git commit -m "feat(storage): add secure portfolio image uploads"
git push -u origin feature/part-6-storage
```

Abre un Pull Request hacia `main` cuando compile y las pruebas manuales hayan pasado.
