import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../AdminAuthContext';
import { Button, Field, inputClass, Notice } from '../AdminUI';

export default function AdminLogin() {
  const { admin, loading, signIn } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!loading && admin) return <Navigate to="/admin" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn({ email, password });
      navigate('/admin', { replace: true });
    } catch (requestError) {
      setError(requestError?.message || 'No fue posible iniciar sesión.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080d15] px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111722] p-7 shadow-2xl shadow-black/30 sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300"><span className="material-symbols-outlined text-2xl">admin_panel_settings</span></div>
          <div><p className="text-lg font-bold text-white">Panel de administración</p><p className="text-xs text-slate-500">Acceso privado del portafolio</p></div>
        </div>
        <p className="mb-2 text-[11px] font-bold tracking-[0.22em] text-blue-300">BIENVENIDO</p>
        <h1 className="text-2xl font-bold tracking-tight text-white">Iniciar sesión</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Utiliza la cuenta administrativa creada en Supabase Auth.</p>
        {error && <div className="mt-5"><Notice>{error}</Notice></div>}
        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <Field label="Correo electrónico"><input className={inputClass} type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@ejemplo.com" /></Field>
          <Field label="Contraseña"><input className={inputClass} type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tu contraseña" /></Field>
          <Button type="submit" disabled={busy || loading} className="w-full py-3">{busy ? 'Verificando…' : 'Entrar al panel'}<span className="material-symbols-outlined text-base">arrow_forward</span></Button>
        </form>
        <p className="mt-7 border-t border-white/10 pt-5 text-center text-xs text-slate-600">El registro público no está habilitado. Solicita al propietario que cree o autorice tu cuenta.</p>
      </div>
    </div>
  );
}
