import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { logKey, resolveAliyosPath } from '@/lib/model';
import Breadcrumb from '@/components/Breadcrumb';
import ProgressPill from '@/components/ProgressPill';
import CircularCheckbox from '@/components/CircularCheckbox';
import Modal from '@/components/Modal';
import { Button, Field, Input, Name, Textarea } from '@/components/ui';

const splitParts = (splat) => (splat || '').split('/').filter(Boolean).map((p) => { try { return decodeURIComponent(p); } catch { return p; } });

function AliyahModal({ open, book, parashah, aliyah, existing, onClose, onSave, onRemove }) {
  const { t, name } = useLang();
  const [date, setDate] = useState('');
  const [synagogue, setSynagogue] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) { setDate(existing?.date ? String(existing.date).slice(0, 10) : ''); setSynagogue(existing?.synagogue || ''); setNotes(existing?.notes || ''); }
  }, [open, existing]);
  const run = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };
  return (
    <Modal open={open} onClose={onClose} title={<Name>{aliyah ? name(aliyah) : ''}</Name>} subtitle={<><Name>{name(book)}</Name> · <Name>{name(parashah)}</Name></>}
      footer={<>
        <Button className="flex-1" disabled={busy} onClick={() => run(() => onSave({ date, synagogue, notes }))}>{busy ? t('saving') : t('modalSave')}</Button>
        {existing && <Button variant="destructive" disabled={busy} onClick={() => run(onRemove)}>{t('modalDelete')}</Button>}
      </>}>
      <Field label={t('modalDate')}><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label={t('modalSynagogue')}><Input value={synagogue} onChange={(e) => setSynagogue(e.target.value)} placeholder={t('modalSynagoguePlaceholder')} /></Field>
      <Field label={t('modalNotes')}><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('modalNotesPlaceholder')} /></Field>
    </Modal>
  );
}

export default function AliyosModule() {
  const { '*': splat } = useParams();
  const { t, name } = useLang();
  const { idx, logMap, saveAliyah, removeAliyah, markAllAliyos, setError } = useData();
  const [modal, setModal] = useState(null);
  const parts = useMemo(() => splitParts(splat), [splat]);
  const view = useMemo(() => resolveAliyosPath(parts, idx, logMap), [parts, idx, logMap]);

  if (!view) return <div className="text-center py-20 text-muted-foreground">{t('notFound')}</div>;
  const crumbs = view.crumbs.map((c) => ({ name: name(c.row), path: c.path }));

  if (view.type === 'sefarim' || view.type === 'parshiyot') {
    return (
      <div className="pt-1">
        <Breadcrumb rootLabel={t('tabAliyos')} rootPath="/aliyos" items={crumbs} />
        <h1 className="text-3xl font-display font-extrabold mb-1"><Name>{view.title ? name(view.title) : t('tabAliyos')}</Name></h1>
        {view.type === 'sefarim' ? <p className="text-sm text-muted-foreground mb-5">{t('aliyosSubtitle')}</p> : <div className="mb-5" />}
        {view.items.length === 0 && <div className="text-center py-16 text-muted-foreground">{t('noItems')}</div>}
        <div className="space-y-2.5">
          {view.items.map((it) => <ProgressPill key={it.key} name={name(it.row)} path={it.path} total={it.total} completed={it.completed} />)}
        </div>
      </div>
    );
  }

  const { book, parashah } = view;
  const recFor = (a) => logMap.get(logKey(book.key, parashah.key, a.key));
  const completed = view.aliyot.filter((a) => recFor(a)).length;
  const total = view.aliyot.length;
  const guard = (fn) => async (...args) => { try { await fn(...args); } catch (e) { console.error(e); setError(e.message || String(e)); } };

  return (
    <div className="pt-1">
      <Breadcrumb rootLabel={t('tabAliyos')} rootPath="/aliyos" items={crumbs} />
      <div className="text-center mb-6">
        <div className="text-4xl font-display font-extrabold leading-tight"><Name>{name(book)}</Name></div>
        <div className="text-3xl font-display font-bold text-primary mt-1"><Name>{name(parashah)}</Name></div>
      </div>
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="text-sm text-muted-foreground tabular-nums">{completed} / {total} · {total ? Math.round((completed / total) * 100) : 0}%</div>
        <Button variant="soft" size="sm" disabled={completed >= total} onClick={guard(() => markAllAliyos(book.key, parashah.key))}>{t('markAll')}</Button>
      </div>
      <div className="space-y-2">
        {view.aliyot.map((a) => {
          const rec = recFor(a);
          return (
            <button key={a.key} type="button" onClick={() => setModal({ aliyah: a, existing: rec })}
              className="tap w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card/70 border border-border hover:border-primary/40 active:bg-card transition text-start">
              <CircularCheckbox checked={!!rec} />
              <div className="flex-1 text-start min-w-0">
                <div className="text-xl font-display font-semibold"><Name>{name(a)}</Name></div>
                {rec && (rec.synagogue || rec.date) && (
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    <Name>{rec.synagogue}</Name>{rec.synagogue && rec.date ? ' · ' : ''}{rec.date ? String(rec.date).slice(0, 10) : ''}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <AliyahModal open={!!modal} book={book} parashah={parashah} aliyah={modal?.aliyah} existing={modal?.existing} onClose={() => setModal(null)}
        onSave={guard(async (data) => {
          await saveAliyah({ book_key: book.key, parashah_key: parashah.key, aliyah_key: modal.aliyah.key, date: data.date || null, synagogue: data.synagogue || '', notes: data.notes || '' });
          setModal(null);
        })}
        onRemove={guard(async () => { if (modal?.existing) await removeAliyah(modal.existing); setModal(null); })}
      />
    </div>
  );
}
