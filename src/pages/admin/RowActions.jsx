import { ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

const btn = 'tap p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background disabled:opacity-30 disabled:pointer-events-none';

export default function RowActions({ onUp, onDown, onEdit, onDelete, canUp = true, canDown = true }) {
  const { t } = useLang();
  return (
    <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
      <button type="button" className={btn} onClick={onUp} disabled={!canUp} aria-label={t('moveUp')}><ChevronUp className="w-4 h-4" /></button>
      <button type="button" className={btn} onClick={onDown} disabled={!canDown} aria-label={t('moveDown')}><ChevronDown className="w-4 h-4" /></button>
      <button type="button" className={btn} onClick={onEdit} aria-label={t('edit')}><Pencil className="w-4 h-4" /></button>
      <button type="button" className={`${btn} hover:text-destructive`} onClick={onDelete} aria-label={t('delete')}><Trash2 className="w-4 h-4" /></button>
    </div>
  );
}
