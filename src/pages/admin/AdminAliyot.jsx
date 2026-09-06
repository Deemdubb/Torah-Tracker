import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { slugify, uniqueKey } from '@/lib/slug';
import RefFormModal from './RefFormModal';
import { AdminCrumbs, AdminRow, nextOrder } from './adminShared';
import { Button } from '@/components/ui';

export default function AdminAliyot() {
  const { t } = useLang();
  const { idx, saveRef } = useData();
  const [editing, setEditing] = useState(null);
  const fields = [
    { name: 'name_he', label: t('nameHe'), type: 'text', required: true, dir: 'rtl' },
    { name: 'name_en', label: t('nameEn'), type: 'text', required: true, dir: 'ltr' },
    { name: 'in_study', label: t('inStudy'), type: 'checkbox' },
    ...(editing?.key ? [{ name: 'key', label: t('key'), type: 'readonly', hint: t('keyHint') }] : []),
  ];
  const save = async (v) => {
    const row = { ...v, in_study: !!v.in_study };
    if (!row.key) { row.key = uniqueKey(slugify(v.name_en), idx.aliyot.map((a) => a.key)); row.sort_order = nextOrder(idx.aliyot); }
    await saveRef('aliyot', row);
  };
  return (
    <div className="pt-1">
      <AdminCrumbs items={[{ label: t('aliyahNames') }]} />
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-display font-extrabold">{t('aliyahNames')}</h1>
        <Button size="sm" variant="soft" onClick={() => setEditing({ in_study: true })}><Plus className="w-4 h-4" />{t('addAliyah')}</Button>
      </div>
      <div className="space-y-2">
        {idx.aliyot.map((a, i) => <AdminRow key={a.key} row={a} table="aliyot" index={i} count={idx.aliyot.length} badge={a.in_study === false ? t('tabAliyos') : null} onEdit={() => setEditing(a)} />)}
      </div>
      <RefFormModal open={!!editing} title={editing?.key ? t('editAliyah') : t('addAliyah')} fields={fields} initial={editing} onSave={save} onClose={() => setEditing(null)} />
    </div>
  );
}
