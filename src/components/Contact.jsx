import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { submitContactMessage } from '../services/api/contact';

const initialForm = { name: '', email: '', subject: '', message: '', website: '' };

export default function Contact() {
  const [formData, setFormData] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const formStartedAt = useRef(Date.now());

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSending(true);
    try {
      await submitContactMessage({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        website: formData.website,
        formStartedAt: formStartedAt.current,
      });
      setSubmitted(true);
      setFormData(initialForm);
      formStartedAt.current = Date.now();
    } catch (requestError) {
      setError(requestError?.message || 'No fue posible enviar el mensaje. Inténtalo nuevamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="relative bg-surface-container-lowest/50 py-20 md:py-28">
      <div className="mx-auto max-w-[1120px] px-4 md:px-10">
        <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="mb-16 flex flex-col items-center space-y-3 text-center">
          <span className="rounded-full border border-primary/20 bg-primary-container/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary font-geist">Hablemos</span>
          <h2 className="font-inter text-3xl font-bold tracking-tight text-on-surface md:text-4xl">Contacto</h2>
          <div className="mt-2 h-1 w-12 rounded-full bg-primary" />
          <p className="max-w-xl pt-2 font-inter text-sm text-on-surface-variant md:text-base">¿Tienes un proyecto en mente, una oportunidad laboral o simplemente quieres saludar? Escríbeme y te responderé lo antes posible.</p>
        </motion.div>

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          <motion.div initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="lg:col-span-5">
            <div className="glass-card space-y-6 rounded-3xl border border-outline-variant/30 p-6 shadow-xl md:p-8">
              <h3 className="font-inter text-xl font-bold text-on-surface">Información de Contacto</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4"><div className="shrink-0 rounded-2xl bg-primary-container/30 p-3 text-primary"><span className="material-symbols-outlined text-2xl">mail</span></div><div><p className="font-geist text-xs text-on-surface-variant">Correo Electrónico</p><a href="mailto:tu-correo@example.com" className="font-inter text-sm font-semibold text-on-surface transition-colors hover:text-primary">tu-correo@example.com</a></div></div>
                <div className="flex items-start gap-4"><div className="shrink-0 rounded-2xl bg-primary-container/30 p-3 text-primary"><span className="material-symbols-outlined text-2xl">location_on</span></div><div><p className="font-geist text-xs text-on-surface-variant">Ubicación, Nicaragua</p><p className="font-inter text-sm font-semibold text-on-surface">Disponible para trabajo Remoto / Híbrido / Presencial</p></div></div>
                <div className="flex items-start gap-4"><div className="shrink-0 rounded-2xl bg-primary-container/30 p-3 text-primary"><span className="material-symbols-outlined text-2xl">work_history</span></div><div><p className="font-geist text-xs text-on-surface-variant">Estado actual</p><p className="font-inter text-sm font-semibold text-emerald-400">Abierto a nuevas ofertas profesionales</p></div></div>
              </div>
              <div className="border-t border-outline-variant/20 pt-4"><p className="mb-3 font-geist text-xs text-on-surface-variant">Redes Profesionales</p><div className="flex items-center gap-3"><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-surface-container-high px-3 py-2.5 font-geist text-xs text-on-surface transition-colors hover:bg-surface-container-highest hover:text-primary"><span className="material-symbols-outlined text-base">code</span>GitHub</a><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-surface-container-high px-3 py-2.5 font-geist text-xs text-on-surface transition-colors hover:bg-surface-container-highest hover:text-primary"><span className="material-symbols-outlined text-base">work</span>LinkedIn</a></div></div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }} className="lg:col-span-7">
            <div className="glass-card rounded-3xl border border-outline-variant/30 p-6 shadow-xl md:p-8">
              {submitted ? (
                <div className="space-y-4 py-12 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"><span className="material-symbols-outlined text-3xl">check_circle</span></div><h3 className="font-inter text-2xl font-bold text-on-surface">¡Mensaje recibido!</h3><p className="mx-auto max-w-md font-inter text-sm text-on-surface-variant">Gracias por ponerte en contacto. Tu mensaje quedó registrado y te responderé lo antes posible.</p><button type="button" onClick={() => setSubmitted(false)} className="mt-2 rounded-xl border border-outline-variant/40 px-4 py-2 text-sm text-primary transition hover:bg-surface-container-high">Enviar otro mensaje</button></div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="mb-4 font-inter text-xl font-bold text-on-surface">Envíame un mensaje</h3>
                  {error && <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
                  <div className="space-y-2"><label htmlFor="contact-name" className="block font-geist text-xs font-medium uppercase tracking-wider text-on-surface-variant">Tu Nombre</label><input id="contact-name" type="text" name="name" required minLength={2} maxLength={100} value={formData.name} onChange={handleChange} placeholder="Ej. Juan Pérez" className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high/60 px-4 py-3 font-inter text-sm text-on-surface transition-colors focus:border-primary focus:outline-none" /></div>
                  <div className="space-y-2"><label htmlFor="contact-email" className="block font-geist text-xs font-medium uppercase tracking-wider text-on-surface-variant">Tu Correo Electrónico</label><input id="contact-email" type="email" name="email" required maxLength={254} value={formData.email} onChange={handleChange} placeholder="ejemplo@correo.com" className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high/60 px-4 py-3 font-inter text-sm text-on-surface transition-colors focus:border-primary focus:outline-none" /></div>
                  <div className="space-y-2"><label htmlFor="contact-subject" className="block font-geist text-xs font-medium uppercase tracking-wider text-on-surface-variant">Asunto <span className="normal-case tracking-normal text-slate-500">(opcional)</span></label><input id="contact-subject" type="text" name="subject" maxLength={150} value={formData.subject} onChange={handleChange} placeholder="Motivo de tu mensaje" className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high/60 px-4 py-3 font-inter text-sm text-on-surface transition-colors focus:border-primary focus:outline-none" /></div>
                  <div className="space-y-2"><label htmlFor="contact-message" className="block font-geist text-xs font-medium uppercase tracking-wider text-on-surface-variant">Mensaje</label><textarea id="contact-message" name="message" rows={4} required minLength={10} maxLength={5000} value={formData.message} onChange={handleChange} placeholder="Cuéntame sobre tu proyecto o propuesta…" className="w-full resize-none rounded-xl border border-outline-variant/30 bg-surface-container-high/60 px-4 py-3 font-inter text-sm text-on-surface transition-colors focus:border-primary focus:outline-none" /></div>
                  <div className="hidden" aria-hidden="true"><label htmlFor="contact-website">No completar</label><input id="contact-website" type="text" name="website" tabIndex={-1} autoComplete="off" value={formData.website} onChange={handleChange} /></div>
                  <button type="submit" disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container py-3.5 font-geist text-sm font-medium uppercase tracking-wider text-on-primary-container shadow-lg transition-all duration-200 hover:bg-primary-container/80 disabled:cursor-not-allowed disabled:opacity-60">{sending ? 'Enviando…' : 'Enviar Mensaje'}<span className="material-symbols-outlined text-lg">{sending ? 'hourglass_top' : 'send'}</span></button>
                  <p className="text-center text-[11px] text-on-surface-variant/70">Tu información se utilizará únicamente para responder a tu consulta.</p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
