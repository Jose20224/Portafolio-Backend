import { useEffect } from 'react';

export const inputClass = 'w-full rounded-xl border border-white/10 bg-[#111722] px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-400/10';
export const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400';

export function PageHeading({ eyebrow = 'ADMINISTRACIÓN', title, description, action }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-[11px] font-semibold tracking-[0.22em] text-blue-300">{eyebrow}</p>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, description, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-[#111722] p-5 shadow-lg shadow-black/10 sm:p-6 ${className}`}>
      {(title || description || action) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h2 className="text-base font-semibold text-white">{title}</h2>}
            {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Button({ children, variant = 'primary', size = 'normal', className = '', type = 'button', disabled = false, onClick }) {
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-400 disabled:bg-blue-500/40',
    secondary: 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 disabled:opacity-40',
    danger: 'border border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 disabled:opacity-40',
    ghost: 'text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-40',
  };
  const sizes = size === 'small' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition ${variants[variant]} ${sizes} ${className}`}>
      {children}
    </button>
  );
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className={labelClass}>{label}</label>}
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Notice({ children, variant = 'error', onClose }) {
  const styles = variant === 'success'
    ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
    : variant === 'info'
      ? 'border-blue-400/20 bg-blue-400/10 text-blue-100'
      : 'border-rose-400/20 bg-rose-400/10 text-rose-200';
  return (
    <div role="alert" className={`mb-5 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <span>{children}</span>
      {onClose && <button type="button" aria-label="Cerrar aviso" onClick={onClose} className="text-current opacity-70 hover:opacity-100">×</button>}
    </div>
  );
}

export function Loading({ label = 'Cargando…' }) {
  return <div className="flex items-center justify-center gap-3 py-14 text-sm text-slate-400"><span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />{label}</div>;
}

export function EmptyState({ title = 'No hay registros', description = 'Cuando agregues información, aparecerá aquí.' }) {
  return <div className="rounded-xl border border-dashed border-white/10 px-5 py-10 text-center"><p className="font-medium text-slate-300">{title}</p><p className="mt-1 text-sm text-slate-500">{description}</p></div>;
}

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0d131d] p-5 shadow-2xl sm:rounded-2xl sm:p-6 ${wide ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-white/10 hover:text-white">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatCard({ label, value, icon, detail }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111722] p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <span className="material-symbols-outlined text-xl text-blue-300">{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-white">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}
