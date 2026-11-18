# Corrección del TypeScript CI — Portafolio Backend

Repositorio: `Jose20224/Portafolio-Backend`  
Rama revisada: `main`  
Commit del job fallido: `28fb76ffc0074f82c846b69601c14303d8cb073c`

## Causa real del fallo

El log del job `Backend CI` confirmó:

- TS1238 y TS1270 en cinco controladores porque `@Header('Cache-Control', 'no-store')` es un decorador de método, pero estaba aplicado a nivel de clase.
- TS2724 porque la versión instalada de `@nestjs/common` no exporta `TooManyRequestsException`.
- TS7006 porque los parámetros `origin` y `callback` de la función CORS estaban sin tipos explícitos.

## Qué corrige el paquete

- Sustituye el decorador `@Header` de clase por `@UseInterceptors(new NoStoreInterceptor())` en los cinco controladores. Se conserva el encabezado `Cache-Control: no-store` en todas las rutas de esas clases.
- Añade `NoStoreInterceptor` sin dependencias adicionales ni cambios de versión de NestJS.
- Sustituye `TooManyRequestsException` por `HttpException` y `HttpStatus.TOO_MANY_REQUESTS` (429).
- Define explícitamente los tipos de `origin` y `callback` según el contrato de CORS.

## Aplicación

Extrae el ZIP. Abre PowerShell en la raíz del repositorio y ejecuta el script por su ruta:

```powershell
node ./apply-fix.mjs
```

O si extrajiste el paquete fuera de la raíz:

```powershell
node "C:\ruta\al\paquete\apply-fix.mjs"
```

El script valida que encuentre una sola coincidencia para cada cambio y se detiene si el código del repositorio no coincide con la versión revisada. Después revisa `git diff`.

## Sobre `npm ci`

La rama consultada no contiene `backend/package-lock.json` (la consulta del archivo devolvió 404). Por eso `npm ci` no puede ejecutarse todavía de forma correcta. El job fallido hizo `npm install --include=dev`, terminó la instalación correctamente y luego falló en `npm run typecheck`.

Primera validación en tu equipo, desde `backend`:

```powershell
npm install --include=dev
npm run typecheck
npm run build
npm test
```

`npm install` generará `backend/package-lock.json`. Revisa que se haya creado y agrégalo al repositorio. A partir del siguiente commit, podrás reemplazar el paso de instalación del workflow por `npm ci`.

No se cambian las versiones existentes de NestJS ni TypeScript.
