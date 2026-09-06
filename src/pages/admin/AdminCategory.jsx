import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { slugify, uniqueKey } from '@/lib/slug';
import RefFormModal from './RefFormModal';
import { AdminCrumbs, AdminRow, nextOrder } from './adminShared';
import { Button, Name } from '@/components/ui';

export default function AdminCategory() {
  const { catKey } = useParams();
  const { t, name } = useLang();
  const { idx, saveRef } = useData();
  const cat = idx.cat[decodeURIComponent(catKey)];
  const [form, setForm] = useState(null); // {kind:'category'|'section'|'book', row}

  if (!cat) return <div className="text-center py-20 text-muted-foreground">{t('notFound')}</div>;
  const sections = idx.sectionsOf(cat.key);
  const bookForm = (row) => setForm({ kind: 'book', row });

  const catFields = [
    { name: 'name_he', label: t('nameHe'), type: 'text', required: true, dir: 'rtl' },
    { name: 'name_en', label: t('nameEn'), type: 'text', required: true, dir: 'ltr' },
    { name: 'leaf_type', label: t('leafType'), type: 'select', options: [{ value: 'perek', label: t('perek') }, { value: 'daf', label: t('daf') }] },
    { name: 'has_sections', label: t('hasSections'), type: 'checkbox' },
    { name: 'key', label: t('key'), type: 'readonly', hint: t('keyHint') },
  ];
  const secFields = [
    { name: 'name_he', label: t('nameHe'), type: 'text', required: true, dir: 'rtl' },
    { name: 'name_en', label: t('nameEn'), type: 'text', required: true, dir: 'ltr' },
    ...(form?.row?.key ? [{ name: 'key', label: t('key'), type: 'readonly', hint: t('keyHint') }] : []),
  ];
  const bookFields = [
    { name: 'name_he', label: t('nameHe'), type: 'text', required: true, dir: 'rtl' },
    { name: 'name_en', label: t('nameEn'), type: 'text', required: true, dir: 'ltr' },
    ...(cat.has_sections ? [{ name: 'section_key', label: t('section'), type: 'select', options: [{ value: '', label: t('noSection') }, ...sections.map((s) => ({ value: s.key, label: name(s) }))] }] : []),
    { name: 'track_mode', label: t('trackMode'), type: 'select', options: [{ value: 'items', label: t('modeItems') }, { value: 'parshiyot', label: t('modeParshiyot') }] },
    { name: 'item_count', label: t('itemCount'), type: 'number', min: 0, hint: t('itemCountHint') },
    { name: 'first_item', label: t('firstItem'), type: 'number', min: 0 },
    ...(form?.row?.key ? [{ name: 'key', label: t('key'), type: 'readonly', hint: t('keyHint') }] : []),
  ];

  const save = async (v) => {
    if (form.kind === 'category') return saveRef('categories', { ...v, has_sections: !!v.has_sections });
    if (form.kind === 'section') {
      const row = { ...v, category_key: cat.key };
      if (!row.key) { row.key = uniqueKey(slugify(v.name_en), idx.sections.map((s) => s.key)); row.sort_order = nextOrder(sections); }
      return saveRef('sections', row);
    }
    const row = { ...v, category_key: cat.key, section_key: cat.has_sections ? (v.section_key || '') : '', item_count: Number(v.item_count) || 0, first_item: Number(v.first_item) || 1 };
    if (!row.key) { row.key = uniqueKey(`${cat.key}-${slugify(v.name_en)}`, idx.books.map((b) => b.key)); row.sort_order = nextOrder(idx.booksOf(cat.key, row.section_key)); }
    return saveRef('books', row);
  };

  const BookList = ({ secKey }) => {
    const books = idx.booksOf(cat.key, secKey);
    return (
      <div className="space-y-2">
        {books.map((b, i) => (
          <AdminRow key={b.key} row={b} table="books" to={`/admin/b/${encodeURIComponent(b.key)}`} index={i} count={books.length}
            badge={b.track_mode === 'parshiyot' ? t('parshiyot') : null}
            subtitle={b.track_mode === 'parshiyot' ? `${idx.parshiyotOf(b.key).length} ${t('parshiyot')}` : `${b.first_item || 1}–${b.item_count}`}
            onEdit={() => bookForm(b)} />
        ))}
        {books.length === 0 && <div className="text-sm text-muted-foreground px-2 py-1">{t('noItems')}</div>}
      </div>
    );
  };
  const newBook = (secKey) => ({ section_key: secKey || '', track_mode: 'items', item_count: 1, first_item: cat.leaf_type === 'daf' ? 2 : 1 });

  return (
    <div className="pt-1">
      <AdminCrumbs items={[{ label: name(cat) }]} />
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-3xl font-display font-extrabold leading-tight"><Name>{name(cat)}</Name></h1>
          <div className="text-xs text-muted-foreground mt-1"><bdi>{cat.name_he}</bdi> · <bdi>{cat.name_en}</bdi> · {cat.leaf_type === 'daf' ? t('daf') : t('perek')}</div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setForm({ kind: 'category', row: cat })}><Pencil className="w-4 h-4" />{t('edit')}</Button>
      </div>

      {cat.has_sections ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-display font-bold">{t('sections')}</h2>
            <Button size="sm" variant="soft" onClick={() => setForm({ kind: 'section', row: {} })}><Plus className="w-4 h-4" />{t('addSection')}</Button>
          </div>
          <div className="space-y-5">
            {sections.map((s, i) => (
              <div key={s.key}>
                <AdminRow row={s} table="sections" index={i} count={sections.length} subtitle={`${idx.booksOf(cat.key, s.key).length} ${t('books')}`} onEdit={() => setForm({ kind: 'section', row: s })} />
                <div className="ms-4 mt-2 space-y-2 border-s-2 border-border ps-3">
                  <BookList secKey={s.key} />
                  <Button size="sm" variant="ghost" onClick={() => bookForm(newBook(s.key))}><Plus className="w-4 h-4" />{t('addBook')}</Button>
                </div>
              </div>
            ))}
            {idx.booksOf(cat.key, '').length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">{t('noSection')}</div>
                <BookList secKey="" />
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-display font-bold">{t('books')}</h2>
            <Button size="sm" variant="soft" onClick={() => bookForm(newBook(''))}><Plus className="w-4 h-4" />{t('addBook')}</Button>
          </div>
          <BookList secKey="" />
        </>
      )}

      <RefFormModal open={!!form} onClose={() => setForm(null)} initial={form?.row} onSave={save}
        title={form?.kind === 'category' ? t('editCategory') : form?.kind === 'section' ? (form.row?.key ? t('editSection') : t('addSection')) : (form?.row?.key ? t('editBook') : t('addBook'))}
        fields={form?.kind === 'category' ? catFields : form?.kind === 'section' ? secFields : bookFields} />
    </div>
  );
}
