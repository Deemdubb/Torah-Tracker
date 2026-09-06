import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { resolveAliyosPath, ALIYAH_NAMES } from '@/lib/aliyosData';
import ProgressPill from '@/components/ProgressPill';
import CircularCheckbox from '@/components/CircularCheckbox';
import Breadcrumb from '@/components/Breadcrumb';
import AliyahModal from '@/components/aliyos/AliyahModal';
import { useLang } from '@/lib/LanguageContext';
import { Loader2 } from 'lucide-react';

export default function AliyosModule() {
  const { '*': splat } = useParams();
  const parts = (splat || '').split('/').filter(Boolean).map((p) => {
    try { return decodeURIComponent(p); } catch { return p; }
  });

  const [logMap, setLogMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const { t, tr } = useLang();

  useEffect(() => {
    (async () => {
      try {
        const recs = await base44.entities.AliyahLog.list('-updated_date', 1000);
        const m = new Map();
        recs.forEach((r) => m.set(`${r.sefer}|${r.parashah}|${r.aliyah}`, r));
        setLogMap(m);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const view = useMemo(() => resolveAliyosPath(parts, logMap), [parts, logMap]);
  const keyFor = (s, p, a) => `${s}|${p}|${a}`;

  async function handleSave(data) {
    const { sefer, parashah, aliyah, existing } = modal;
    const key = keyFor(sefer, parashah, aliyah);
    try {
      let rec;
      if (existing) {
        rec = await base44.entities.AliyahLog.update(existing.id, {
          date: data.date || null,
          synagogue: data.synagogue || '',
          notes: data.notes || '',
        });
      } else {
        rec = await base44.entities.AliyahLog.create({
          sefer, parashah, aliyah,
          date: data.date || null,
          synagogue: data.synagogue || '',
          notes: data.notes || '',
        });
      }
      setLogMap((prev) => { const m = new Map(prev); m.set(key, rec); return m; });
      setModal(null);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleRemove() {
    const { sefer, parashah, aliyah, existing } = modal;
    if (!existing) { setModal(null); return; }
    const key = keyFor(sefer, parashah, aliyah);
    try {
      await base44.entities.AliyahLog.delete(existing.id);
      setLogMap((prev) => { const m = new Map(prev); m.delete(key); return m; });
      setModal(null);
    } catch (e) {
      console.error(e);
    }
  }

  async function markAll(sefer, parashah) {
    const toCreate = ALIYAH_NAMES
      .filter((a) => !logMap.has(keyFor(sefer, parashah, a)))
      .map((a) => ({ sefer, parashah, aliyah: a, date: null, synagogue: '', notes: '' }));
    if (!toCreate.length) return;
    try {
      const created = await base44.entities.AliyahLog.bulkCreate(toCreate);
      setLogMap((prev) => {
        const m = new Map(prev);
        created.forEach((r) => m.set(keyFor(r.sefer, r.parashah, r.aliyah), r));
        return m;
      });
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;
  }
  if (!view) {
    return <div className="text-center py-20 text-muted-foreground">{t('notFound')}</div>;
  }

  if (view.type === 'sefarim' || view.type === 'parshiyot') {
    return (
      <div className="pt-1">
        <Breadcrumb rootLabel={t('rootAliyos')} rootPath="/aliyos" items={view.breadcrumbs.map(b => ({ ...b, name: tr(b.name) }))} />
        <h1 className="text-3xl font-display font-extrabold mb-5">{tr(view.title)}</h1>
        <div className="space-y-2.5">
          {view.items.map((it) => (
            <ProgressPill key={it.path} name={tr(it.name)} path={it.path} total={it.total} completed={it.completed} />
          ))}
        </div>
      </div>
    );
  }

  const completed = ALIYAH_NAMES.filter((a) => logMap.has(keyFor(view.sefer, view.parashah, a))).length;
  return (
    <div className="pt-1">
      <Breadcrumb rootLabel={t('rootAliyos')} rootPath="/aliyos" items={view.breadcrumbs.map(b => ({ ...b, name: tr(b.name) }))} />

      <div className="text-center mb-6">
        <div className="text-4xl font-display font-extrabold leading-tight">{tr(view.sefer)}</div>
        <div className="text-3xl font-display font-bold text-primary mt-1">{tr(view.parashah)}</div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-muted-foreground tabular-nums">{completed} / 8 · {Math.round((completed / 8) * 100)}%</div>
        <button
          onClick={() => markAll(view.sefer, view.parashah)}
          className="px-4 py-1.5 rounded-full text-sm font-medium bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition"
        >
          {t('markAll')}
        </button>
      </div>

      <div className="space-y-2">
        {ALIYAH_NAMES.map((a) => {
          const key = keyFor(view.sefer, view.parashah, a);
          const rec = logMap.get(key);
          return (
            <button
              key={a}
              onClick={() => setModal({ sefer: view.sefer, parashah: view.parashah, aliyah: a, existing: rec })}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card/70 border border-border hover:border-primary/40 transition text-start"
            >
              <CircularCheckbox checked={!!rec} />
              <div className="flex-1 text-start">
                <div className="text-xl font-display font-semibold">{tr(a)}</div>
                {rec && (rec.synagogue || rec.date) && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {rec.synagogue}{rec.synagogue && rec.date ? ' · ' : ''}{rec.date ? String(rec.date).slice(0, 10) : ''}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <AliyahModal
        open={!!modal}
        aliyah={modal?.aliyah}
        sefer={modal?.sefer}
        parashah={modal?.parashah}
        existing={modal?.existing}
        onClose={() => setModal(null)}
        onSave={handleSave}
        onRemove={handleRemove}
      />
    </div>
  );
}
