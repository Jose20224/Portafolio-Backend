import { useCallback, useEffect, useState } from 'react';
import {
  getContactMessage,
  getContactMessageStats,
  getContactMessages,
  updateContactMessageStatus,
} from '../../services/api/adminContactMessages';
import { useAdminAuth } from '../AdminAuthContext';
import { Button, EmptyState, Loading, Modal, Notice, PageHeading, Panel, StatCard, inputClass } from '../AdminUI';

const statusLabels = { new: 'Nuevo', read: 'Leído', replied: 'Respondido', archived: 'Archivado' };
const statusStyles = {
  new: 'border-blue-300/20 bg-blue-400/10 text-blue-200',
  read: 'border-amber-300/20 bg-amber-400/10 text-amber-200',
  replied: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200',
  archived: 'border-slate-500/20 bg-slate-500/10 text-slate-300',
};
const dateFormat = new Intl.DateTimeFormat('es-NI', { dateStyle: 'medium', timeStyle: 'short' });

function StatusPill({ status }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusStyles[status] || statusStyles.archived}`}>{statusLabels[status] || status}</span>;
}

export default function AdminMessages() {
  const { runAdminRequest } = useAdminAuth();
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    const [list, totals] = await runAdminRequest(async (options) => Promise.all([
      getContactMessages({ page, limit: 20, status, q: appliedQuery }, options),
      getContactMessageStats(options),
    ]));
    setMessages(list?.items || []);
    setPagination(list?.pagination || { page: 1, totalPages: 1, total: 0 });
    setStats(totals);
  }, [runAdminRequest, page, status, appliedQuery]);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    load().catch((requestError) => { if (active) setError(requestError?.message || 'No fue posible cargar los mensajes.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  const openMessage = async (message) => {
    setSelected(message);
    setDetailLoading(true);
    try {
      const detail = await runAdminRequest((options) => getContactMessage(message.id, options));
      setSelected(detail);
      if (detail.status === 'new') {
        const updated = await runAdminRequest((options) => updateContactMessageStatus(detail.id, 'read', options));
        setSelected(updated);
        await load();
      }
    } catch (requestError) {
      setError(requestError?.message || 'No fue posible abrir el mensaje.');
    } finally { setDetailLoading(false); }
  };

  const changeStatus = async (nextStatus) => {
    if (!selected) return;
    setUpdating(true); setError('');
    try {
      const updated = await runAdminRequest((options) => updateContactMessageStatus(selected.id, nextStatus, options));
      setSelected(updated);
      await load();
    } catch (requestError) {
      setError(requestError?.message || 'No fue posible actualizar el estado.');
    } finally { setUpdating(false); }
  };

  const applySearch = (event) => { event.preventDefault(); setPage(1); setAppliedQuery(query.trim()); };

  return (
    <>
      <PageHeading title="Mensajes de contacto" description="Consulta las solicitudes recibidas desde el formulario público y actualiza su estado." />
      {error && <Notice>{error}</Notice>}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard label="Total" value={stats.total ?? 0} icon="mail" />
          <StatCard label="Nuevos" value={stats.byStatus?.new ?? 0} icon="mark_email_unread" />
          <StatCard label="Leídos" value={stats.byStatus?.read ?? 0} icon="drafts" />
          <StatCard label="Respondidos" value={stats.byStatus?.replied ?? 0} icon="mark_email_read" />
        </div>
      )}
      <Panel title="Bandeja de entrada" description={`${pagination.total ?? 0} mensajes encontrados`}>
        <div className="mb-5 flex flex-col gap-3 md:flex-row">
          <form onSubmit={applySearch} className="flex min-w-0 flex-1 gap-2"><input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, correo o asunto" /><Button type="submit" variant="secondary">Buscar</Button></form>
          <select className={`${inputClass} md:w-48`} value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}><option value="">Todos los estados</option><option value="new">Nuevos</option><option value="read">Leídos</option><option value="replied">Respondidos</option><option value="archived">Archivados</option></select>
        </div>
        {loading ? <Loading label="Cargando mensajes…" /> : messages.length === 0 ? <EmptyState title="No se encontraron mensajes" description="Prueba cambiando los filtros o revisa nuevamente más tarde." /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="pb-3 pr-4">Remitente</th><th className="pb-3 pr-4">Asunto</th><th className="pb-3 pr-4">Fecha</th><th className="pb-3 pr-4">Estado</th><th className="pb-3 text-right">Acción</th></tr></thead><tbody className="divide-y divide-white/10">{messages.map((message) => <tr key={message.id} className="hover:bg-white/[0.02]"><td className="py-4 pr-4"><p className="font-semibold text-white">{message.name}</p><p className="mt-1 text-xs text-slate-500">{message.email}</p></td><td className="max-w-64 truncate py-4 pr-4 text-slate-300">{message.subject || 'Sin asunto'}</td><td className="whitespace-nowrap py-4 pr-4 text-xs text-slate-500">{dateFormat.format(new Date(message.created_at))}</td><td className="py-4 pr-4"><StatusPill status={message.status} /></td><td className="py-4 text-right"><Button size="small" variant="secondary" onClick={() => openMessage(message)}>Abrir</Button></td></tr>)}</tbody></table></div>
        )}
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4"><p className="text-xs text-slate-500">Página {pagination.page || page} de {Math.max(1, pagination.totalPages || 1)}</p><div className="flex gap-2"><Button variant="secondary" size="small" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</Button><Button variant="secondary" size="small" disabled={page >= (pagination.totalPages || 1) || loading} onClick={() => setPage((current) => current + 1)}>Siguiente</Button></div></div>
      </Panel>

      {selected && <Modal title="Detalle del mensaje" onClose={() => setSelected(null)}>
        {detailLoading ? <Loading label="Cargando detalle…" /> : <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><StatusPill status={selected.status} /><span className="text-xs text-slate-500">{dateFormat.format(new Date(selected.created_at))}</span></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nombre</p><p className="mt-1 text-sm text-white">{selected.name}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Correo</p><a className="mt-1 inline-block text-sm text-blue-300 hover:underline" href={`mailto:${selected.email}`}>{selected.email}</a></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Asunto</p><p className="mt-1 text-sm text-white">{selected.subject || 'Sin asunto'}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mensaje</p><p className="mt-2 whitespace-pre-wrap rounded-xl border border-white/10 bg-[#0a0f17] p-4 text-sm leading-7 text-slate-300">{selected.message}</p></div>
          <div className="border-t border-white/10 pt-4"><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Cambiar estado</label><select disabled={updating} className={inputClass} value={selected.status} onChange={(event) => changeStatus(event.target.value)}><option value="new">Nuevo</option><option value="read">Leído</option><option value="replied">Respondido</option><option value="archived">Archivado</option></select><p className="mt-2 text-xs text-slate-500">El estado «Respondido» es una marca de seguimiento; no envía un correo al remitente.</p></div>
          <div className="flex justify-end"><Button variant="secondary" onClick={() => setSelected(null)}>Cerrar</Button></div>
        </div>}
      </Modal>}
    </>
  );
}
