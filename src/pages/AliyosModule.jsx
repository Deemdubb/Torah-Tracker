import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil, Plus, Trash2, Link2 } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { logKey, resolveAliyosPath } from '@/lib/model';
import { presetRange, entryRange, hasCustomRange, countPesukim, rangeText, rangeProblem, hasPesukim, isRange } from '@/lib/pesukim';
import { haptic } from '@/lib/haptics';
import { useConfirm } from '@/components/ConfirmDialog';
import Breadcrumb from '@/components/Breadcrumb';
import ProgressPill from '@/components/ProgressPill';
import CircularCheckbox from '@/components/CircularCheckbox';
import Modal from '@/components/Modal';
import { Button, Field, Input, Name, Textarea } from '@/components/ui';

const splitParts = (splat) => (splat || '').split('/').filter(Boolean).map((p) => { try { return decodeURIComponent(p); } catch { return p; } });
const toNums = (range) => range.map((v) => (v === '' || v == null ? NaN : Number(v)));

function CombinedTag({ partner }) {
  const { t, name } = useLang();
  return <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-primary/15 text-primary align-middle"><Link2 className="w-3 h-3" />{t('combinedTag')}{partner ? <>: <Name>{name(partner)}</Name></> : null}</span>;
}

// "א:א–ב:ג · 34 פסוקים" (or "1:1–2:3 · 34 pesukim")
function PesukimLine({ book, range }) {
  const { t, mode } = useLang();
  if (!isRange(range)) return null;
  const n = countPesukim(book, range);
  return <span className="tabular-nums"><Name>{rangeText(mode, range)}</Name>{n != null && <> · {n} {t('pesukim')}</>}</span>;
}

// Four small boxes: from perek and pasuk, to perek and pasuk. Shows the count, or what is wrong.
function RangeFields({ book, value, onChange }) {
  const { t } = useLang();
  const nums = toNums(value);
  const problem = hasPesukim(book) ? rangeProblem(book, nums) : (isRange(nums) ? null : 'incomplete');
  const n = problem ? null : countPesukim(book, nums);
  const set = (i, v) => { const next = [...value]; next[i] = v.replace(/[^\d]/g, ''); onChange(next); };
  const box = (i) => <Input type="number" min="1" inputMode="numeric" className="h-10 px-2 text-center" value={value[i] ?? ''} onChange={(e) => set(i, e.target.value)} />;
  const messages = { incomplete: t('rangeIncomplete'), outside: t('rangeOutside'), order: t('rangeOrder') };
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_3rem_minmax(0,1fr)] items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t('fromPerek')}</span>{box(0)}<span className="text-muted-foreground text-center">{t('fromPasuk')}</span>{box(1)}
        <span className="text-muted-foreground">{t('toPerek')}</span>{box(2)}<span className="text-muted-foreground text-center">{t('toPasuk')}</span>{box(3)}
      </div>
      {problem ? <div className="text-xs text-destructive">{messages[problem]}</div> : n != null ? <div className="text-xs text-primary tabular-nums">{n} {t('pesukim')}</div> : null}
    </div>
  );
}

// The honor's dialog: a list of every time it was received, plus a form to add or edit one.
function AliyahModal({ open, book, parashah, partner, aliyah, entries, onClose, onSave, onRemove }) {
  const { t, name } = useLang();
  const confirm = useConfirm();
  const [mode, setMode] = useState('list'); // 'list' | 'form'
  const [editing, setEditing] = useState(null);
  const [date, setDate] = useState('');
  const [synagogue, setSynagogue] = useState('');
  const [notes, setNotes] = useState('');
  const [combined, setCombined] = useState(false);
  const [custom, setCustom] = useState(false);
  const [range, setRange] = useState(['', '', '', '']);
  const [busy, setBusy] = useState(false);
  const isExtra = !!aliyah?.is_extra;
  const preset = presetRange(parashah, aliyah?.key);
  const useCustom = custom || isExtra;

  const startForm = (entry) => {
    setEditing(entry || null);
    setDate(entry?.date ? String(entry.date).slice(0, 10) : '');
    setSynagogue(entry?.synagogue || ''); setNotes(entry?.notes || ''); setCombined(!!entry?.combined);
    const own = entry && hasCustomRange(entry);
    setCustom(!!own);
    const r = own ? entryRange(entry, parashah) : preset;
    setRange(r ? r.map(String) : ['', '', '', '']);
    setMode('form');
  };
  useEffect(() => { if (open) { if (entries.length === 0) startForm(null); else setMode('list'); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const nums = toNums(range);
  const rangeOk = !useCustom || (hasPesukim(book) ? !rangeProblem(book, nums) : isRange(nums));
  const run = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };
  const save = () => run(async () => {
    const own = useCustom && rangeOk ? nums : [null, null, null, null];
    await onSave({ id: editing?.id, date, synagogue, notes, combined, from_perek: own[0], from_pasuk: own[1], to_perek: own[2], to_pasuk: own[3] });
    haptic('success');
    if (entries.length === 0 && !editing) onClose(); else setMode('list');
  });
  const remove = async (entry) => { if (!(await confirm({ title: t('delete'), text: t('deleteConfirm'), okLabel: t('delete'), danger: true }))) return; run(async () => { await onRemove(entry); haptic('remove'); if (entries.length <= 1) onClose(); }); };

  const title = <Name>{aliyah ? name(aliyah) : ''}</Name>;
  const subtitle = <><Name>{name(book)}</Name> · <Name>{name(parashah)}</Name></>;

  if (mode === 'form') {
    return (
      <Modal open={open} onClose={onClose} title={title} subtitle={subtitle}
        footer={<>
          <Button className="flex-1" disabled={busy || !rangeOk} onClick={save}>{busy ? t('saving') : t('modalSave')}</Button>
          {entries.length > 0 && <Button variant="outline" disabled={busy} onClick={() => setMode('list')}>{t('back')}</Button>}
        </>}>
        <div className="text-sm font-medium text-muted-foreground">{editing ? t('editEntry') : t('newEntry')}</div>
        <Field label={t('modalDate')}><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label={t('modalSynagogue')}><Input value={synagogue} onChange={(e) => setSynagogue(e.target.value)} placeholder={t('modalSynagoguePlaceholder')} /></Field>
        {partner && (
          <label className="flex items-start gap-3 text-start cursor-pointer">
            <input type="checkbox" className="mt-1 w-5 h-5 accent-[hsl(var(--primary))]" checked={combined} onChange={(e) => setCombined(e.target.checked)} />
            <span className="text-sm">{t('combinedWith')} <Name>{name(partner)}</Name><span className="block text-xs text-muted-foreground">{t('combinedHint')}</span></span>
          </label>
        )}
        <div className="rounded-2xl border border-border bg-background/40 p-3 space-y-2">
          <div className="text-sm font-medium">{t('pesukim')}</div>
          {preset && <div className="text-sm text-muted-foreground">{t('usualRange')}: <PesukimLine book={book} range={preset} /></div>}
          {isExtra ? (
            <p className="text-xs text-muted-foreground">{t('extraHint')}</p>
          ) : (
            <label className="flex items-start gap-3 text-start cursor-pointer">
              <input type="checkbox" className="mt-1 w-5 h-5 accent-[hsl(var(--primary))]" checked={custom} onChange={(e) => { setCustom(e.target.checked); if (e.target.checked && !range.some(Boolean) && preset) setRange(preset.map(String)); }} />
              <span className="text-sm">{t('customRange')}<span className="block text-xs text-muted-foreground">{t('customRangeHint')}</span></span>
            </label>
          )}
          {useCustom && <RangeFields book={book} value={range} onChange={setRange} />}
        </div>
        <Field label={t('modalNotes')}><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('modalNotesPlaceholder')} /></Field>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle}
      footer={<Button className="flex-1" onClick={() => startForm(null)}><Plus className="w-4 h-4" />{t('addAnother')}</Button>}>
      <div className="text-sm font-medium text-muted-foreground">{entries.length} {t('entries')}</div>
      <ul className="space-y-2">
        {entries.map((e) => (
          <li key={e.id} className="flex items-start gap-2 rounded-2xl border border-border bg-background/50 px-3 py-2.5">
            <div className="flex-1 min-w-0 text-sm">
              <div className="font-medium tabular-nums">{e.date || t('noDate')} {e.combined && <CombinedTag partner={partner} />}</div>
              {hasCustomRange(e) && <div className="text-muted-foreground text-xs"><PesukimLine book={book} range={entryRange(e, parashah)} /></div>}
              {e.synagogue && <div className="text-muted-foreground truncate"><Name>{e.synagogue}</Name></div>}
              {e.notes && <div className="text-muted-foreground text-xs mt-0.5 whitespace-pre-wrap">{e.notes}</div>}
            </div>
            <button type="button" aria-label={t('edit')} className="tap p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card" onClick={() => startForm(e)}><Pencil className="w-4 h-4" /></button>
            <button type="button" aria-label={t('delete')} className="tap p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-card" disabled={busy} onClick={() => remove(e)}><Trash2 className="w-4 h-4" /></button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export default function AliyosModule() {
  const { '*': splat } = useParams();
  const { t, name } = useLang();
  const { idx, logMap, saveAliyah, removeAliyah, markAllAliyos, setError } = useData();
  const [openFor, setOpenFor] = useState(null); // aliyah row
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

  const { book, parashah, partner } = view;
  const entriesFor = (a) => logMap.get(logKey(book.key, parashah.key, a.key)) || [];
  const received = view.regular.filter((a) => entriesFor(a).length > 0).length; // hosafos are extras and do not count here
  const total = view.regular.length;
  const guard = (fn) => async (...args) => { try { return await fn(...args); } catch (e) { console.error(e); setError(e); throw e; } };

  return (
    <div className="pt-1">
      <Breadcrumb rootLabel={t('tabAliyos')} rootPath="/aliyos" items={crumbs} />
      <div className="text-center mb-6">
        <div className="text-4xl font-display font-extrabold leading-tight"><Name>{name(book)}</Name></div>
        <div className="text-3xl font-display font-bold text-primary mt-1"><Name>{name(parashah)}</Name></div>
        {partner && <div className="text-xs text-muted-foreground mt-1">{t('canCombineWith')} <Name>{name(partner)}</Name></div>}
      </div>
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="text-sm text-muted-foreground tabular-nums">{received} / {total} · {total ? Math.round((received / total) * 100) : 0}%</div>
        <Button variant="soft" size="sm" disabled={received >= total} onClick={() => { haptic('success'); guard(() => markAllAliyos(book.key, parashah.key))().catch(() => {}); }}>{t('markAll')}</Button>
      </div>
      <div className="space-y-2">
        {view.aliyot.map((a) => {
          const entries = entriesFor(a);
          const latest = entries[0];
          const preset = presetRange(parashah, a.key);
          const shownRange = a.is_extra ? (latest ? entryRange(latest, parashah) : null) : preset;
          return (
            <button key={a.key} type="button" onClick={() => { haptic('tap'); setOpenFor(a); }}
              className="tap w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card/70 border border-border hover:border-primary/40 active:bg-card transition text-start">
              <CircularCheckbox checked={entries.length > 0} count={entries.length} />
              <div className="flex-1 text-start min-w-0">
                <div className="text-xl font-display font-semibold"><Name>{name(a)}</Name></div>
                {shownRange ? <div className="text-xs text-muted-foreground mt-0.5"><PesukimLine book={book} range={shownRange} /></div>
                  : a.is_extra ? <div className="text-xs text-muted-foreground mt-0.5">{t('extraHint')}</div> : null}
                {latest && (
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {latest.date || t('noDate')}{latest.synagogue ? <> · <Name>{latest.synagogue}</Name></> : null}{latest.combined ? <> · {t('combinedTag')}</> : null}
                    {entries.length > 1 ? <> · {entries.length} {t('entries')}</> : null}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <AliyahModal open={!!openFor} book={book} parashah={parashah} partner={partner} aliyah={openFor} entries={openFor ? entriesFor(openFor) : []}
        onClose={() => setOpenFor(null)}
        onSave={guard((data) => saveAliyah({ id: data.id, book_key: book.key, parashah_key: parashah.key, aliyah_key: openFor.key, date: data.date || null, synagogue: data.synagogue || '', notes: data.notes || '', combined: !!data.combined,
          from_perek: data.from_perek ?? null, from_pasuk: data.from_pasuk ?? null, to_perek: data.to_perek ?? null, to_pasuk: data.to_pasuk ?? null }))}
        onRemove={guard((entry) => removeAliyah(entry))}
      />
    </div>
  );
}
