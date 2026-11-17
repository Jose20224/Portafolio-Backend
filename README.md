# Portafolio — Parte 2: autenticación y autorización

Esta entrega amplía la Parte 1. Incluye el backend completo de la Parte 1 más la autenticación administrativa basada en Supabase Auth, guards de JWT/roles y el servicio de sesión para React.

## Requisitos

- Haber incorporado la Parte 1.
- Node.js 22.12 o superior y npm 10 o superior.
- Proyecto Supabase `PortaFolio_BD` con el esquema inicial ya aplicado.
- Una cuenta creada en Supabase Auth y autorizada en `public.admin_users` con rol `owner` o `editor`.

## 1. Aplicar los archivos

Descomprime este paquete y copia las carpetas `backend/` y `src/services/api/` sobre las mismas carpetas del repositorio. Este paquete contiene los archivos de la Parte 1 y Parte 2; conserva el resto de tu frontend.

No reemplaces `src/App.jsx`, los componentes visuales ni otros archivos del frontend.

## 2. Configurar el backend

En `backend/`, copia `.env.example` a `.env` y configura:

```env
SUPABASE_URL=https://dhklhaklgrlbgvfmnnjf.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_TU_CLAVE
SUPABASE_SECRET_KEY=sb_secret_TU_CLAVE
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://portafolio-frontend-alpha.vercel.app
PORT=3000
NODE_ENV=development
```

La clave `sb_secret_...` se guarda únicamente en `backend/.env`. No la agregues a ninguna variable `VITE_`.

## 3. Instalar y ejecutar

```powershell
cd backend
npm install
npm run start:dev
```

## 4. Crear el primer administrador

1. Abre Supabase Dashboard → Authentication → Users.
2. Crea manualmente el usuario con tu correo y una contraseña segura. No habilites registro público para este panel.
3. Copia el UUID del usuario creado.
4. En Supabase SQL Editor ejecuta el siguiente SQL, sustituyendo el UUID por el real:

```sql
insert into public.admin_users (user_id, role, display_name, is_active)
values ('UUID_REAL_DEL_USUARIO', 'owner', 'Propietario', true)
on conflict (user_id) do update
set role = 'owner', is_active = true;
```

No compartas contraseñas ni claves privadas en el repositorio.

## 5. Endpoints implementados

| Método | Ruta | Acceso | Uso |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Público | Iniciar sesión de administrador |
| POST | `/api/v1/auth/refresh` | Público con refresh token | Renovar sesión |
| GET | `/api/v1/auth/me` | Administrador | Obtener usuario/rol actual |
| POST | `/api/v1/auth/logout` | Administrador | Revocar sesión actual |
| GET | `/api/v1/admin/session` | Administrador | Obtener perfil y permisos |
| GET | `/api/v1/admin/owner-check` | Solo owner | Comprobar autorización de propietario |

### Probar con curl

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu-correo@example.com","password":"TU_PASSWORD"}'
```

Copia `accessToken` de la respuesta:

```bash
curl http://localhost:3000/api/v1/admin/session \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"
```

Una cuenta `editor` debe recibir HTTP 403 en `/api/v1/admin/owner-check`; una cuenta `owner` debe recibir HTTP 200.

## 6. Integración desde React

Se agregó `src/services/api/auth.js`. Ejemplo para un formulario de login:

```js
import { loginAdmin } from '../services/api/auth';

async function handleLogin(email, password) {
  const admin = await loginAdmin({ email, password });
  console.log('Sesión iniciada:', admin.role);
}
```

Restaurar una sesión al cargar el panel:

```js
import { getAdminSession } from '../services/api/auth';

const session = await getAdminSession();
if (!session) {
  // Navegar a /admin/login
}
```

Cerrar sesión:

```js
import { logoutAdmin } from '../services/api/auth';
await logoutAdmin();
```

El access token se conserva en memoria del módulo y el refresh token en `sessionStorage` de la pestaña actual. No se guardan contraseñas ni claves administrativas en el navegador. En la siguiente parte se integrará este servicio con un contexto React y rutas protegidas.

## 7. Seguridad y límites de esta entrega

- El backend valida los access tokens solicitando a Supabase Auth `getUser(jwt)`; no decodifica tokens sin verificar su firma.
- El rol no se toma de `user_metadata` ni de los datos enviados por el navegador. Se consulta `admin_users` en cada solicitud protegida.
- Las cuentas inexistentes, inactivas o con roles inválidos no pueden acceder.
- `owner` puede acceder a la ruta de comprobación exclusiva; `editor` no.
- El frontend usa el origen Vercel indicado para CORS, además de localhost. CORS no es un control de autorización: los guards siguen siendo obligatorios.
- El endpoint de logout revoca el refresh token de la sesión actual. Un access token JWT ya emitido puede seguir siendo válido hasta su expiración; Supabase documenta esta limitación. El backend también vuelve a comprobar el estado/rol del administrador en cada operación protegida.
- Los intentos de login también deben estar sujetos a los límites de Auth configurados en Supabase. El endurecimiento con CAPTCHA/limitación adicional de API se añadirá antes de producción.

## 8. Próxima parte

La Parte 3 implementará endpoints públicos para perfil, redes, habilidades, categorías y proyectos. Después añadiremos CRUD administrativo de proyectos y la conexión de las pantallas existentes de React.
