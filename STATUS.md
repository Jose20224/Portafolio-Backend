# Estado del desarrollo — Portafolio

## Completado / preparado en el código
- [x] Parte 1: estructura NestJS, configuración, cliente Supabase de backend, health check y cliente HTTP frontend.
- [x] Parte 2: login administrativo Supabase Auth, refresh, logout, guards JWT/roles y sesión.
- [x] Parte 3: API pública de perfil, redes, habilidades, categorías, listado y detalle de proyectos.
- [x] Parte 4: CRUD administrativo para perfil, redes, habilidades, categorías y proyectos.
- [x] Parte 4: CRUD individual de tecnologías, aspectos destacados y colaboradores.
- [x] Parte 4: publicación/retiro explícito de proyectos y registro de actividad.
- [x] `.gitignore` de raíz y de backend.

## Validaciones realizadas / pendientes
- [x] El código se contrastó con las columnas, constraints y relaciones actuales del esquema Supabase conectado.
- [x] Se confirmó la restricción que impide borrar categorías en uso y la cascada al borrar proyectos.
- [ ] Instalar dependencias y validar `npm run typecheck` / `npm run build` con las versiones fijadas del proyecto.
- [ ] Ejecutar pruebas de integración autenticadas contra Supabase con cuentas reales `owner` y `editor`.
- [ ] Verificar el registro de auditoría y configurar alertas de errores de auditoría.
- [ ] Crear el primer usuario Auth y asignarlo como `owner` en `admin_users` si aún no existe.
- [ ] Desplegar backend y configurar variables de entorno seguras.
- [ ] Configurar `VITE_API_BASE_URL` en Vercel y comprobar CORS de producción.

## Pendiente por partes
- [ ] Parte 5: mensajes de contacto (envío público, gestión administrativa, validación anti-spam y rate limit).
- [ ] Parte 6: carga/gestión de imágenes en Supabase Storage, signed URLs y validación de archivos.
- [ ] Parte 7: conectar las pantallas de login y panel administrativo del frontend React.
- [ ] Parte 8: seguridad final, pruebas automatizadas, monitorización, rate limiting y despliegue.

## Notas importantes
- El CRUD administrativo requiere bearer token de un administrador activo. `owner` y `editor` pueden gestionar contenido; la gestión de cuentas administrativas seguirá siendo exclusiva del `owner` y se implementará en una parte posterior.
- Una categoría asociada a proyectos no se elimina; se debe reasignar o retirar la categoría primero.
- Los registros de auditoría se insertan después de la operación principal. Si esa inserción falla, la mutación del contenido permanece y el backend registra el error; no se presenta como transacción atómica.
- Los campos de imagen solo guardan rutas en esta parte; la gestión de archivos va en Parte 6.

## Estado de GitHub
- La rama principal remota todavía muestra la base de Parte 2 en la última lectura de `README.md`.
- No afirmes ni asumas que esta entrega está subida hasta que una operación de escritura/commit y su verificación en GitHub hayan finalizado correctamente.
