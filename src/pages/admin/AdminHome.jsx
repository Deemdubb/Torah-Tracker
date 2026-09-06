import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ListOrdered, Database } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { slugify, uniqueKey } from '@/lib/slug';
import RefFormModal from './RefFormModal';
import { AdminRow, nextOrder } from './adminShared';
import { Banner, Button, Card } from '@/components/ui';

export default function AdminHome() {
  const { t } = useLang();
  const { idx, saveRef, resetDefaults, setError } = useData();
  const [editing, setEditing] = useState(null); // null | {} (new) | row

  const fields = [
    { name: 'name_he', label: t('nameHe'), type: 'text', required: true, dir: 'rtl' },
    { name: 'name_en', label: t('nameEn'), type: 'text', required: true, dir: 'ltr' },
    { name: 'leaf_type', label: t('leafType'), type: 'select', options: [{ value: 'perek', label: t('perek') }, { value: 'daf', label: t('daf') }] },
    { name: 'has_sections', label: t('hasSections'), type: 'checkbox' },
    ...(editing?.key ? [{ name: 'key', label: t('key'), type: 'readonly', hint: t('keyHint') }] : []),
  ];

  const save = async (v) => {
    const row = { ...v, has_sections: !!v.has_sections };
    if (!row.key) { row.key = uniqueKey(slugify(v.name_en), idx.categories.map((c) => c.key)); row.sort_order = nextOrder(idx.categories); }
    await saveRef('categories', row);
  };

  return (
    <div className="pt-1">
      <h1 className="text-3xl font-display font-extrabold mb-1">{t('adminTitle')}</h1>
      <p className="text-sm text-muted-foreground mb-5">{t('adminSubtitle')}</p>

      <div className="grid grid-cols-2 gap-2 mb-6">
        <Link to="/admin/aliyot"><Card className="p-3 h-full flex items-center gap-2 hover:border-primary/40 tap"><ListOrdered className="w-4 h-4 text-primary shrink-0" /><span className="text-sm font-medium">{t('aliyahNames')}</span></Card></Link>
        <Link to="/admin/tools"><Card className="p-3 h-full flex items-center gap-2 hover:border-primary/40 tap"><Database className="w-4 h-4 text-primary shrink-0" /><span className="text-sm font-medium">{t('dataTools')}</span></Card></Link>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-display font-bold">{t('categories')}</h2>
        <Button size="sm" variant="soft" onClick={() => setEditing({ leaf_type: 'perek', has_sections: true })}><Plus className="w-4 h-4" />{t('addCategory')}</Button>
      </div>
      {idx.categories.length === 0 && (
        <Banner><div className="flex flex-wrap items-center gap-2"><span className="flex-1">{t('emptyLists')}</span><Button size="sm" onClick={() => resetDefaults().catch((e) => setError(e.message))}>{t('loadDefaults')}</Button></div></Banner>
      )}
      <div className="space-y-2">
        {idx.categories.map((c, i) => (
          <AdminRow key={c.key} row={c} table="categories" to={`/admin/c/${encodeURIComponent(c.key)}`} index={i} count={idx.categories.length}
            badge={c.leaf_type === 'daf' ? t('daf') : null}
            subtitle={`${idx.booksOfCategory(c.key).length} ${t('books')}`} onEdit={() => setEditing(c)} />
        ))}
      </div>
      <RefFormModal open={!!editing} title={editing?.key ? t('editCategory') : t('addCategory')} fields={fields} initial={editing} onSave={save} onClose={() => setEditing(null)} />
    </div>
  );
}
