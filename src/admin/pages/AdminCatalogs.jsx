import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createAdminCategory, createAdminSkill, createAdminSocialLink,
  deleteAdminCategory, deleteAdminSkill, deleteAdminSocialLink,
  getAdminCategories, getAdminSkills, getAdminSocialLinks,
  updateAdminCategory, updateAdminSkill, updateAdminSocialLink,
} from '../../services/api/adminPortfolio';
import { useAdminAuth } from '../AdminAuthContext';
import { Button, EmptyState, Field, inputClass, Loading, Modal, Notice, PageHeading, Panel } from '../AdminUI';

const CATALOGS = {
  categories: {
    title: 'Categorías',
    description: 'Organiza los proyectos por tipo y controla qué categorías aparecen en el sitio.',
    load: getAdminCategories, create: createAdminCategory, update: updateAdminCategory, remove: deleteAdminCategory,
    fields: [
      { key: 'name', label: 'Nombre', required: true, maxLength: 100 },
      { key: 'slug', label: 'Slug', required: true, maxLength: 100, hint: 'Solo minúsculas, números y guiones. Ej. desarrollo-web.' },
      { key: 'label', label: 'Etiqueta visible', required: true, maxLength: 100 },
      { key: 'description', label: 'Descripción', type: 'textarea', maxLength: 500 },
      { key: 'sort_order', label: 'Orden', type: 'number', min: 0 },
      { key: 'is_active', label: 'Activa', type: 'checkbox' },
    ],
    defaults: { name: '', slug: '', label: '', description: '', sort_order: 0, is_active: true },
    summary: (item) => item.description || `/${item.slug}`,
    status: (item) => item.is_active ? 'Activa' : 'Oculta',
  },
  skills: {
    title: 'Habilidades',
    description: 'Administra conocimientos técnicos, herramientas e intereses. Las habilidades técnicas requieren un nivel de 0 a 100.',
    load: getAdminSkills, create: createAdminSkill, update: updateAdminSkill, remove: deleteAdminSkill,
    fields: [
      { key: 'group_type', label: 'Grupo', type: 'select', options: [['technical', 'Técnicas'], ['tools', 'Herramientas'], ['interests', 'Intereses']] },
      { key: 'name', label: 'Nombre', required: true, maxLength: 100 },
      { key: 'level', label: 'Nivel (0–100)', type: 'number', min: 0, max: 100, onlyTechnical: true },
      { key: 'sort_order', label: 'Orden', type: 'number', min: 0 },
      { key: 'is_visible', label: 'Visible en el sitio', type: 'checkbox' },
    ],
    defaults: { group_type: 'technical', name: '', level: 70, sort_order: 0, is_visible: true },
    summary: (item) => item.group_type === 'technical' ? `Técnica · ${item.level}%` : item.group_type === 'tools' ? 'Herramienta' : 'Interés',
    status: (item) => item.is_visible ? 'Visible' : 'Oculta',
  },
  social: {
    title: 'Redes sociales',
    description: 'Gestiona los enlaces que aparecen en el portafolio.',
    load: getAdminSocialLinks, create: createAdminSocialLink, update: updateAdminSocialLink, remove: deleteAdminSocialLink,
    fields: [
      { key: 'platform', label: 'Plataforma', required: true, maxLength: 60, hint: 'Ej. GitHub, LinkedIn, Behance.' },
      { key: 'label', label: 'Texto visible', required: true, maxLength: 100 },
      { key: 'url', label: 'URL', type: 'url', required: true, maxLength: 2048 },
      { key: 'sort_order', label: 'Orden', type: 'number', min: 0 },
      { key: 'is_visible', label: 'Visible en el sitio', type: 'checkbox' },
    ],
    defaults: { platform: '', label: '', url: '', sort_order: 0, is_visible: true },
    summary: (item) => item.url,
    status: (item) => item.is_visible ? 'Visible' : 'Oculta',
  },
};

function CatalogField({ field, value, onChange, group }) {
  if (field.onlyTechnical && group !== 'technical') return null;
  if (field.type === 'checkbox') {
    return <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-slate-300"><input type="checkbox" className="h-4 w-4 accent-blue-500" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />{field.label}</label>;
  }
  if (field.type === 'select') {
    return <Field label={field.label}><select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>{field.options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>;
  }
  if (field.type === 'textarea') {
    return <Field label={field.label} hint={field.hint}><textarea rows={3} maxLength={field.maxLength} className={inputClass} value={value ?? ''} onChange={(event) => onChange(event.target.value)} /></Field>;
  }
  return <Field label={field.label} hint={field.hint}><input className={inputClass} type={field.type || 'text'} required={Boolean(field.required)} maxLength={field.maxLength} min={field.min} max={field.max} value={value ?? ''} onChange={(event) => onChange(field.type === 'number' ? (event.target.value === '' ? '' : Number(event.target.value)) : event.target.value)} /></Field>;
}

export default function AdminCatalogs({ type }) {
  const config = CATALOGS[type] || CATALOGS.categories;
  const { runAdminRequest } = useAdminAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(config.defaults);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadItems = useCallback(async () => {
    const result = await runAdminRequest((options) => config.load(options));
    setItems(Array.isArray(result) ? result : []);
  }, [config, runAdminRequest]);

  useEffect(() => {
    let active = true;
    runAdminRequest((options) => config.load(options))
      .then((result) => { if (active) setItems(Array.isArray(result) ? result : []); })
      .catch((requestError) => { if (active) setError(requestError?.message || 'No fue posible cargar los registros.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [config, runAdminRequest]);

  const visibleFields = useMemo(() => config.fields, [config]);

  const startNew = () => { setEditing(null); setForm({ ...config.defaults }); setError(''); setNotice(''); };
  const startEdit = (item) => {
    setEditing(item.id);
    setForm({ ...config.defaults, ...item });
    setError('');
    setNotice('');
  };
  const change = (key, value) => setForm((current) => ({
    ...current,
    [key]: value,
    ...(key === 'group_type' && value !== 'technical' ? { level: null } : {}),
    ...(key === 'group_type' && value === 'technical' && current.level == null ? { level: 70 } : {}),
  }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    const payload = { ...form };
    if ('sort_order' in payload) payload.sort_order = Number(payload.sort_order || 0);
    if (type === 'skills' && payload.group_type !== 'technical') payload.level = null;
    if (type === 'skills' && payload.group_type === 'technical') payload.level = Number(payload.level);
    if (type === 'categories' && !payload.description) payload.description = null;
    try {
      if (editing) await runAdminRequest((options) => config.update(editing, payload, options));
      else await runAdminRequest((options) => config.create(payload, options));
      await loadItems();
      startNew();
      setNotice(editing ? 'Registro actualizado.' : 'Registro creado.');
    } catch (requestError) {
      setError(requestError?.message || 'No fue posible guardar el registro.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (item) => {
    const label = item.name || item.label || item.platform;
    if (!window.confirm(`¿Eliminar «${label}»? Esta acción no se puede deshacer.`)) return;
    setError(''); setNotice('');
    try {
      await runAdminRequest((options) => config.remove(item.id, options));
      await loadItems();
      if (editing === item.id) startNew();
      setNotice('Registro eliminado.');
    } catch (requestError) {
      setError(requestError?.message || 'No fue posible eliminar el registro.');
    }
  };

  if (loading) return <Loading label={`Cargando ${config.title.toLowerCase()}…`} />;

  return (
    <>
      <PageHeading title={config.title} description={config.description} action={<Button variant="secondary" onClick={startNew}><span className="material-symbols-outlined text-base">add</span>Nuevo registro</Button>} />
      {error && <Notice>{error}</Notice>}
      {notice && <Notice variant="success" onClose={() => setNotice('')}>{notice}</Notice>}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Registros" description={`${items.length} elementos`}>
          {items.length === 0 ? <EmptyState title="Todavía no hay registros" description="Usa el formulario para agregar el primer elemento." /> : (
            <div className="divide-y divide-white/10">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{item.name || item.label || item.platform}</p><p className="mt-1 truncate text-xs text-slate-500">{config.summary(item)}</p><span className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400">{config.status(item)}</span></div>
                  <div className="flex shrink-0 gap-2"><Button variant="secondary" size="small" onClick={() => startEdit(item)}>Editar</Button><Button variant="danger" size="small" onClick={() => handleDelete(item)}>Eliminar</Button></div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title={editing ? 'Editar registro' : 'Nuevo registro'} description="Completa los campos y guarda los cambios.">
          <form onSubmit={handleSubmit} className="space-y-4">
            {visibleFields.map((field) => <CatalogField key={field.key} field={field} value={form[field.key]} group={form.group_type} onChange={(value) => change(field.key, value)} />)}
            <div className="flex gap-2 pt-2"><Button type="submit" disabled={saving}>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear registro'}</Button>{editing && <Button variant="secondary" onClick={startNew}>Cancelar</Button>}</div>
          </form>
        </Panel>
      </div>
    </>
  );
}
