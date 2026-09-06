import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { BookMarked } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { resolveStudyPath } from '@/lib/model';
import Breadcrumb from '@/components/Breadcrumb';
import ProgressPill from '@/components/ProgressPill';
import CircularCheckbox from '@/components/CircularCheckbox';
import { Button, Name } from '@/components/ui';

const splitParts = (splat) => (splat || '').split('/').filter(Boolean).map((p) => { try { return decodeURIComponent(p); } catch { return p; } });

export default function StudyModule() {
  const { '*': splat } = useParams();
  const { t, name, leafLabel, rangeLabel } = useLang();
  const { idx, pm, toggleItem, setAllItems } = useData();
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
          {view.items.map((it) => <ProgressPill key={it.key} name={name(it.row)} path={it.path} total={it.total} completed={it.completed} />)}
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

  // leaf screens: 'leaves' (chapters / pages) or 'chumash_aliyot' (7 aliyos of one parashah)
  const set = pm.get(`${view.scope.book_key}|${view.scope.parashah_key || ''}`) || new Set();
  const values = view.type === 'leaves' ? view.items : view.aliyot.map((a) => a.key);
  const total = values.length;
  const completed = values.filter((v) => set.has(v)).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const allDone = total > 0 && completed >= total;

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
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="text-sm text-muted-foreground tabular-nums">{completed} / {total} · {percent}%</div>
        <Button variant="soft" size="sm" onClick={() => setAllItems(view.scope, values, !allDone)}>{allDone ? t('unmarkAll') : t('markAll')}</Button>
      </div>

      {view.type === 'leaves' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {view.items.map((n) => {
            const checked = set.has(n);
            return (
              <button key={n} type="button" onClick={() => toggleItem(view.scope, n)} aria-pressed={checked}
                className="tap flex items-center gap-3 px-4 py-3 rounded-2xl bg-card/70 border border-border hover:border-primary/40 active:bg-card transition text-start">
                <CircularCheckbox checked={checked} />
                <span className="text-lg font-display"><Name>{leafLabel(view.leafType, n)}</Name></span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {view.aliyot.map((a, i) => {
            const checked = set.has(a.key);
            const range = view.ranges[i];
            return (
              <button key={a.key} type="button" onClick={() => toggleItem(view.scope, a.key)} aria-pressed={checked}
                className="tap w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card/70 border border-border hover:border-primary/40 active:bg-card transition text-start">
                <CircularCheckbox checked={checked} />
                <div className="flex-1 text-start">
                  <div className="text-xl font-display font-semibold"><Name>{name(a)}</Name></div>
                  {range && <div className="text-xs text-muted-foreground mt-0.5"><Name>{rangeLabel(range[0], range[1])}</Name></div>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
