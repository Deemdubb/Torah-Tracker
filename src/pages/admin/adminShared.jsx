import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useData } from '@/contexts/DataContext';
import RowActions from './RowActions';
import { Name } from '@/components/ui';

export const nextOrder = (list) => list.reduce((m, x) => Math.max(m, Number(x.sort_order) || 0), 0) + 1;

// A list row inside the admin screens, with optional link and up/down/edit/delete actions.
export function AdminRow({ row, table, to, subtitle, onEdit, index, count, badge }) {
  const { name, t, dir } = useLang();
  const { reorder, removeRef, setError } = useData();
  const Chevron = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const guard = (fn) => () => fn().catch((e) => setError(e.message || String(e)));
  const inner = (
    <>
      <div className="flex-1 min-w-0 text-start">
        <div className="font-display font-semibold text-lg leading-tight truncate"><Name>{name(row)}</Name>{badge && <span className="ms-2 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-primary/15 text-primary align-middle">{badge}</span>}</div>
        <div className="text-xs text-muted-foreground truncate"><bdi>{row.name_he}</bdi> · <bdi>{row.name_en}</bdi>{subtitle ? ` · ${subtitle}` : ''}</div>
      </div>
      {to && <Chevron className="w-4 h-4 text-muted-foreground/60 shrink-0" />}
    </>
  );
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-card border border-border">
      {to ? <Link to={to} className="tap flex-1 flex items-center gap-2 min-w-0">{inner}</Link> : <div className="flex-1 flex items-center gap-2 min-w-0">{inner}</div>}
      <RowActions
        canUp={index > 0} canDown={index < count - 1}
        onUp={guard(() => reorder(table, row, -1))} onDown={guard(() => reorder(table, row, 1))}
        onEdit={onEdit}
        onDelete={() => { if (window.confirm(t('deleteConfirm'))) guard(() => removeRef(table, row.key))(); }}
      />
    </div>
  );
}

export function AdminCrumbs({ items = [] }) {
  const { t, dir } = useLang();
  const Arrow = dir === 'rtl' ? ChevronLeft : ChevronRight;
  return (
    <nav className="flex items-center gap-1 mb-4 text-sm text-muted-foreground overflow-x-auto no-scrollbar whitespace-nowrap">
      <Link to="/admin" className="tap hover:text-foreground py-1">{t('adminTitle')}</Link>
      {items.map((it, i) => <span key={i} className="flex items-center gap-1"><Arrow className="w-3.5 h-3.5 opacity-50" />{it.to ? <Link to={it.to} className="tap hover:text-foreground py-1"><Name>{it.label}</Name></Link> : <span className="text-foreground"><Name>{it.label}</Name></span>}</span>)}
    </nav>
  );
}
