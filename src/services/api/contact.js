import { apiPost } from './httpClient';

/** Submit a message through the public portfolio contact endpoint. */
export function submitContactMessage(payload, options = {}) {
  return apiPost('/contact/messages', payload, options);
}
