import { apiDelete, apiGet, apiPost, ApiError } from './httpClient';

const STORAGE_ROOT = '/admin/storage';

/** Ask the backend for a short-lived, one-time upload capability. */
export function createPortfolioUploadUrl(
  { area, fileName, contentType, size },
  options = {},
) {
  return apiPost(
    `${STORAGE_ROOT}/upload-url`,
    { area, fileName, contentType, size },
    options,
  );
}

/** Confirm the object exists and its byte signature matches an allowed image format. */
export function confirmPortfolioUpload(path, options = {}) {
  return apiPost(`${STORAGE_ROOT}/confirm-upload`, { path }, options);
}

/** List stored assets within one of the managed folders. */
export function getPortfolioMedia(params = {}, options = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const suffix = search.toString();
  return apiGet(`${STORAGE_ROOT}/objects${suffix ? `?${suffix}` : ''}`, options);
}

/** Delete an asset only when it is not referenced by the profile/projects. */
export function deletePortfolioMedia(path, options = {}) {
  return apiDelete(`${STORAGE_ROOT}/objects`, { ...options, body: { path } });
}

/**
 * Complete upload flow for a browser File. The raw bytes go directly to the
 * signed Supabase Storage URL; the secret key never reaches the browser.
 */
export async function uploadPortfolioImage(
  file,
  { area = 'projects', token, signal } = {},
) {
  if (!file || typeof file.size !== 'number' || typeof file.type !== 'string') {
    throw new TypeError('Debes seleccionar un archivo de imagen válido.');
  }

  const signed = await createPortfolioUploadUrl(
    {
      area,
      fileName: file.name || 'imagen',
      contentType: file.type,
      size: file.size,
    },
    { token, signal },
  );

  let response;
  try {
    response = await fetch(signed.signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'Cache-Control': `max-age=${signed.cacheControl || '3600'}`,
      },
      body: file,
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError('No fue posible cargar la imagen en Supabase Storage.', {
      status: 0,
      code: 'STORAGE_UPLOAD_NETWORK_ERROR',
    });
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new ApiError('Supabase Storage rechazó la carga de la imagen.', {
      status: response.status,
      code: 'STORAGE_UPLOAD_FAILED',
      details: errorText.slice(0, 500) || null,
    });
  }

  return confirmPortfolioUpload(signed.path, { token, signal });
}
