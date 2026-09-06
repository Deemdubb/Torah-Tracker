import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProgressRing from '@/components/ProgressRing';
import { useLang } from '@/lib/LanguageContext';

export default function ProgressPill({ name, path, total, completed }) {
  const { dir } = useLang();
  const percent = total ? (completed / total) * 100 : 0;
  const Chevron = dir === 'rtl' ? ChevronLeft : ChevronRight;
  return (
    <Link
      to={path}
      className="group flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-card/80 transition-all"
    >
      <div className="flex-1 text-start min-w-0">
        <div className="text-lg font-display font-semibold leading-tight truncate">{name}</div>
        <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
          {completed} / {total} · {Math.round(percent)}%
        </div>
      </div>
      <ProgressRing percent={percent} />
      <Chevron className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary transition shrink-0" />
    </Link>
  );
}
