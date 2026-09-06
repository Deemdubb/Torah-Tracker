import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function Modal({ open, title, subtitle, onClose, children, footer }) {
  const { dir, t } = useLang();
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose} dir={dir}>
      <div
        role="dialog" aria-modal="true"
        className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card border border-border shadow-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1 min-w-0">
            {title && <h2 className="text-2xl font-display font-bold leading-tight">{title}</h2>}
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label={t('close')} className="tap p-2 -m-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-background">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">{children}</div>
        {footer && <div className="flex flex-wrap gap-2 mt-6">{footer}</div>}
      </div>
    </div>
  );
}
