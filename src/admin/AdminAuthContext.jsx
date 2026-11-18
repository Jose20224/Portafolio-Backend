import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getAccessToken,
  getAdminSession,
  loginAdmin,
  logoutAdmin,
  refreshAdminSession,
} from '../services/api/auth';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const handleSessionChange = (event) => {
      if (active) setAdmin(event.detail?.user ?? null);
    };

    window.addEventListener('portfolio-auth-change', handleSessionChange);
    getAdminSession()
      .then((session) => {
        if (active) setAdmin(session?.user ?? null);
      })
      .catch(() => {
        if (active) setAdmin(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.removeEventListener('portfolio-auth-change', handleSessionChange);
    };
  }, []);

  const signIn = useCallback(async (credentials) => {
    const user = await loginAdmin(credentials);
    setAdmin(user);
    return user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutAdmin();
    } finally {
      setAdmin(null);
    }
  }, []);

  const runAdminRequest = useCallback(async (request) => {
    let token = getAccessToken();
    if (!token) {
      const restored = await refreshAdminSession();
      if (!restored) throw new Error('Tu sesión administrativa ha expirado. Inicia sesión nuevamente.');
      token = getAccessToken();
    }

    try {
      return await request({ token });
    } catch (error) {
      if (error?.status !== 401) throw error;
      const refreshed = await refreshAdminSession();
      if (!refreshed) {
        setAdmin(null);
        throw new Error('Tu sesión ha expirado. Vuelve a iniciar sesión.');
      }
      token = getAccessToken();
      return request({ token });
    }
  }, []);

  const value = useMemo(() => ({
    admin,
    loading,
    signIn,
    signOut,
    runAdminRequest,
  }), [admin, loading, signIn, signOut, runAdminRequest]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth debe usarse dentro de AdminAuthProvider.');
  return context;
}
