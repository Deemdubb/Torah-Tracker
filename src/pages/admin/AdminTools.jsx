import { useRef, useState } from 'react';
import { Download, RotateCcw, Upload } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { downloadText, readFileAsText } from '@/lib/csv';
import { AdminCrumbs } from './adminShared';
import { useConfirm } from '@/components/ConfirmDialog';
import { Banner, Button, Card } from '@/components/ui';

export default function AdminTools() {
  const { t } = useLang();
  const { refs, idx, resetDefaults, importRefs, setError } = useData();
  const fileRef = useRef(null);
  const confirm = useConfirm();
  const [msg, setMsg] = useState('');
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { setError(e); } };

  const exportLists = () => downloadText(`torah-lists-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(refs, null, 2), 'application/json');
  const importLists = guard(async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const data = JSON.parse(await readFileAsText(file));
      const src = data.refs && Array.isArray(data.refs.categories) ? data.refs : data;
      if (!Array.isArray(src.categories) || !Array.isArray(src.books)) throw new Error(t('notListsFile'));
      await importRefs(src); setMsg(t('done'));
    } finally { e.target.value = ''; }
  });

  const counts = [[t('categories'), idx.categories.length], [t('sections'), idx.sections.length], [t('books'), idx.books.length], [t('parshiyot'), idx.parshiyot.length], [t('aliyot'), idx.aliyot.length]];

  return (
    <div className="pt-1 space-y-4">
      <AdminCrumbs items={[{ label: t('dataTools') }]} />
      <h1 className="text-2xl font-display font-extrabold">{t('dataTools')}</h1>
      {msg && <Banner>{msg}</Banner>}
      <Card className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        {counts.map(([label, n]) => <div key={label}><div className="text-2xl font-display font-bold">{n}</div><div className="text-xs text-muted-foreground">{label}</div></div>)}
      </Card>
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={exportLists}><Download className="w-4 h-4" />{t('exportLists')}</Button>
          <Button variant="outline" className="flex-1" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" />{t('importLists')}</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importLists} />
        </div>
        <Button variant="destructive" className="w-full" onClick={async () => { if (await confirm({ title: t('resetDefaults'), text: t('resetConfirm'), okLabel: t('resetDefaults'), danger: true })) guard(resetDefaults)().then(() => setMsg(t('done'))); }}><RotateCcw className="w-4 h-4" />{t('resetDefaults')}</Button>
      </Card>
    </div>
  );
}
