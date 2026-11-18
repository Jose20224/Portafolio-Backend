import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = process.cwd();

if (!fs.existsSync(path.join(repositoryRoot, 'backend', 'package.json'))) {
  throw new Error('Ejecuta este script desde la raíz del repositorio Portafolio-Backend.');
}

function replaceExactlyOnce(relativePath, pattern, replacement, description) {
  const filePath = path.join(repositoryRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`No se encontró el archivo esperado: ${relativePath}`);
  }

  const original = fs.readFileSync(filePath, 'utf8');
  const matches = [...original.matchAll(pattern)];
  if (matches.length !== 1) {
    throw new Error(
      `Se esperaba exactamente una coincidencia para "${description}" en ${relativePath}, ` +
      `pero se encontraron ${matches.length}. No se modificó este archivo.`,
    );
  }

  const updated = original.replace(pattern, replacement);
  fs.writeFileSync(filePath, updated, 'utf8');
  console.log(`Corregido: ${relativePath} — ${description}`);
}

function newlineOf(relativePath) {
  const source = fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
  return source.includes('\r\n') ? '\r\n' : '\n';
}

const controllerPaths = [
  'backend/src/admin-portfolio/admin-portfolio.controller.ts',
  'backend/src/auth/auth.controller.ts',
  'backend/src/contact-messages/admin-contact-messages.controller.ts',
  'backend/src/storage/storage.controller.ts',
];

for (const relativePath of controllerPaths) {
  const newline = newlineOf(relativePath);

  replaceExactlyOnce(
    relativePath,
    /^[\t ]*Header,[\t ]*\r?\n/gm,
    '',
    'quitar Header del import',
  );
  replaceExactlyOnce(
    relativePath,
    /^([\t ]*UseGuards,[\t ]*\r?\n)([\t ]*\} from '@nestjs\/common';)/gm,
    (_match, before, after) => `${before}  UseInterceptors,${newline}${after}`,
    'importar UseInterceptors',
  );
  replaceExactlyOnce(
    relativePath,
    /^(import \{ CurrentAdmin \} from '\.\.\/common\/decorators\/current-admin\.decorator\.js';\r?\n)/gm,
    (_match, line) => `${line}import { NoStoreInterceptor } from '../common/interceptors/no-store.interceptor.js';${newline}`,
    'importar NoStoreInterceptor',
  );
  replaceExactlyOnce(
    relativePath,
    /@Header\('Cache-Control', 'no-store'\)/g,
    '@UseInterceptors(new NoStoreInterceptor())',
    'usar interceptor no-store en la clase',
  );
}

// HealthController has no UseGuards import, so add UseInterceptors alongside its Nest imports.
const healthPath = 'backend/src/health/health.controller.ts';
const healthNewline = newlineOf(healthPath);
replaceExactlyOnce(
  healthPath,
  /^[\t ]*Header,[\t ]*\r?\n/gm,
  '',
  'quitar Header del import',
);
replaceExactlyOnce(
  healthPath,
  /^([\t ]*ServiceUnavailableException,[\t ]*\r?\n)([\t ]*\} from '@nestjs\/common';)/gm,
  (_match, before, after) => `${before}  UseInterceptors,${healthNewline}${after}`,
  'importar UseInterceptors',
);
replaceExactlyOnce(
  healthPath,
  /@Header\('Cache-Control', 'no-store'\)/g,
  '@UseInterceptors(new NoStoreInterceptor())',
  'usar interceptor no-store en la clase',
);
replaceExactlyOnce(
  healthPath,
  /^(import \{ SupabaseService \} from '\.\.\/supabase\/supabase\.service\.js';\r?\n)/gm,
  (_match, line) => `${line}import { NoStoreInterceptor } from '../common/interceptors/no-store.interceptor.js';${healthNewline}`,
  'importar NoStoreInterceptor',
);

const rateLimiterPath = 'backend/src/contact-messages/contact-rate-limit.service.ts';
replaceExactlyOnce(
  rateLimiterPath,
  /import \{ Injectable, TooManyRequestsException \} from '@nestjs\/common';/g,
  "import { HttpException, HttpStatus, Injectable } from '@nestjs/common';",
  'usar imports disponibles de NestJS',
);
replaceExactlyOnce(
  rateLimiterPath,
  /throw new TooManyRequestsException\(rule\.message\);/g,
  'throw new HttpException(rule.message, HttpStatus.TOO_MANY_REQUESTS);',
  'usar estado HTTP 429',
);

const mainPath = 'backend/src/main.ts';
const mainNewline = newlineOf(mainPath);
const typedCorsOrigin = [
  'origin: (',
  '      origin: string | undefined,',
  '      callback: (',
  '        error: Error | null,',
  '        allow?: boolean | string | RegExp | (boolean | string | RegExp)[],',
  '      ) => void,',
  '    ): void => {',
].join(mainNewline);
replaceExactlyOnce(
  mainPath,
  /origin: \(origin, callback\) => \{/g,
  typedCorsOrigin,
  'tipar los parámetros de CORS',
);

const sourceInterceptor = path.join(
  packageDirectory,
  'backend',
  'src',
  'common',
  'interceptors',
  'no-store.interceptor.ts',
);
const destinationInterceptor = path.join(
  repositoryRoot,
  'backend',
  'src',
  'common',
  'interceptors',
  'no-store.interceptor.ts',
);
if (!fs.existsSync(sourceInterceptor)) {
  throw new Error('No se encontró el interceptor incluido en el paquete.');
}
fs.mkdirSync(path.dirname(destinationInterceptor), { recursive: true });
fs.copyFileSync(sourceInterceptor, destinationInterceptor);
console.log('Copiado: backend/src/common/interceptors/no-store.interceptor.ts');

console.log('\nParche aplicado. Revisa los cambios con: git diff');
console.log('Después ejecuta los comandos de validación incluidos en README.md.');
