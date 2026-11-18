# Guía para incorporar manualmente la Parte 4

## 1. Descargar y extraer

Descarga `portafolio-backend-parte-4.zip` y extrae el contenido.

## 2. Copiar al repositorio

Copia/combina el contenido de la carpeta extraída en la raíz local de `Portafolio-Backend`.

- Esta entrega ya incluye el código acumulado de las Partes 1, 2 y 3; reemplaza los archivos correspondientes cuando tu repositorio aún esté en la base de Parte 2.
- No reemplaces archivos propios no incluidos en el paquete.
- **No reemplaces ni subas `backend/.env` ni ningún `.env` real.** Solo se incluyen archivos `.env.example`.
- Comprueba que el `.gitignore` de la raíz y `backend/.gitignore` estén presentes.

## 3. Instalar y validar

En PowerShell desde la raíz del repositorio:

```powershell
cd backend
npm install
npm run typecheck
npm run build
npm run start:dev
```

Si el typecheck o build devuelve errores, conserva el log completo; no continúes a producción hasta resolverlos.

## 4. Crear rama y subir

Desde la raíz del repositorio:

```bash
git checkout main
git pull origin main
git checkout -b feature/part-4-admin-crud
git status
git add .
git commit -m "feat: add protected admin portfolio CRUD"
git push -u origin feature/part-4-admin-crud
```

Si ya existe una rama con la Parte 3, puedes integrar estos cambios sobre ella en lugar de crear otra rama. Revisa `git diff` antes del commit y confirma que ningún `.env` real aparezca en `git status`.

## 5. Probar autorización

Inicia sesión con `POST /api/v1/auth/login` y usa el `accessToken` en las rutas administrativas:

```bash
curl http://localhost:3000/api/v1/admin/portfolio/profile \\
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Prueba con un usuario `owner` y uno `editor`. Ambos deben leer y modificar contenido. Una cuenta no registrada o inactiva en `admin_users` debe recibir 403; una solicitud sin token debe recibir 401.

## 6. Rutas base

Todos los endpoints administrativos de contenido están bajo `/api/v1/admin/portfolio`. El detalle de métodos, filtros y cuerpos JSON está en `backend/README.md`.
