const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
export const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, { status, code = null, details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status ?? 0;
    this.code = code;
    this.details = details;
  }
}

async function readResponse(response) {
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiError('El servidor devolvió una respuesta JSON inválida.', {
        status: response.status,
      });
    }
  }

  return text;
}

/**
 * Centralized HTTP client for every public and admin API module.
 * Never put Supabase secret keys or database credentials in this file.
 */
export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    token,
    signal,
    headers = {},
  } = options;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError('No fue posible conectar con el servidor. Comprueba tu conexión.', {
      status: 0,
      code: 'NETWORK_ERROR',
    });
  }

  const payload = await readResponse(response);
  if (!response.ok) {
    const rawMessage = payload?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : typeof rawMessage === 'string'
        ? rawMessage
        : `La solicitud falló (${response.status}).`;

    throw new ApiError(message, {
      status: response.status,
      code: payload?.code ?? null,
      details: payload?.details ?? null,
    });
  }

  return payload;
}

export const apiGet = (path, options = {}) => apiRequest(path, { ...options, method: 'GET' });
export const apiPost = (path, body, options = {}) => apiRequest(path, { ...options, method: 'POST', body });
export const apiPatch = (path, body, options = {}) => apiRequest(path, { ...options, method: 'PATCH', body });
export const apiDelete = (path, options = {}) => apiRequest(path, { ...options, method: 'DELETE' });
