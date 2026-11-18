import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext';
import { Button } from './AdminUI';

const navigation = [
  { to: '/admin', label: 'Resumen', icon: 'space_dashboard', end: true },
  { to: '/admin/perfil', label: 'Mi perfil', icon: 'person' },
  { to: '/admin/proyectos', label: 'Proyectos', icon: 'grid_view' },
  { to: '/admin/categorias', label: 'Categorías', icon: 'category' },
  { to: '/admin/habilidades', label: 'Habilidades', icon: 'psychology' },
  { to: '/admin/redes', label: 'Redes sociales', icon: 'share' },
  { to: '/admin/mensajes', label: 'Mensajes', icon: 'mail' },
  { to: '/admin/medios', label: 'Imágenes', icon: 'image' },
];

function NavigationLinks({ onNavigate }) {
  return navigation.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
    >
      <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
      {item.label}
    </NavLink>
  ));
}

export default function AdminLayout() {
  const { admin, signOut } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0a0f17] text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-[#0d131d] px-4 py-5 lg:flex">
        <div className="mb-9 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300"><span className="material-symbols-outlined">terminal</span></div>
          <div><p className="font-bold tracking-tight text-white">Portafolio</p><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Panel de control</p></div>
        </div>
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Contenido</p>
        <nav className="flex flex-col gap-1"><NavigationLinks /></nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="truncate text-sm font-semibold text-white">{admin?.displayName || admin?.email || 'Administrador'}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-blue-300">{admin?.role === 'owner' ? 'Propietario' : 'Editor'}</p>
          <Button variant="secondary" size="small" className="mt-3 w-full" onClick={handleLogout}><span className="material-symbols-outlined text-base">logout</span>Cerrar sesión</Button>
        </div>
      </aside>

      <div className="min-w-0 lg:ml-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#0a0f17]/90 px-4 py-3 backdrop-blur-xl sm:px-7">
          <div className="lg:hidden"><p className="font-bold text-white">Portafolio</p><p className="text-[10px] uppercase tracking-widest text-slate-500">Administración</p></div>
          <div className="hidden text-xs text-slate-500 lg:block">Espacio de administración · Contenido del sitio</div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-xs text-slate-400 sm:block">{admin?.displayName || admin?.email}</span>
            <span className="rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-200">{admin?.role || 'admin'}</span>
            <button type="button" onClick={handleLogout} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden" aria-label="Cerrar sesión"><span className="material-symbols-outlined">logout</span></button>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-white/10 bg-[#0d131d] px-3 py-2 lg:hidden"><NavigationLinks /></nav>
        <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9"><Outlet /></main>
      </div>
    </div>
  );
}
