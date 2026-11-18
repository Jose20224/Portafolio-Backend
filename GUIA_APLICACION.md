# Guía rápida para aplicar Parte 8

1. Descarga `portafolio-backend-parte-8.zip` y extráelo.
2. Copia el contenido de `backend/` del ZIP sobre `Portafolio-Backend/backend/`, aceptando reemplazar los archivos indicados en `DEPLOY_BACKEND.md`.
3. Copia `render.yaml` a la raíz del repositorio.
4. Copia `.github/workflows/backend-ci.yml` a `Portafolio-Backend/.github/workflows/backend-ci.yml`.
5. En PowerShell:

   ```powershell
   cd Portafolio-Backend\backend
   npm install --include=dev
   npm run typecheck
   npm test
   ```

6. Confirma que se genere `backend/package-lock.json` y agrégalo al commit.
7. Desde la raíz del repositorio:

   ```powershell
   git add backend render.yaml .github/workflows/backend-ci.yml
   git commit -m "feat(backend): finish production readiness"
   git push origin main
   ```

8. En Render configura las cuatro variables secretas/por entorno detalladas en `DEPLOY_BACKEND.md`. El frontend no recibe la clave secret de Supabase.
9. En Vercel define `VITE_API_BASE_URL` con la URL de Render más `/api/v1` y vuelve a desplegar el frontend.

No se modificó automáticamente GitHub: la integración de escritura devolvió `403 Resource not accessible by integration`. Los cambios están preparados en este patch para que se apliquen de forma verificable.
