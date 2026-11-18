import { apiGet, apiPatch } from './httpClient';

function queryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

/** List contact messages. Pass { token, signal } in options. */
export function getContactMessages(params = {}, options = {}) {
  return apiGet(`/admin/contact-messages${queryString(params)}`, options);
}

/** Aggregate counts for the admin contact inbox. */
export function getContactMessageStats(options = {}) {
  return apiGet('/admin/contact-messages/stats', options);
}

/** Read one message by UUID. */
export function getContactMessage(id, options = {}) {
  return apiGet(`/admin/contact-messages/${encodeURIComponent(id)}`, options);
}

/** Change status to new, read, replied or archived. */
export function updateContactMessageStatus(id, status, options = {}) {
  return apiPatch(
    `/admin/contact-messages/${encodeURIComponent(id)}/status`,
    { status },
    options,
  );
}
