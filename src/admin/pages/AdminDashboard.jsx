import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../AdminAuthContext';
import { getAdminCategories, getAdminProjects, getAdminSkills } from '../../services/api/adminPortfolio';
import { getContactMessageStats } from '../../services/api/adminContactMessages';
import { Loading, Notice, PageHeading, Panel, StatCard } from '../AdminUI';

export default function AdminDashboard() {
  const { admin, runAdminRequest } = useAdminAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    runAdminRequest(async (options) => {
      const [projects, categories, skills, messages] = await Promise.all([
        getAdminProjects({ page: 1, limit: 1 }, options),
        getAdminCategories(options),
        getAdminSkills(options),
        getContactMessageStats(options),
      ]);
      return { projects, categories, skills, messages };
    })
      .then((result) => { if (active) setData(result); })
      .catch((requestError) => { if (active) setError(requestError?.message || 'No fue posible cargar el resumen.'); });
    return () => { active = false; };
  }, [runAdminRequest]);

  if (error) return <><PageHeading title="Resumen" description="Estado general del contenido administrado." /><Notice>{error}</Notice></>;
  if (!data) return <Loading label="Cargando resumen…" />;

  const skillCount = Array.isArray(data.skills) ? data.skills.length : 0;
  const newMessages = data.messages?.byStatus?.new ?? 0;
  const shortcuts = [
    { to: '/admin/perfil', icon: 'person', title: 'Actualizar perfil', text: 'Nombre, descripción, disponibilidad e imagen principal.' },
    { to: '/admin/proyectos', icon: 'grid_view', title: 'Gestionar proyectos', text: 'Crear, editar, ordenar y publicar proyectos.' },
    { to: '/admin/mensajes', icon: 'mail', title: 'Revisar mensajes', text: 'Consultar solicitudes enviadas desde el formulario público.' },
    { to: '/admin/medios', icon: 'image', title: 'Biblioteca de imágenes', text: 'Subir y administrar imágenes del portafolio.' },
  ];

  return (
    <>
      <PageHeading title="Resumen" description={`Bienvenido, ${admin?.displayName || admin?.email || 'administrador'}. Desde aquí puedes mantener actualizado el contenido del portafolio.`} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Proyectos" value={data.projects?.pagination?.total ?? 0} icon="grid_view" detail="Registrados en el panel" />
        <StatCard label="Categorías" value={data.categories?.length ?? 0} icon="category" detail="Activas e inactivas" />
        <StatCard label="Habilidades" value={skillCount} icon="psychology" detail="En los tres grupos" />
        <StatCard label="Mensajes nuevos" value={newMessages} icon="mark_email_unread" detail={`${data.messages?.total ?? 0} mensajes en total`} />
      </div>

      <Panel title="Accesos rápidos" description="Tareas frecuentes para mantener actualizado el sitio." className="mt-7">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {shortcuts.map((item) => (
            <Link key={item.to} to={item.to} className="group flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-blue-300/30 hover:bg-blue-400/[0.05]">
              <span className="material-symbols-outlined flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">{item.icon}</span>
              <span><strong className="block text-sm text-white group-hover:text-blue-200">{item.title}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{item.text}</span></span>
              <span className="material-symbols-outlined ml-auto text-slate-600 transition group-hover:translate-x-1 group-hover:text-blue-300">arrow_forward</span>
            </Link>
          ))}
        </div>
      </Panel>

      <div className="mt-6 rounded-2xl border border-blue-300/10 bg-blue-400/[0.04] p-5">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-300">info</span>
          <div><p className="text-sm font-semibold text-blue-100">Publicación controlada</p><p className="mt-1 text-sm leading-6 text-slate-400">Los proyectos nuevos se guardan como borradores. Debes usar la acción «Publicar» para que aparezcan en el portafolio público.</p></div>
        </div>
      </div>
    </>
  );
}
