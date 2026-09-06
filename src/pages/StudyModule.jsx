import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { BookMarked, Minus } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { resolveStudyPath, countOf } from '@/lib/model';
import { haptic } from '@/lib/haptics';
import { useConfirm } from '@/components/ConfirmDialog';
import Breadcrumb from '@/components/Breadcrumb';
import ProgressPill from '@/components/ProgressPill';
import CircularCheckbox from '@/components/CircularCheckbox';
import { Button, Name } from '@/components/ui';

const splitParts = (splat) => (splat || '').split('/').filter(Boolean).map((p) => { try { return decodeURIComponent(p); } catch { return p; } });

// One tappable row: tap = learned once more (+1). The small minus takes one away.
function ItemRow({ count, onAdd, onRemove, removeLabel, children, big = false }) {
  return (
    <div className="flex items-stretch gap-1.5">
      <button type="button" onClick={onAdd} aria-pressed={count > 0}
        className={`tap flex-1 flex items-center gap-3 px-4 ${big ? 'py-3.5' : 'py-3'} rounded-2xl bg-card/70 border border-border hover:border-primary/40 active:scale-[0.99] active:bg-card transition text-start min-w-0`}>
        <CircularCheckbox checked={count > 0} count={count} />
        <div className="flex-1 min-w-0 text-start">{children}</div>
      </button>
      {count > 0 && (
        <button type="button" onClick={onRemove} aria-label={removeLabel} title={removeLabel}
          className="tap w-11 shrink-0 rounded-2xl border border-border bg-card/40 text-muted-foreground hover:text-destructive hover:border-destructive/40 active:scale-95 transition flex items-center justify-center">
          <Minus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default function StudyModule() {
  const { '*': splat } = useParams();
  const { t, name, leafLabel, rangeLabel } = useLang();
  const { idx, pm, addOne, removeOne, fillAll, againAll, clearAll } = useData();
  const confirm = useConfirm();
  const parts = useMemo(() => splitParts(splat), [splat]);
  const view = useMemo(() => resolveStudyPath(parts, idx, pm), [parts, idx, pm]);

  if (!view) return <div className="text-center py-20 text-muted-foreground">{t('notFound')}</div>;
  const crumbs = view.crumbs.map((c) => ({ name: name(c.row), path: c.path }));

  const listTypes = ['categories', 'sections', 'books', 'parshiyot'];
  if (listTypes.includes(view.type)) {
    return (
      <div className="pt-1">
        <Breadcrumb rootLabel={t('tabStudy')} rootPath="/study" items={crumbs} />
        <h1 className="text-3xl font-display font-extrabold mb-1"><Name>{view.title ? name(view.title) : t('tabStudy')}</Name></h1>
        {view.type === 'categories' && <p className="text-sm text-muted-foreground mb-5">{t('studySubtitle')}</p>}
        {view.type !== 'categories' && <div className="mb-5" />}
        {view.items.length === 0 && <div className="text-center py-16 text-muted-foreground">{t('noItems')}</div>}
        <div className="space-y-2.5">
          {view.items.map((it) => <ProgressPill key={it.key} name={name(it.row)} path={it.path} total={it.total} completed={it.completed} cycles={it.cycles || 0} />)}
        </div>
      </div>
    );
  }

  if (view.type === 'placeholder') {
    return (
      <div className="pt-1">
        <Breadcrumb rootLabel={t('tabStudy')} rootPath="/study" items={crumbs} />
        <h1 className="text-3xl font-display font-extrabold mb-1"><Name>{name(view.title)}</Name></h1>
        <div className="flex flex-col items-center justify-center text-center py-20 text-muted-foreground">
          <BookMarked className="w-10 h-10 mb-3 opacity-50" />
          <p className="text-lg font-display">{t('comingSoon')}</p>
        </div>
      </div>
    );
  }

  // leaf screens: 'leaves' (chapters / pages) or 'chumash_aliyot' (the aliyos of one parashah)
  const values = view.type === 'leaves' ? view.items : view.aliyot.map((a) => a.key);
  const counts = values.map((v) => countOf(pm, view.scope, v));
  const total = values.length;
  const learned = counts.filter((c) => c > 0).length;
  const cycles = total ? Math.min(...counts) : 0;
  const percent = total ? Math.round((learned / total) * 100) : 0;
  const allLearned = total > 0 && learned >= total;

  const add = (v) => { haptic('tap'); addOne(view.scope, v); };
  const remove = (v) => { haptic('remove'); removeOne(view.scope, v); };
  const markAll = () => { haptic('success'); fillAll(view.scope, values); };
  const learnAgain = async () => { if (await confirm({ title: t('learnAgain'), text: t('confirmLearnAgain'), okLabel: t('learnAgain') })) { haptic('success'); againAll(view.scope, values); } };
  const clear = async () => { if (await confirm({ title: t('clearAll'), text: t('confirmClearAll'), okLabel: t('clearAll'), danger: true })) { haptic('remove'); clearAll(view.scope); } };

  return (
    <div className="pt-1">
      <Breadcrumb rootLabel={t('tabStudy')} rootPath="/study" items={crumbs} />
      {view.type === 'chumash_aliyot' ? (
        <div className="text-center mb-6">
          <div className="text-4xl font-display font-extrabold leading-tight"><Name>{name(view.book)}</Name></div>
          <div className="text-3xl font-display font-bold text-primary mt-1"><Name>{name(view.parashah)}</Name></div>
        </div>
      ) : (
        <h1 className="text-3xl font-display font-extrabold mb-5"><Name>{name(view.title)}</Name></h1>
      )}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="text-sm text-muted-foreground tabular-nums flex items-center gap-2">
          <span>{learned} / {total} · {percent}%</span>
          {cycles > 0 && <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary" title={`${cycles} ${t('timesFull')}`}>×{cycles} {t('timesFull')}</span>}
        </div>
        <div className="flex items-center gap-2">
          {!allLearned ? (
            <Button variant="soft" size="sm" onClick={markAll}>{t('markAll')}</Button>
          ) : (
            <>
              <Button variant="soft" size="sm" onClick={learnAgain}>{t('learnAgain')}</Button>
              <Button variant="ghost" size="sm" onClick={clear}>{t('clearAll')}</Button>
            </>
          )}
        </div>
      </div>

      {view.type === 'leaves' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {view.items.map((n, i) => (
            <ItemRow key={n} count={counts[i]} onAdd={() => add(n)} onRemove={() => remove(n)} removeLabel={t('removeOne')}>
              <span className="text-lg font-display"><Name>{leafLabel(view.leafType, n)}</Name></span>
            </ItemRow>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {view.aliyot.map((a, i) => {
            const range = view.ranges[i];
            return (
              <ItemRow key={a.key} big count={counts[i]} onAdd={() => add(a.key)} onRemove={() => remove(a.key)} removeLabel={t('removeOne')}>
                <div className="text-xl font-display font-semibold"><Name>{name(a)}</Name></div>
                {range && <div className="text-xs text-muted-foreground mt-0.5"><Name>{rangeLabel(range[0], range[1])}</Name></div>}
              </ItemRow>
            );
          })}
        </div>
      )}
    </div>
  );
}
