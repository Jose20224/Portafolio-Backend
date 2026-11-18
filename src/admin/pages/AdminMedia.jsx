import { useCallback, useEffect, useState } from 'react';
import { deletePortfolioMedia, getPortfolioMedia, uploadPortfolioImage } from '../../services/api/storage';
import { useAdminAuth } from '../AdminAuthContext';
import { Button, EmptyState, Loading, Notice, PageHeading, Panel, inputClass } from '../AdminUI';

const folders = [
  { value: 'profile', label: 'Perfil', hint: 'Imagen principal y avatar del portafolio.' },
  { value: 'projects', label: 'Proyectos', hint: 'Portadas e imágenes de tarjetas de proyectos.' },
  { value: 'collaborators', label: 'Colaboradores', hint: 'Avatares de las personas que participaron.' },
];

function formatBytes(size) {
  if (!size) return 'Tamaño no disponible';
  return size < 1024 * 1024 ? `${Math.ceil(size / 1024)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminMedia() {
  const { runAdminRequest } = useAdminAuth();
  const [folder, setFolder] = useState('profile');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const result = await runAdminRequest((options) => getPortfolioMedia({ folder, limit: 60, offset: 0 }, options));
    setItems(result?.items || []);
  }, [folder, runAdminRequest]);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    runAdminRequest((options) => getPortfolioMedia({ folder, limit: 60, offset: 0 }, options))
      .then((result) => { if (active) setItems(result?.items || []); })
      .catch((requestError) => { if (active) setError(requestError?.message || 'No fue posible cargar las imágenes.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [folder, runAdminRequest]);

  const handleUpload = async (file) => {
    setUploading(true); setError(''); setNotice('');
    try {
      await runAdminRequest(({ token }) => uploadPortfolioImage(file, { area: folder, token }));
      await load();
      setNotice('Imagen cargada y verificada correctamente.');
    } catch (requestError) {
      setError(requestError?.message || 'No fue posible cargar la imagen.');
    } finally { setUploading(false); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Eliminar la imagen «${item.name}»? Si está vinculada al perfil o a un proyecto, el servidor rechazará la eliminación.`)) return;
    setError(''); setNotice('');
    try {
      await runAdminRequest((options) => deletePortfolioMedia(item.path, options));
      await load();
      setNotice('Imagen eliminada.');
    } catch (requestError) {
      setError(requestError?.message || 'No fue posible eliminar la imagen.');
    }
  };

  const copyPath = async (path) => {
    try { await navigator.clipboard.writeText(path); setNotice('Ruta copiada al portapapeles.'); }
    catch { setNotice(`Ruta de imagen: ${path}`); }
  };

  return (
    <>
      <PageHeading title="Biblioteca de imágenes" description="Administra los archivos de Supabase Storage. Las imágenes que estén en uso no se pueden eliminar." action={<label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 ${uploading ? 'pointer-events-none opacity-50' : ''}`}><span className="material-symbols-outlined text-base">upload</span>{uploading ? 'Cargando…' : 'Subir imagen'}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) handleUpload(file); event.target.value = ''; }} /></label>} />
      {error && <Notice>{error}</Notice>}
      {notice && <Notice variant="success" onClose={() => setNotice('')}>{notice}</Notice>}
      <Panel title="Carpetas del almacenamiento" description="Selecciona dónde deseas consultar o cargar una imagen.">
        <div className="grid gap-3 md:grid-cols-3">{folders.map((item) => <button key={item.value} type="button" onClick={() => setFolder(item.value)} className={`rounded-xl border p-4 text-left transition ${folder === item.value ? 'border-blue-300/40 bg-blue-400/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'}`}><span className="text-sm font-semibold text-white">{item.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{item.hint}</span></button>)}</div>
      </Panel>
      <Panel title={`Imágenes · ${folders.find((item) => item.value === folder)?.label}`} description={`${items.length} archivos cargados en esta consulta.`} className="mt-6">
        {loading ? <Loading label="Cargando biblioteca…" /> : items.length === 0 ? <EmptyState title="Esta carpeta está vacía" description="Selecciona «Subir imagen» para agregar el primer archivo." /> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.path} className="overflow-hidden rounded-xl border border-white/10 bg-[#0a0f17]"><a href={item.publicUrl} target="_blank" rel="noreferrer" className="block h-44 overflow-hidden bg-black/20"><img src={item.publicUrl} alt={item.name} loading="lazy" className="h-full w-full object-cover transition duration-300 hover:scale-105" /></a><div className="p-4"><p className="truncate text-sm font-semibold text-white" title={item.name}>{item.name}</p><p className="mt-1 text-xs text-slate-500">{formatBytes(item.size)} · {item.contentType || 'Tipo desconocido'}</p><p className="mt-2 break-all text-[10px] leading-4 text-slate-600">{item.path}</p><div className="mt-4 flex gap-2"><Button size="small" variant="secondary" className="flex-1" onClick={() => copyPath(item.path)}>Copiar ruta</Button><Button size="small" variant="danger" onClick={() => handleDelete(item)}>Eliminar</Button></div></div></article>)}</div>}
      </Panel>
      <p className="mt-4 text-xs leading-5 text-slate-500">Formato permitido: JPEG, PNG, WebP, AVIF y GIF. Límite por archivo: 8 MB. Cuando reemplaces una imagen en el perfil o proyecto, actualiza primero la referencia y luego elimina el archivo anterior.</p>
    </>
  );
}
