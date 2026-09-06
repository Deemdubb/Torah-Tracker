import { useLang } from '@/lib/LanguageContext';
import { LANG_MODES } from '@/lib/i18n';

export default function LanguageToggle({ size = 'sm' }) {
  const { mode, setMode, t } = useLang();
  const pad = size === 'lg' ? 'px-4 py-2 text-sm' : 'px-2 py-1 text-xs';
  return (
    <div role="group" aria-label={t('language')} className="inline-flex items-center gap-0.5 p-0.5 rounded-xl bg-card border border-border font-semibold" dir="ltr">
      {LANG_MODES.map((o) => (
        <button key={o.mode} type="button" onClick={() => setMode(o.mode)} title={o.title} aria-pressed={mode === o.mode}
          className={`tap ${pad} rounded-lg transition ${mode === o.mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
