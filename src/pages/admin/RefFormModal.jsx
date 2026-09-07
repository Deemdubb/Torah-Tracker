// One generic edit form for every list type. `fields` describes what to show.
import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { Banner, Button, Field, Input, Name, Select } from '@/components/ui';
import { useLang } from '@/lib/LanguageContext';

export default function RefFormModal({ open, title, fields, initial, onSave, onClose }) {
  const { t, name } = useLang();
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (open) { setValues({ ...(initial || {}) }); setError(''); } }, [open, initial]);
  const set = (k, v) => setValues((prev) => ({ ...prev, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setError('');
    for (const f of fields) if (f.required && !String(values[f.name] ?? '').trim()) { setError(`${f.label}: ${t('required')}`); return; }
    setBusy(true);
    try { await onSave(values); onClose(); } catch (err) { setError(err.message || String(err)); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Banner tone="error">{error}</Banner>}
        {fields.map((f) => {
          const v = values[f.name];
          if (f.type === 'readonly') return <Field key={f.name} label={f.label} hint={f.hint}><div className="h-11 flex items-center px-3 rounded-xl border border-border bg-background/50 text-muted-foreground text-sm" dir="ltr">{v || '—'}</div></Field>;
          if (f.type === 'select') return (
            <Field key={f.name} label={f.label} hint={f.hint}>
              <Select value={v ?? ''} onChange={(e) => set(f.name, e.target.value)}>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
            </Field>
          );
          if (f.type === 'checkbox') return (
            <label key={f.name} className="flex items-start gap-3 text-start cursor-pointer">
              <input type="checkbox" className="mt-1 w-5 h-5 accent-[hsl(var(--primary))]" checked={!!v} onChange={(e) => set(f.name, e.target.checked)} />
              <span className="text-sm">{f.label}{f.hint && <span className="block text-xs text-muted-foreground">{f.hint}</span>}</span>
            </label>
          );
          if (f.type === 'pesukim') {
            // one row per aliyah: from perek, from pasuk, to perek, to pasuk
            const all = v && typeof v === 'object' ? v : {};
            return (
              <Field key={f.name} label={f.label} hint={f.hint}>
                <div className="space-y-2">
                  <div className="grid grid-cols-[minmax(0,1fr)_3.2rem_3.2rem_3.2rem_3.2rem] gap-2 text-[10px] text-muted-foreground text-center"><span /><span>{t('fromPerek')}</span><span>{t('fromPasuk')}</span><span>{t('toPerek')}</span><span>{t('toPasuk')}</span></div>
                  {f.aliyot.map((a) => {
                    const r = Array.isArray(all[a.key]) ? all[a.key] : ['', '', '', ''];
                    const update = (j, val) => { const next = { ...all, [a.key]: [0, 1, 2, 3].map((k) => (k === j ? (val === '' ? '' : Number(val)) : (r[k] ?? ''))) }; set(f.name, next); };
                    return (
                      <div key={a.key} className="grid grid-cols-[minmax(0,1fr)_3.2rem_3.2rem_3.2rem_3.2rem] items-center gap-2">
                        <div className="text-sm font-medium truncate"><Name>{name(a)}</Name></div>
                        {[0, 1, 2, 3].map((j) => <Input key={j} type="number" min="1" inputMode="numeric" className="h-10 px-1 text-center text-sm" value={r[j] ?? ''} onChange={(e) => update(j, e.target.value)} />)}
                      </div>
                    );
                  })}
                </div>
              </Field>
            );
          }
          if (f.type === 'textlist') {
            // numbers separated by commas; kept as text while editing, turned into a list on save
            const text = Array.isArray(v) ? v.join(', ') : (v ?? '');
            return <Field key={f.name} label={f.label} hint={f.hint}><Input dir="ltr" value={text} onChange={(e) => set(f.name, e.target.value)} placeholder="31, 25, 24, …" /></Field>;
          }
          return (
            <Field key={f.name} label={f.label} hint={f.hint}>
              <Input type={f.type === 'number' ? 'number' : 'text'} inputMode={f.type === 'number' ? 'numeric' : undefined} min={f.min} dir={f.dir}
                value={v ?? ''} onChange={(e) => set(f.name, f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)} required={f.required} />
            </Field>
          );
        })}
        <div className="flex gap-2 pt-2">
          <Button type="submit" className="flex-1" disabled={busy}>{busy ? t('saving') : t('save')}</Button>
          <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
        </div>
      </form>
    </Modal>
  );
}
