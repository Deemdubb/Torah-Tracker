import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Flame, BookOpen, ScrollText, CalendarDays } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { categoryTotals, studyPath, allEntries } from '@/lib/model';
import { pesukimStats } from '@/lib/pesukim';
import ProgressRing from '@/components/ProgressRing';
import { Card, Name } from '@/components/ui';

const DAY = 86400000;
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function Stat({ label, value, sub, icon: Icon }) {
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">{Icon && <Icon className="w-3.5 h-3.5" />}{label}</div>
      <div className="text-2xl font-display font-bold tabular-nums mt-0.5">{value}</div>
      {sub && <div className="text-xs text-muted-foreground tabular-nums">{sub}</div>}
    </Card>
  );
}

function Bars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.key} className="grid grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-2 text-sm">
          <div>
            <div className="flex justify-between gap-2"><span className="truncate"><Name>{r.label}</Name></span></div>
            <div className="h-1.5 rounded-full bg-muted mt-1"><div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${(r.n / max) * 100}%` }} /></div>
          </div>
          <div className="text-end tabular-nums text-muted-foreground">{r.n}</div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { t, name, leafLabel } = useLang();
  const { idx, pm, progressRows, logMap } = useData();

  const study = useMemo(() => {
    const now = new Date();
    const dated = progressRows.map((r) => ({ ...r, d: r.completed_at ? new Date(r.completed_at) : null }));
    const within = (days) => dated.filter((r) => r.d && now - r.d < days * DAY).length;
    const days = new Set(dated.filter((r) => r.d).map((r) => dayKey(r.d)));
    let streak = 0; let cursor = new Date();
    if (!days.has(dayKey(cursor))) cursor = new Date(cursor - DAY);
    while (days.has(dayKey(cursor))) { streak++; cursor = new Date(cursor - DAY); }
    const recent = dated.filter((r) => r.d).sort((a, b) => b.d - a.d).slice(0, 8);
    const cats = idx.categories.map((c) => ({ c, ...categoryTotals(idx, c, pm) })).filter((x) => x.total > 0);
    const unique = new Set(progressRows.map((r) => `${r.book_key}|${r.parashah_key || ''}|${r.item}`)).size;
    return { total: unique, completions: progressRows.length, last7: within(7), last30: within(30), thisYear: dated.filter((r) => r.d && r.d.getFullYear() === now.getFullYear()).length, streak, recent, cats };
  }, [progressRows, idx, pm]);

  const aliyos = useMemo(() => {
    const entries = allEntries(logMap);
    const count = (fn) => { const m = new Map(); for (const e of entries) { const k = fn(e); if (k == null || k === '') continue; m.set(k, (m.get(k) || 0) + 1); } return m; };
    const byHonor = idx.aliyot.map((a) => ({ key: a.key, label: name(a), n: entries.filter((e) => e.aliyah_key === a.key).length }));
    const byYear = [...count((e) => (e.date ? String(e.date).slice(0, 4) : null))].sort((a, b) => b[0].localeCompare(a[0])).map(([k, n]) => ({ key: k, label: k, n }));
    const bySynagogue = [...count((e) => e.synagogue?.trim())].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => ({ key: k, label: k, n }));
    const recent = entries.slice().sort((a, b) => String(b.date || b.created_at || '').localeCompare(String(a.date || a.created_at || ''))).slice(0, 6);
    return { total: entries.length, parshiyot: new Set(entries.map((e) => e.parashah_key)).size, byHonor, byYear, bySynagogue, recent, pesukim: pesukimStats(entries, idx) };
  }, [logMap, idx, name]);

  const describe = (r) => {
    const book = idx.book[r.book_key]; const cat = book && idx.cat[book.category_key]; const par = r.parashah_key ? idx.par[r.parashah_key] : null; const ali = idx.ali[r.item];
    return { book: book ? name(book) : r.book_key, detail: par ? `${name(par)} · ${ali ? name(ali) : r.item}` : (ali ? name(ali) : leafLabel(cat?.leaf_type || 'perek', r.item)) };
  };
  const catFor = (c) => idx.cat[c.key];

  return (
    <div className="pt-1 space-y-5">
      <div>
        <h1 className="text-3xl font-display font-extrabold mb-1">{t('dashboardTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('dashboardSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Stat label={t('statLearnedTotal')} value={study.total} icon={BookOpen} />
        <Stat label={t('statCompletions')} value={study.completions} />
        <Stat label={t('statLast7')} value={study.last7} icon={CalendarDays} />
        <Stat label={t('statLast30')} value={study.last30} icon={CalendarDays} />
        <Stat label={t('statStreak')} value={study.streak} icon={Flame} />
      </div>

      <Card className="p-4">
        <div className="font-semibold mb-3">{t('progressByCategory')}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {study.cats.map(({ c, total, completed }) => (
            <Link key={c.key} to={studyPath.cat(catFor(c))} className="tap flex items-center gap-3 px-3 py-2 rounded-xl border border-border hover:border-primary/40">
              <ProgressRing percent={(completed / total) * 100} size={36} />
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold truncate"><Name>{name(c)}</Name></div>
                <div className="text-xs text-muted-foreground tabular-nums">{completed} / {total} · {Math.round((completed / total) * 100)}%</div>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="font-semibold mb-3">{t('recentActivity')}</div>
        {study.recent.length === 0 ? <p className="text-sm text-muted-foreground">{t('noActivity')}</p> : (
          <ul className="divide-y divide-border">
            {study.recent.map((r) => { const d = describe(r); return (
              <li key={`${r.book_key}|${r.parashah_key}|${r.item}|${r.completed_at}`} className="py-2 flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0"><span className="font-medium"><Name>{d.book}</Name></span> <span className="text-muted-foreground"><Name>{d.detail}</Name></span></div>
                <div className="text-xs text-muted-foreground tabular-nums shrink-0">{r.completed_at.slice(0, 10)}</div>
              </li>); })}
          </ul>
        )}
      </Card>

      <div className="flex items-center gap-2 pt-1"><ScrollText className="w-5 h-5 text-primary" /><h2 className="text-2xl font-display font-bold">{t('aliyosStats')}</h2></div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label={t('statAliyosTotal')} value={aliyos.total} />
        <Stat label={t('statParshiyotCovered')} value={aliyos.parshiyot} />
        <Stat label={t('statPesukimTotal')} value={aliyos.pesukim.total} />
        <Stat label={t('statTorahCovered')} value={aliyos.pesukim.distinct} sub={aliyos.pesukim.torahTotal ? `${Math.round((aliyos.pesukim.distinct / aliyos.pesukim.torahTotal) * 1000) / 10}% ${t('ofTorah')} (${aliyos.pesukim.torahTotal})` : null} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-4"><div className="font-semibold mb-3">{t('byHonor')}</div><Bars rows={aliyos.byHonor} /></Card>
        <div className="space-y-3">
          {aliyos.byYear.length > 0 && <Card className="p-4"><div className="font-semibold mb-3">{t('byYear')}</div><Bars rows={aliyos.byYear} /></Card>}
          {aliyos.bySynagogue.length > 0 && <Card className="p-4"><div className="font-semibold mb-3">{t('bySynagogue')}</div><Bars rows={aliyos.bySynagogue} /></Card>}
        </div>
      </div>
      <Card className="p-4">
        <div className="font-semibold mb-3">{t('recentAliyos')}</div>
        {aliyos.recent.length === 0 ? <p className="text-sm text-muted-foreground">{t('noItems')}</p> : (
          <ul className="divide-y divide-border">
            {aliyos.recent.map((e) => { const b = idx.book[e.book_key], p = idx.par[e.parashah_key], a = idx.ali[e.aliyah_key]; return (
              <li key={e.id} className="py-2 flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0"><span className="font-medium"><Name>{a ? name(a) : e.aliyah_key}</Name></span> <span className="text-muted-foreground"><Name>{p ? name(p) : ''}</Name>{b ? <> · <Name>{name(b)}</Name></> : null}{e.synagogue ? <> · <Name>{e.synagogue}</Name></> : null}</span></div>
                <div className="text-xs text-muted-foreground tabular-nums shrink-0">{e.date || t('noDate')}</div>
              </li>); })}
          </ul>
        )}
      </Card>
    </div>
  );
}
