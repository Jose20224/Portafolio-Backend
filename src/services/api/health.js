import { apiGet } from './httpClient.js';

/** Calls GET /api/v1/health and verifies the API + Supabase connection. */
export function getApiHealth(options = {}) {
  return apiGet('/health', options);
}
