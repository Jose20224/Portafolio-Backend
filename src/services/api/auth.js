import { apiGet, apiPost } from './httpClient';

const REFRESH_TOKEN_KEY = 'portafolio.admin.refresh.v1';

// Access tokens remain in module memory. Only the rotating refresh token is
// kept in sessionStorage, so it is scoped to the current browser tab.
let accessToken = null;
let currentAdmin = null;
let refreshInFlight = null;

function getStoredRefreshToken() {
  try {
    return window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeRefreshToken(refreshToken) {
  try {
    if (refreshToken) {
      window.sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {
    throw new Error('El navegador no permite guardar la sesión de administración.');
  }
}

function notifySessionChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('portfolio-auth-change', {
      detail: { user: currentAdmin },
    }));
  }
}

function saveSession(session) {
  if (!session?.accessToken || !session?.refreshToken || !session?.user) {
    throw new Error('El servidor devolvió una sesión incompleta.');
  }

  storeRefreshToken(session.refreshToken);
  accessToken = session.accessToken;
  currentAdmin = session.user;
  notifySessionChanged();
  return currentAdmin;
}

export function clearAdminSession() {
  accessToken = null;
  currentAdmin = null;
  try {
    window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Keep the in-memory session cleared even when browser storage is blocked.
  }
  notifySessionChanged();
}

export function getAccessToken() {
  return accessToken;
}

export function getCachedAdmin() {
  return currentAdmin;
}

export async function loginAdmin({ email, password }) {
  const session = await apiPost('/auth/login', { email, password });
  return saveSession(session);
}

export async function refreshAdminSession() {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    clearAdminSession();
    return null;
  }

  refreshInFlight = (async () => {
    try {
      const session = await apiPost('/auth/refresh', { refreshToken });
      return saveSession(session);
    } catch (error) {
      if (error?.status === 0 || error?.status >= 500) throw error;
      clearAdminSession();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function getAdminProfile() {
  if (!accessToken) {
    const restored = await refreshAdminSession();
    if (!restored) return null;
  }

  const response = await apiGet('/auth/me', { token: accessToken });
  currentAdmin = response.user;
  notifySessionChanged();
  return currentAdmin;
}

export async function getAdminSession() {
  if (!accessToken) {
    const restored = await refreshAdminSession();
    if (!restored) return null;
  }

  const response = await apiGet('/admin/session', { token: accessToken });
  currentAdmin = response.user;
  notifySessionChanged();
  return response;
}

export async function logoutAdmin() {
  const token = accessToken;
  try {
    if (token) {
      await apiPost('/auth/logout', {}, { token });
    }
  } finally {
    clearAdminSession();
  }
}
