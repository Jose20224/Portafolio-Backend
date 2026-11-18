# Guía de integración manual — Parte 7

Esta entrega se aplica principalmente al repositorio **Jose20224/Portafolio-Frontend**. También incluye una corrección pequeña y necesaria para **Jose20224/Portafolio-Backend**.

## A. Aplicar al repositorio Portafolio-Frontend

1. Descarga y descomprime `portafolio-frontend-parte-7.zip`.
2. Abre tu repositorio local `Portafolio-Frontend`.
3. Copia el contenido de la carpeta `src/` del ZIP dentro de la carpeta `src/` de tu repositorio. Cuando Windows pregunte, combina las carpetas y reemplaza los archivos existentes.
4. No reemplaces `package.json`, `package-lock.json`, `src/main.jsx`, `src/index.css`, `vite.config.js` ni tus componentes públicos, excepto `src/App.jsx` y `src/components/Contact.jsx`, que sí vienen actualizados.
5. Copia `.env.example` a `.env.local`.

En PowerShell, desde la raíz del frontend:

```powershell
Copy-Item .env.example .env.local
```

Asegúrate de que `.env.local` contenga:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Si ya existe `.env.local`, agrega o actualiza esa variable sin borrar las demás.

6. Instala dependencias si aún no están instaladas y ejecuta:

```powershell
npm install
npm run dev
```

7. Abre:

- Sitio público: `http://localhost:5173/`
- Panel: `http://localhost:5173/admin/login`

No se crean usuarios desde el panel. Inicia sesión con la cuenta que ya autorizaste en Supabase Auth y `public.admin_users`.

## B. Corrección necesaria en Portafolio-Backend

El paquete de las partes anteriores contiene el módulo de CRUD, pero `AppModule` no lo estaba registrando. Sin esta corrección, el frontend no puede consultar ni modificar perfil, redes, habilidades, categorías ni proyectos.

1. Abre el repositorio local `Portafolio-Backend`.
2. En el ZIP, toma `backend-patch/src/app.module.ts`.
3. Reemplaza `backend/src/app.module.ts` en el repositorio Backend con ese archivo.
4. Verifica que la carpeta `backend/src/admin-portfolio/` contenga el módulo, controller, service y DTOs de la Parte 4.
5. Ejecuta desde `backend/`:

```powershell
npm run build
npm run start:dev
```

Si el backend ya se encuentra desplegado, vuelve a desplegarlo después de aplicar esta corrección.

## C. Configuración de producción

En el proyecto Vercel del frontend, añade la variable de entorno:

```env
VITE_API_BASE_URL=https://TU-DOMINIO-REAL-DEL-BACKEND/api/v1
```

En el backend, `FRONTEND_ORIGINS` debe contener el dominio del frontend desplegado, por ejemplo:

```env
FRONTEND_ORIGINS=https://portafolio-frontend-alpha.vercel.app
```

Mantén la clave secreta de Supabase únicamente en `Portafolio-Backend/backend/.env`. Nunca agregues claves de Supabase a variables `VITE_`.

## D. Comprobación funcional recomendada

1. Abre `/admin/login` e inicia sesión con una cuenta activa.
2. Comprueba que `/admin` muestre el resumen.
3. Actualiza un campo del perfil y guarda.
4. Crea una categoría, una habilidad y un enlace social.
5. Crea un proyecto, agrega una tecnología y un aspecto destacado, y verifica que inicialmente quede como borrador.
6. Publica el proyecto y luego retíralo de publicación.
7. Abre la biblioteca, sube una imagen válida y copia su ruta a un campo de imagen del perfil o proyecto.
8. Envía un mensaje desde el formulario público y comprueba que aparezca en `/admin/mensajes`.
9. Cambia el mensaje a «Leído» y luego «Archivado».
10. Comprueba que un visitante sin sesión no pueda abrir rutas administrativas.

## E. Subida a GitHub

Frontend:

```powershell
cd ruta\a\Portafolio-Frontend
git status
git add src .env.example
git commit -m "feat(frontend): integrate portfolio admin panel"
git push origin main
```

Backend:

```powershell
cd ruta\a\Portafolio-Backend
git status
git add backend/src/app.module.ts
git commit -m "fix(backend): register admin portfolio module"
git push origin main
```

Revisa `git status` antes del commit y confirma que `.env.local` no aparezca entre los archivos preparados.
