import { useEffect, useState } from 'react';
import { getAdminProfile, updateAdminProfile } from '../../services/api/adminPortfolio';
import { uploadPortfolioImage } from '../../services/api/storage';
import { useAdminAuth } from '../AdminAuthContext';
import { Button, Field, inputClass, Loading, Notice, PageHeading, Panel } from '../AdminUI';

const blankProfile = {
  full_name: '', professional_title: '', hero_badge_text: '', hero_description: '', hero_image_path: '',
  about_paragraphs: '', strengths: '', location: '', work_mode: 'flexible', contact_email: '',
  availability_status: 'open_to_opportunities', is_public: false,
};

function linesToArray(value) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean);
}

export default function AdminProfile() {
  const { runAdminRequest } = useAdminAuth();
  const [form, setForm] = useState(blankProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [heroPreview, setHeroPreview] = useState('');

  useEffect(() => {
    let active = true;
    runAdminRequest((options) => getAdminProfile(options))
      .then((profile) => {
        if (!active) return;
        setForm({
          ...blankProfile,
          ...profile,
          hero_image_path: profile.hero_image_path || '',
          contact_email: profile.contact_email || '',
          location: profile.location || '',
          about_paragraphs: (profile.about_paragraphs || []).join('\n'),
          strengths: (profile.strengths || []).join('\n'),
        });
      })
      .catch((requestError) => { if (active) setError(requestError?.message || 'No fue posible cargar el perfil.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [runAdminRequest]);

  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleUpload = async (file) => {
    setError('');
    setSuccess('');
    setUploading(true);
    try {
      const result = await runAdminRequest(({ token }) => uploadPortfolioImage(file, { area: 'profile', token }));
      change('hero_image_path', result.path);
      setHeroPreview(result.publicUrl || '');
      setSuccess('Imagen cargada. Guarda el perfil para aplicar el cambio.');
    } catch (requestError) {
      setError(requestError?.message || 'No fue posible cargar la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      professional_title: form.professional_title.trim(),
      hero_badge_text: form.hero_badge_text.trim(),
      hero_description: form.hero_description.trim(),
      hero_image_path: form.hero_image_path || null,
      about_paragraphs: linesToArray(form.about_paragraphs),
      strengths: linesToArray(form.strengths),
      location: form.location.trim() || null,
      work_mode: form.work_mode,
      contact_email: form.contact_email.trim() || null,
      availability_status: form.availability_status,
      is_public: Boolean(form.is_public),
    };
    try {
      await runAdminRequest((options) => updateAdminProfile(payload, options));
      setSuccess('Perfil actualizado correctamente.');
    } catch (requestError) {
      setError(requestError?.message || 'No fue posible guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Cargando perfil…" />;

  return (
    <>
      <PageHeading title="Mi perfil" description="Administra la información que se muestra en la portada y en la sección «Sobre mí»." />
      {error && <Notice>{error}</Notice>}
      {success && <Notice variant="success" onClose={() => setSuccess('')}>{success}</Notice>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Panel title="Información principal" description="Datos que identifican tu perfil profesional.">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Nombre completo"><input required maxLength={160} className={inputClass} value={form.full_name} onChange={(event) => change('full_name', event.target.value)} /></Field>
            <Field label="Título profesional"><input required maxLength={160} className={inputClass} value={form.professional_title} onChange={(event) => change('professional_title', event.target.value)} /></Field>
            <Field label="Texto de disponibilidad"><input maxLength={160} className={inputClass} value={form.hero_badge_text} onChange={(event) => change('hero_badge_text', event.target.value)} /></Field>
            <Field label="Correo de contacto"><input type="email" maxLength={254} className={inputClass} value={form.contact_email} onChange={(event) => change('contact_email', event.target.value)} /></Field>
            <Field label="Ubicación"><input maxLength={120} className={inputClass} value={form.location} onChange={(event) => change('location', event.target.value)} placeholder="Ej. Managua, Nicaragua" /></Field>
            <Field label="Modalidad de trabajo"><select className={inputClass} value={form.work_mode} onChange={(event) => change('work_mode', event.target.value)}><option value="remote">Remoto</option><option value="hybrid">Híbrido</option><option value="onsite">Presencial</option><option value="flexible">Flexible</option></select></Field>
            <Field label="Estado profesional"><select className={inputClass} value={form.availability_status} onChange={(event) => change('availability_status', event.target.value)}><option value="available">Disponible</option><option value="open_to_opportunities">Abierto a oportunidades</option><option value="not_available">No disponible</option></select></Field>
          </div>
          <div className="mt-5"><Field label="Descripción principal"><textarea required maxLength={2000} rows={4} className={inputClass} value={form.hero_description} onChange={(event) => change('hero_description', event.target.value)} /></Field></div>
        </Panel>

        <Panel title="Imagen principal" description="El archivo se carga en la carpeta profile del bucket portfolio-media.">
          <div className="grid gap-5 md:grid-cols-[1fr_180px] md:items-center">
            <div><Field label="Ruta de imagen"><input readOnly className={`${inputClass} opacity-70`} value={form.hero_image_path} placeholder="Aún no hay imagen seleccionada" /></Field><label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10">{uploading ? 'Cargando imagen…' : 'Seleccionar imagen'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="sr-only" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) handleUpload(file); event.target.value = ''; }} /></label><p className="mt-2 text-xs text-slate-500">JPEG, PNG, WebP, AVIF o GIF · máximo 8 MB.</p></div>
            <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f17]">{heroPreview ? <img src={heroPreview} alt="Vista previa del perfil" className="h-full w-full object-cover" /> : <span className="material-symbols-outlined text-4xl text-slate-700">person</span>}</div>
          </div>
        </Panel>

        <Panel title="Sobre mí y fortalezas" description="Escribe un elemento por línea. Cada línea se guarda como un elemento independiente.">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Párrafos de presentación"><textarea rows={7} className={inputClass} value={form.about_paragraphs} onChange={(event) => change('about_paragraphs', event.target.value)} placeholder="Primer párrafo…\nSegundo párrafo…" /></Field>
            <Field label="Fortalezas"><textarea rows={7} className={inputClass} value={form.strengths} onChange={(event) => change('strengths', event.target.value)} placeholder="Código limpio\nTrabajo en equipo" /></Field>
          </div>
        </Panel>

        <Panel title="Visibilidad pública" description="Cuando está desactivada, el endpoint público no devuelve el perfil y los visitantes no podrán consultarlo.">
          <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={Boolean(form.is_public)} onChange={(event) => change('is_public', event.target.checked)} className="h-4 w-4 accent-blue-500" /><span className="text-sm text-slate-200">Publicar mi perfil en el sitio</span></label>
        </Panel>
        <div className="flex justify-end"><Button type="submit" disabled={saving || uploading}>{saving ? 'Guardando…' : 'Guardar cambios'}<span className="material-symbols-outlined text-base">save</span></Button></div>
      </form>
    </>
  );
}
