import React from 'react';
import { useLang } from '@/lib/LanguageContext';

const OPTIONS = [
  { mode: 'he', label: 'עב', title: 'עברית' },
  { mode: 'en-he', label: 'EN·עב', title: 'English · Hebrew titles' },
  { mode: 'en', label: 'EN', title: 'English' },
];

export default function LanguageToggle() {
  const { mode, setMode } = useLang();
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-card border border-border text-xs font-semibold" role="group" aria-label="Language">
      {OPTIONS.map((o) => (
        <button
          key={o.mode}
          type="button"
          onClick={() => setMode(o.mode)}
          title={o.title}
          className={`px-2 py-1 rounded-lg transition ${
            mode === o.mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
