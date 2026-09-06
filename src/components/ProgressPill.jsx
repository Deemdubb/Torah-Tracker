import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProgressRing from './ProgressRing';
import { Name } from './ui';
import { useLang } from '@/lib/LanguageContext';

export default function ProgressPill({ name, path, total, completed, cycles = 0, subtitle }) {
  const { dir, t } = useLang();
  const percent = total ? (completed / total) * 100 : 0;
  const Chevron = dir === 'rtl' ? ChevronLeft : ChevronRight;
  return (
    <Link to={path} className="tap group flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card border border-border hover:border-primary/40 active:bg-card/70 transition-all">
      <div className="flex-1 text-start min-w-0">
        <div className="text-lg font-display font-semibold leading-tight truncate">
          <Name>{name}</Name>
          {cycles > 0 && <span className="ms-2 align-middle text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary tabular-nums" title={`${cycles} ${t('timesFull')}`}>×{cycles}</span>}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
          {subtitle ? subtitle : <>{completed} / {total} · {Math.round(percent)}%</>}
        </div>
      </div>
      <ProgressRing percent={percent} />
      <Chevron className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary transition shrink-0" />
    </Link>
  );
}
