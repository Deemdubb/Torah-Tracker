import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { resolveStudyPath } from '@/lib/studyData';
import { useLang } from '@/lib/LanguageContext';
import ProgressPill from '@/components/ProgressPill';
import CircularCheckbox from '@/components/CircularCheckbox';
import Breadcrumb from '@/components/Breadcrumb';
import { Loader2, BookMarked } from 'lucide-react';

export default function StudyModule() {
  const { '*': splat } = useParams();
  const parts = (splat || '').split('/').filter(Boolean).map((p) => {
    try { return decodeURIComponent(p); } catch { return p; }
  });

  const [progressMap, setProgressMap] = useState({});
  const [recMap, setRecMap] = useState({});
  const [loading, setLoading] = useState(true);
  const { t, tr, leafLabel, rangeLabel } = useLang();

  useEffect(() => {
    (async () => {
      try {
        const records = await base44.entities.StudyProgress.list('-updated_date', 2000);
        const pm = {}, rm = {};
        records.forEach((r) => { pm[r.path_key] = new Set(r.completed || []); rm[r.path_key] = r; });
        setProgressMap(pm);
        setRecMap(rm);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const view = useMemo(() => resolveStudyPath(parts, progressMap), [parts, progressMap]);

  async function persistBook(bookKey, newSet) {
    const arr = [...newSet];
    const rec = recMap[bookKey];
    if (rec) {
      const updated = await base44.entities.StudyProgress.update(rec.id, { completed: arr });
      setRecMap((prev) => ({ ...prev, [bookKey]: updated }));
    } else {
      const created = await base44.entities.StudyProgress.create({ path_key: bookKey, completed: arr });
      setRecMap((prev) => ({ ...prev, [bookKey]: created }));
    }
  }

  async function toggleLeaf(bookKey, index) {
    const prev = progressMap[bookKey] || new Set();
    const set = new Set(prev);
    if (set.has(index)) set.delete(index); else set.add(index);
    setProgressMap((p) => ({ ...p, [bookKey]: set }));
    try {
      await persistBook(bookKey, set);
    } catch (e) {
      console.error(e);
      setProgressMap((p) => ({ ...p, [bookKey]: prev }));
    }
  }

  async function toggleAll(bookKey, values) {
    const prev = progressMap[bookKey] || new Set();
    const all = prev.size >= values.length;
    const set = all ? new Set() : new Set(values);
    setProgressMap((p) => ({ ...p, [bookKey]: set }));
    try {
      await persistBook(bookKey, set);
    } catch (e) {
      console.error(e);
      setProgressMap((p) => ({ ...p, [bookKey]: prev }));
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;
  }
  if (!view) {
    return <div className="text-center py-20 text-muted-foreground">{t('notFound')}</div>;
  }

  return (
    <div className="pt-1">
      <Breadcrumb rootLabel={t('rootStudy')} rootPath="/study" items={view.breadcrumbs.map(b => ({ ...b, name: tr(b.name) }))} />
      {view.type === 'chumash_aliyot' ? (
        <div className="text-center mb-6">
          <div className="text-4xl font-display font-extrabold leading-tight">{tr(view.sefer)}</div>
          <div className="text-3xl font-display font-bold text-primary mt-1">{tr(view.parashah)}</div>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-display font-extrabold mb-1">{tr(view.title)}</h1>
          {view.type === 'categories' && (
            <p className="text-sm text-muted-foreground mb-5">{t('studySubtitle')}</p>
          )}
          {view.type !== 'categories' && view.type !== 'placeholder' && <div className="mb-5" />}
        </>
      )}

      {(view.type === 'categories' || view.type === 'sections' || view.type === 'books' || view.type === 'parshiyot') && (
        <div className="space-y-2.5">
          {view.items.map((it) => (
            <ProgressPill key={it.path} name={tr(it.name)} path={it.path} total={it.total} completed={it.completed} />
          ))}
        </div>
      )}

      {view.type === 'leaves' && (() => {
        const completed = progressMap[view.bookKey]?.size || 0;
        const percent = view.count ? Math.round((completed / view.count) * 100) : 0;
        const allDone = completed >= view.count;
        return (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground tabular-nums">{completed} / {view.count} · {percent}%</div>
              <button
                onClick={() => toggleAll(view.bookKey, Array.from({ length: view.count }, (_, i) => i + 1))}
                className="px-4 py-1.5 rounded-full text-sm font-medium bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition"
              >
                {allDone ? t('unmarkAll') : t('markAll')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Array.from({ length: view.count }, (_, i) => {
                const idx = i + 1;
                const checked = progressMap[view.bookKey]?.has(idx) || false;
                const label = leafLabel(view.leafType, idx);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleLeaf(view.bookKey, idx)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card/70 border border-border hover:border-primary/40 hover:bg-card transition text-start"
                  >
                    <CircularCheckbox checked={checked} />
                    <span className="text-lg font-display">{label}</span>
                  </button>
                );
              })}
            </div>
          </>
        );
      })()}

      {view.type === 'chumash_aliyot' && (() => {
        const total = view.aliyot.length;
        const completed = progressMap[view.bookKey]?.size || 0;
        const percent = total ? Math.round((completed / total) * 100) : 0;
        const allDone = completed >= total;
        return (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground tabular-nums">{completed} / {total} · {percent}%</div>
              <button
                onClick={() => toggleAll(view.bookKey, view.aliyot)}
                className="px-4 py-1.5 rounded-full text-sm font-medium bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition"
              >
                {allDone ? t('unmarkAll') : t('markAll')}
              </button>
            </div>
            <div className="space-y-2">
              {view.aliyot.map((a, i) => {
                const checked = progressMap[view.bookKey]?.has(a) || false;
                const [s, e] = view.ranges[i];
                return (
                  <button
                    key={a}
                    onClick={() => toggleLeaf(view.bookKey, a)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card/70 border border-border hover:border-primary/40 transition text-start"
                  >
                    <CircularCheckbox checked={checked} />
                    <div className="flex-1 text-start">
                      <div className="text-xl font-display font-semibold">{tr(a)}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{rangeLabel(s, e)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        );
      })()}

      {view.type === 'placeholder' && (
        <div className="flex flex-col items-center justify-center text-center py-20 text-muted-foreground">
          <BookMarked className="w-10 h-10 mb-3 opacity-50" />
          <p className="text-lg font-display">{t('comingSoon')}</p>
        </div>
      )}
    </div>
  );
}
