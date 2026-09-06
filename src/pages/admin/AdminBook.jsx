import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { slugify, uniqueKey } from '@/lib/slug';
import { bookItems } from '@/lib/model';
import RefFormModal from './RefFormModal';
import { AdminCrumbs, AdminRow, nextOrder } from './adminShared';
import { Button, Card, Name } from '@/components/ui';

export default function AdminBook() {
  const { bookKey } = useParams();
  const { t, name, rangeLabel } = useLang();
  const { idx, saveRef } = useData();
  const book = idx.book[decodeURIComponent(bookKey)];
  const [form, setForm] = useState(null); // {kind:'book'|'parashah', row}

  if (!book) return <div className="text-center py-20 text-muted-foreground">{t('notFound')}</div>;
  const cat = idx.cat[book.category_key];
  const sec = idx.sec[book.section_key];
  const sections = cat ? idx.sectionsOf(cat.key) : [];
  const parshiyot = idx.parshiyotOf(book.key);
  const studyAliyot = idx.studyAliyot;

  const bookFields = [
    { name: 'name_he', label: t('nameHe'), type: 'text', required: true, dir: 'rtl' },
    { name: 'name_en', label: t('nameEn'), type: 'text', required: true, dir: 'ltr' },
    ...(cat?.has_sections ? [{ name: 'section_key', label: t('section'), type: 'select', options: [{ value: '', label: t('noSection') }, ...sections.map((s) => ({ value: s.key, label: name(s) }))] }] : []),
    { name: 'track_mode', label: t('trackMode'), type: 'select', options: [{ value: 'items', label: t('modeItems') }, { value: 'parshiyot', label: t('modeParshiyot') }] },
    { name: 'item_count', label: t('itemCount'), type: 'number', min: 0, hint: t('itemCountHint') },
    { name: 'first_item', label: t('firstItem'), type: 'number', min: 0 },
    { name: 'key', label: t('key'), type: 'readonly', hint: t('keyHint') },
  ];
  const parFields = [
    { name: 'name_he', label: t('nameHe'), type: 'text', required: true, dir: 'rtl' },
    { name: 'name_en', label: t('nameEn'), type: 'text', required: true, dir: 'ltr' },
    { name: 'aliyah_ranges', label: t('aliyahRanges'), type: 'ranges', aliyot: studyAliyot },
    ...(form?.row?.key ? [{ name: 'key', label: t('key'), type: 'readonly', hint: t('keyHint') }] : []),
  ];

  const save = async (v) => {
    if (form.kind === 'book') return saveRef('books', { ...v, section_key: cat?.has_sections ? (v.section_key || '') : '', item_count: Number(v.item_count) || 0, first_item: Number(v.first_item) || 1 });
    const ranges = (v.aliyah_ranges || []).map((r) => [Number(r?.[0]) || 1, Number(r?.[1]) || Number(r?.[0]) || 1]);
    const row = { ...v, book_key: book.key, aliyah_ranges: ranges };
    if (!row.key) { row.key = uniqueKey(slugify(v.name_en), idx.parshiyot.map((p) => p.key)); row.sort_order = nextOrder(parshiyot); }
    return saveRef('parshiyot', row);
  };

  return (
    <div className="pt-1">
      <AdminCrumbs items={[cat && { label: name(cat), to: `/admin/c/${encodeURIComponent(cat.key)}` }, { label: name(book) }].filter(Boolean)} />
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold leading-tight"><Name>{name(book)}</Name></h1>
          <div className="text-xs text-muted-foreground mt-1"><bdi>{book.name_he}</bdi> · <bdi>{book.name_en}</bdi>{sec ? <> · <Name>{name(sec)}</Name></> : null}</div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setForm({ kind: 'book', row: book })}><Pencil className="w-4 h-4" />{t('edit')}</Button>
      </div>

      <Card className="p-3 mb-5 text-sm grid grid-cols-2 gap-2">
        <div><div className="text-xs text-muted-foreground">{t('trackMode')}</div><div>{book.track_mode === 'parshiyot' ? t('modeParshiyot') : t('modeItems')}</div></div>
        <div><div className="text-xs text-muted-foreground">{t('total')}</div><div>{book.track_mode === 'parshiyot' ? `${parshiyot.length} × ${studyAliyot.length} = ${parshiyot.length * studyAliyot.length}` : `${bookItems(book).length} ${t('items')} (${book.first_item || 1}–${book.item_count})`}</div></div>
      </Card>

      {book.track_mode === 'parshiyot' && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-display font-bold">{t('parshiyot')}</h2>
            <Button size="sm" variant="soft" onClick={() => setForm({ kind: 'parashah', row: { aliyah_ranges: studyAliyot.map(() => [1, 1]) } })}><Plus className="w-4 h-4" />{t('addParashah')}</Button>
          </div>
          <div className="space-y-2">
            {parshiyot.map((p, i) => (
              <AdminRow key={p.key} row={p} table="parshiyot" index={i} count={parshiyot.length}
                subtitle={p.aliyah_ranges?.length ? rangeLabel(p.aliyah_ranges[0]?.[0], p.aliyah_ranges[p.aliyah_ranges.length - 1]?.[1]) : ''}
                onEdit={() => setForm({ kind: 'parashah', row: p })} />
            ))}
            {parshiyot.length === 0 && <div className="text-sm text-muted-foreground px-2 py-1">{t('noItems')}</div>}
          </div>
        </>
      )}

      <RefFormModal open={!!form} onClose={() => setForm(null)} initial={form?.row} onSave={save}
        title={form?.kind === 'book' ? t('editBook') : (form?.row?.key ? t('editParashah') : t('addParashah'))}
        fields={form?.kind === 'book' ? bookFields : parFields} />
    </div>
  );
}
