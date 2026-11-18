import { useCallback, useEffect, useState } from 'react';
import {
  createAdminProject,
  createAdminProjectChild,
  deleteAdminProject,
  deleteAdminProjectChild,
  getAdminCategories,
  getAdminProject,
  getAdminProjectChildren,
  getAdminProjects,
  publishAdminProject,
  unpublishAdminProject,
  updateAdminProject,
  updateAdminProjectChild,
} from '../../services/api/adminPortfolio';
import { uploadPortfolioImage } from '../../services/api/storage';
import { useAdminAuth } from '../AdminAuthContext';
import { Button, EmptyState, Field, inputClass, Loading, Modal, Notice, PageHeading, Panel } from '../AdminUI';

const emptyProject = {
  category_id: '', slug: '', title: '', short_description: '', full_description: '',
  card_image_path: '', cover_image_path: '', live_url: '', github_url: '', year: new Date().getFullYear(),
  role: '', status: 'in_progress', is_featured: false, sort_order: 0,
};
const dateText = (value) => value ? new Date(value).toLocaleDateString('es-NI') : 'Sin publicar';

function slugify(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

function ImagePathField({ label, area = 'projects', value, onChange, runAdminRequest }) {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const upload = async (file) => {
    setUploading(true);
    try {
      const result = await runAdminRequest(({ token }) => uploadPortfolioImage(file, { area, token }));
      onChange(result.path);
      setUrl(result.publicUrl || '');
    } catch (error) {
      window.alert(error?.message || 'No fue posible cargar la imagen.');
    } finally { setUploading(false); }
  };
  return (
    <Field label={label} hint="Puedes seleccionar una imagen o pegar una ruta ya existente desde la biblioteca.">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input className={inputClass} value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={`${area}/archivo.jpg`} />
        <label className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 ${uploading ? 'pointer-events-none opacity-50' : ''}`}>{uploading ? 'Cargando…' : 'Subir'}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(file); event.target.value = ''; }} /></label>
      </div>
      {url && <img src={url} alt="Vista previa de la imagen" className="mt-3 h-24 w-40 rounded-lg border border-white/10 object-cover" />}
    </Field>
  );
}

const relationDefinitions = {
  technologies: {
    title: 'Tecnologías',
    fields: [
      { key: 'name', label: 'Nombre', required: true, maxLength: 100 },
      { key: 'role', label: 'Uso o función', maxLength: 100 },
      { key: 'sort_order', label: 'Orden', type: 'number' },
    ],
    empty: { name: '', role: '', sort_order: 0 },
    display: (item) => item.role ? `${item.name} · ${item.role}` : item.name,
  },
  highlights: {
    title: 'Aspectos destacados',
    fields: [
      { key: 'content', label: 'Descripción', required: true, maxLength: 1000, type: 'textarea' },
      { key: 'sort_order', label: 'Orden', type: 'number' },
    ],
    empty: { content: '', sort_order: 0 },
    display: (item) => item.content,
  },
  collaborators: {
    title: 'Colaboradores',
    fields: [
      { key: 'name', label: 'Nombre', required: true, maxLength: 120 },
      { key: 'role', label: 'Rol en el proyecto', maxLength: 120 },
      { key: 'avatar_path', label: 'Ruta del avatar', maxLength: 500 },
      { key: 'github_url', label: 'GitHub', maxLength: 2048 },
      { key: 'linkedin_url', label: 'LinkedIn', maxLength: 2048 },
      { key: 'sort_order', label: 'Orden', type: 'number' },
    ],
    empty: { name: '', role: '', avatar_path: '', github_url: '', linkedin_url: '', sort_order: 0 },
    display: (item) => item.role ? `${item.name} · ${item.role}` : item.name,
  },
};

function ProjectRelationManager({ projectId, runAdminRequest }) {
  const [kind, setKind] = useState('technologies');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(relationDefinitions.technologies.empty);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const definition = relationDefinitions[kind];

  const load = useCallback(async () => {
    const result = await runAdminRequest((options) => getAdminProjectChildren(projectId, kind, options));
    const rows = Array.isArray(result) ? result : [];
    setItems(rows);
    setDrafts(Object.fromEntries(rows.map((row) => [row.id, { ...row }])));
  }, [projectId, kind, runAdminRequest]);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    runAdminRequest((options) => getAdminProjectChildren(projectId, kind, options))
      .then((result) => {
        if (!active) return;
        const rows = Array.isArray(result) ? result : [];
        setItems(rows);
        setDrafts(Object.fromEntries(rows.map((row) => [row.id, { ...row }])));
      })
      .catch((requestError) => { if (active) setError(requestError?.message || 'No fue posible cargar los elementos del proyecto.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [projectId, kind, runAdminRequest]);

  const changeDraft = (id, key, value) => setDrafts((current) => ({ ...current, [id]: { ...current[id], [key]: value } }));

  const addItem = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    const payload = { ...form };
    for (const key of ['role', 'avatar_path', 'github_url', 'linkedin_url']) if (payload[key] === '') payload[key] = null;
    if ('sort_order' in payload) payload.sort_order = Number(payload.sort_order || 0);
    try {
      await runAdminRequest((options) => createAdminProjectChild(projectId, kind, payload, options));
      setForm({ ...definition.empty });
      await load();
    } catch (requestError) { setError(requestError?.message || 'No fue posible agregar el elemento.'); }
    finally { setSaving(false); }
  };

  const saveItem = async (id) => {
    setSaving(true); setError('');
    const payload = { ...drafts[id] };
    delete payload.id; delete payload.project_id; delete payload.created_at; delete payload.updated_at;
    if ('sort_order' in payload) payload.sort_order = Number(payload.sort_order || 0);
    for (const key of ['role', 'avatar_path', 'github_url', 'linkedin_url']) if (payload[key] === '') payload[key] = null;
    try { await runAdminRequest((options) => updateAdminProjectChild(projectId, kind, id, payload, options)); await load(); }
    catch (requestError) { setError(requestError?.message || 'No fue posible actualizar el elemento.'); }
    finally { setSaving(false); }
  };

  const removeItem = async (item) => {
    if (!window.confirm('¿Eliminar este elemento del proyecto?')) return;
    setError('');
    try { await runAdminRequest((options) => deleteAdminProjectChild(projectId, kind, item.id, options)); await load(); }
    catch (requestError) { setError(requestError?.message || 'No fue posible eliminar el elemento.'); }
  };

  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <div className="mb-4 flex flex-wrap gap-2">{Object.entries(relationDefinitions).map(([key, item]) => <button key={key} type="button" onClick={() => { setKind(key); setForm({ ...relationDefinitions[key].empty }); }} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${kind === key ? 'bg-blue-500/15 text-blue-200' : 'bg-white/5 text-slate-400 hover:text-white'}`}>{item.title}</button>)}</div>
      {error && <Notice>{error}</Notice>}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-2">{loading ? <Loading label="Cargando elementos…" /> : items.length === 0 ? <EmptyState title={`Sin ${definition.title.toLowerCase()}`} description="Agrega el primer elemento con el formulario." /> : items.map((item) => (
          <div key={item.id} className="rounded-xl border border-white/10 bg-[#0a0f17] p-3">
            <div className="grid gap-2 sm:grid-cols-2">{definition.fields.map((field) => <Field key={field.key} label={field.label}>{field.type === 'textarea' ? <textarea rows={2} className={inputClass} required={Boolean(field.required)} maxLength={field.maxLength} value={drafts[item.id]?.[field.key] ?? ''} onChange={(event) => changeDraft(item.id, field.key, event.target.value)} /> : <input className={inputClass} type={field.type === 'number' ? 'number' : 'text'} required={Boolean(field.required)} maxLength={field.maxLength} value={drafts[item.id]?.[field.key] ?? ''} onChange={(event) => changeDraft(item.id, field.key, field.type === 'number' ? Number(event.target.value) : event.target.value)} />}</Field>)}</div>
            <div className="mt-3 flex justify-end gap-2"><Button size="small" variant="secondary" disabled={saving} onClick={() => saveItem(item.id)}>Guardar</Button><Button size="small" variant="danger" disabled={saving} onClick={() => removeItem(item)}>Eliminar</Button></div>
          </div>
        ))}</div>
        <form onSubmit={addItem} className="h-fit rounded-xl border border-white/10 bg-[#0a0f17] p-4"><p className="mb-4 text-sm font-semibold text-white">Agregar {definition.title.toLowerCase()}</p><div className="space-y-3">{definition.fields.map((field) => <Field key={field.key} label={field.label}>{field.type === 'textarea' ? <textarea rows={2} className={inputClass} required={Boolean(field.required)} maxLength={field.maxLength} value={form[field.key] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} /> : <input className={inputClass} type={field.type === 'number' ? 'number' : 'text'} required={Boolean(field.required)} maxLength={field.maxLength} value={form[field.key] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [field.key]: field.type === 'number' ? Number(event.target.value) : event.target.value }))} />}</Field>)}</div><Button type="submit" disabled={saving} className="mt-4 w-full">Agregar elemento</Button></form>
      </div>
    </div>
  );
}

export default function AdminProjects() {
  const { runAdminRequest } = useAdminAuth();
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1 });
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProject);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const [projectResult, categoryResult] = await runAdminRequest((options) => Promise.all([
      getAdminProjects({ page: 1, limit: 100, ...(filter ? { status: filter } : {}) }, options),
      getAdminCategories(options),
    ]));
    setProjects(projectResult?.items || []);
    setPagination(projectResult?.pagination || { total: 0, totalPages: 1, page: 1 });
    setCategories(Array.isArray(categoryResult) ? categoryResult : []);
  }, [runAdminRequest, filter]);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    load().catch((requestError) => { if (active) setError(requestError?.message || 'No fue posible cargar los proyectos.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  const openNew = () => { setEditing(null); setForm({ ...emptyProject, category_id: categories.find((item) => item.is_active)?.id || '' }); setError(''); setModalOpen(true); };

  const openEdit = async (project) => {
    setError(''); setSaving(true);
    try {
      const full = await runAdminRequest((options) => getAdminProject(project.id, options));
      setEditing(full);
      setForm({ ...emptyProject, ...full, card_image_path: full.card_image_path || '', cover_image_path: full.cover_image_path || '', live_url: full.live_url || '', github_url: full.github_url || '', role: full.role || '', year: full.year || '' });
      setModalOpen(true);
    } catch (requestError) { setError(requestError?.message || 'No fue posible abrir el proyecto.'); }
    finally { setSaving(false); }
  };

  const change = (key, value) => setForm((current) => ({
    ...current,
    [key]: value,
    ...(key === 'title' && !current.slug ? { slug: slugify(value) } : {}),
  }));

  const saveProject = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    const payload = {
      ...form,
      year: form.year === '' ? null : Number(form.year),
      sort_order: Number(form.sort_order || 0),
      card_image_path: form.card_image_path || null,
      cover_image_path: form.cover_image_path || null,
      live_url: form.live_url || null,
      github_url: form.github_url || null,
      role: form.role || null,
    };
    delete payload.id; delete payload.created_at; delete payload.updated_at; delete payload.published_at;
    delete payload.is_published;
    try {
      const saved = editing
        ? await runAdminRequest((options) => updateAdminProject(editing.id, payload, options))
        : await runAdminRequest((options) => createAdminProject(payload, options));
      setEditing(saved);
      setForm((current) => ({ ...current, ...saved, card_image_path: saved.card_image_path || '', cover_image_path: saved.cover_image_path || '' }));
      await load();
      setNotice(editing ? 'Proyecto actualizado.' : 'Proyecto creado. Ya puedes agregar sus tecnologías y colaboradores.');
    } catch (requestError) { setError(requestError?.message || 'No fue posible guardar el proyecto.'); }
    finally { setSaving(false); }
  };

  const togglePublish = async (project) => {
    setError(''); setNotice('');
    try {
      if (project.is_published) await runAdminRequest((options) => unpublishAdminProject(project.id, options));
      else await runAdminRequest((options) => publishAdminProject(project.id, options));
      await load();
      setNotice(project.is_published ? 'Proyecto retirado de publicación.' : 'Proyecto publicado correctamente.');
    } catch (requestError) { setError(requestError?.message || 'No fue posible cambiar la publicación.'); }
  };

  const removeProject = async (project) => {
    if (!window.confirm(`¿Eliminar el proyecto «${project.title}»? También se eliminarán sus tecnologías, destacados y colaboradores asociados.`)) return;
    try {
      await runAdminRequest((options) => deleteAdminProject(project.id, options));
      await load(); setNotice('Proyecto eliminado.');
    } catch (requestError) { setError(requestError?.message || 'No fue posible eliminar el proyecto.'); }
  };

  const activeCategories = categories.filter((category) => category.is_active);

  return (
    <>
      <PageHeading title="Proyectos" description="Crea y administra los proyectos que forman parte de tu portafolio." action={<Button onClick={openNew}><span className="material-symbols-outlined text-base">add</span>Nuevo proyecto</Button>} />
      {error && <Notice>{error}</Notice>}
      {notice && <Notice variant="success" onClose={() => setNotice('')}>{notice}</Notice>}
      <Panel title="Listado de proyectos" description={`${pagination.total ?? projects.length} proyectos registrados`}>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">Los borradores no aparecen en la página pública.</p><select className={`${inputClass} sm:w-52`} value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">Todos los estados</option><option value="in_progress">En progreso</option><option value="completed">Completados</option><option value="archived">Archivados</option></select></div>
        {loading ? <Loading label="Cargando proyectos…" /> : projects.length === 0 ? <EmptyState title="Aún no hay proyectos" description="Crea el primero para empezar a construir tu portafolio." /> : <div className="space-y-3">{projects.map((project) => <article key={project.id} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#0a0f17] p-4 md:flex-row md:items-center"><div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/5">{project.card_image_url ? <img src={project.card_image_url} alt="" className="h-full w-full object-cover" /> : <span className="material-symbols-outlined text-3xl text-slate-600">image</span>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-white">{project.title}</h3><span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-wider ${project.is_published ? 'bg-emerald-400/10 text-emerald-200' : 'bg-amber-400/10 text-amber-200'}`}>{project.is_published ? 'Publicado' : 'Borrador'}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{project.short_description}</p><p className="mt-2 text-[10px] uppercase tracking-wider text-slate-600">{project.category?.label || project.category?.name || 'Sin categoría'} · {project.status} · {project.published_at ? dateText(project.published_at) : 'No publicado'}</p></div><div className="flex flex-wrap gap-2"><Button size="small" variant="secondary" onClick={() => openEdit(project)}>Editar</Button><Button size="small" variant="secondary" onClick={() => togglePublish(project)}>{project.is_published ? 'Retirar' : 'Publicar'}</Button><Button size="small" variant="danger" onClick={() => removeProject(project)}>Eliminar</Button></div></article>)}</div>}
      </Panel>

      {modalOpen && <Modal title={editing ? 'Editar proyecto' : 'Nuevo proyecto'} onClose={() => { setModalOpen(false); setEditing(null); }} wide>
        <form onSubmit={saveProject} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Título"><input required maxLength={160} className={inputClass} value={form.title} onChange={(event) => change('title', event.target.value)} /></Field>
            <Field label="Slug / URL"><input required maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" className={inputClass} value={form.slug} onChange={(event) => change('slug', event.target.value)} placeholder="mi-proyecto" /></Field>
            <Field label="Categoría"><select required className={inputClass} value={form.category_id} onChange={(event) => change('category_id', event.target.value)}><option value="">Seleccionar categoría</option>{activeCategories.map((category) => <option key={category.id} value={category.id}>{category.label || category.name}</option>)}</select></Field>
            <Field label="Estado del proyecto"><select className={inputClass} value={form.status} onChange={(event) => change('status', event.target.value)}><option value="in_progress">En progreso</option><option value="completed">Completado</option><option value="archived">Archivado</option></select></Field>
            <Field label="Año"><input type="number" min="1900" max="2100" className={inputClass} value={form.year ?? ''} onChange={(event) => change('year', event.target.value)} /></Field>
            <Field label="Rol"><input maxLength={120} className={inputClass} value={form.role || ''} onChange={(event) => change('role', event.target.value)} placeholder="Ej. Desarrollo full stack" /></Field>
          </div>
          <Field label="Descripción corta"><textarea required rows={2} maxLength={500} className={inputClass} value={form.short_description} onChange={(event) => change('short_description', event.target.value)} /></Field>
          <Field label="Descripción completa"><textarea required rows={5} maxLength={10000} className={inputClass} value={form.full_description} onChange={(event) => change('full_description', event.target.value)} /></Field>
          <div className="grid gap-4 md:grid-cols-2">
            <ImagePathField label="Imagen de tarjeta" area="projects" value={form.card_image_path} onChange={(value) => change('card_image_path', value)} runAdminRequest={runAdminRequest} />
            <ImagePathField label="Imagen de portada" area="projects" value={form.cover_image_path} onChange={(value) => change('cover_image_path', value)} runAdminRequest={runAdminRequest} />
            <Field label="URL de demostración"><input type="url" maxLength={2048} className={inputClass} value={form.live_url || ''} onChange={(event) => change('live_url', event.target.value)} placeholder="https://…" /></Field>
            <Field label="URL de GitHub"><input type="url" maxLength={2048} className={inputClass} value={form.github_url || ''} onChange={(event) => change('github_url', event.target.value)} placeholder="https://github.com/…" /></Field>
          </div>
          <div className="flex flex-wrap gap-5 rounded-xl border border-white/10 bg-[#0a0f17] p-4"><label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" className="h-4 w-4 accent-blue-500" checked={Boolean(form.is_featured)} onChange={(event) => change('is_featured', event.target.checked)} />Proyecto destacado</label><Field label="Orden"><input type="number" min="0" className={`${inputClass} w-24`} value={form.sort_order ?? 0} onChange={(event) => change('sort_order', Number(event.target.value))} /></Field></div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5"><div className="flex gap-2"><Button type="submit" disabled={saving || activeCategories.length === 0}>{saving ? 'Guardando…' : editing ? 'Guardar proyecto' : 'Crear proyecto'}</Button><Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null); }}>Cerrar</Button></div>{editing && <p className="text-xs text-slate-500">ID: {editing.id}</p>}</div>
        </form>
        {editing?.id && <ProjectRelationManager projectId={editing.id} runAdminRequest={runAdminRequest} />}
        {!editing && <p className="mt-5 text-xs text-slate-500">Primero guarda el proyecto. Después podrás agregar tecnologías, aspectos destacados y colaboradores.</p>}
      </Modal>}
    </>
  );
}
