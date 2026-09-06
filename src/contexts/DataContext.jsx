// Holds the Torah lists, the user's progress and aliyah log in memory,
// and talks to the database. Screens only use this, never the db directly.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/db';
import { useAuth } from './AuthContext';
import { buildIndex, logMapFrom, logKey, progressMapFrom, siblingsOf } from '@/lib/model';

const DataContext = createContext(null);
const EMPTY = { categories: [], sections: [], books: [], parshiyot: [], aliyot: [] };

export function DataProvider({ children }) {
  const { user, isAdmin } = useAuth();
  const [refs, setRefs] = useState(EMPTY);
  const [rows, setRows] = useState([]);
  const pm = useMemo(() => progressMapFrom(rows), [rows]);
  const [logMap, setLogMap] = useState(() => new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      let r = await db.refs.load();
      if ((!r.categories || r.categories.length === 0) && isAdmin) r = await db.refs.seedDefaults();
      const [progress, log] = await Promise.all([db.progress.load(), db.aliyahLog.load()]);
      setRefs(r); setRows(progress || []); setLogMap(logMapFrom(log));
    } catch (e) { console.error(e); setError(e.message || String(e)); }
    finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { if (user) reload(); }, [user, reload]);
  useEffect(() => {
    const tick = () => setPendingCount(db.pendingCount());
    tick();
    const id = setInterval(tick, 3000);
    db.flush?.().catch(() => {});
    return () => clearInterval(id);
  }, []);

  const idx = useMemo(() => buildIndex(refs), [refs]);

  // ---- study progress ----
  const rowKey = (r) => `${r.book_key}|${r.parashah_key || ''}|${r.item}`;
  const inScope = (scope) => (r) => r.book_key === scope.book_key && (r.parashah_key || '') === (scope.parashah_key || '');
  const newRow = (scope, item) => ({ book_key: scope.book_key, parashah_key: scope.parashah_key || '', item: String(item), completed_at: new Date().toISOString() });

  const toggleItem = useCallback(async (scope, item) => {
    const key = rowKey({ ...scope, item: String(item) });
    const had = rows.some((r) => rowKey(r) === key);
    const prev = rows;
    setRows(had ? rows.filter((r) => rowKey(r) !== key) : [...rows, newRow(scope, item)]);
    try {
      if (had) await db.progress.remove({ ...scope, items: [String(item)] });
      else await db.progress.add([{ ...scope, item: String(item) }]);
    } catch (e) { console.error(e); setError(e.message || String(e)); setRows(prev); }
  }, [rows]);

  const setAllItems = useCallback(async (scope, items, on) => {
    const prev = rows;
    const isMine = inScope(scope);
    if (on) {
      const have = new Set(rows.filter(isMine).map((r) => String(r.item)));
      const missing = items.filter((i) => !have.has(String(i)));
      setRows([...rows, ...missing.map((i) => newRow(scope, i))]);
      try { if (missing.length) await db.progress.add(missing.map((i) => ({ ...scope, item: String(i) }))); }
      catch (e) { console.error(e); setError(e.message || String(e)); setRows(prev); }
    } else {
      setRows(rows.filter((r) => !isMine(r)));
      try { await db.progress.remove({ ...scope }); }
      catch (e) { console.error(e); setError(e.message || String(e)); setRows(prev); }
    }
  }, [rows]);

  // ---- aliyah log ----
  const saveAliyah = useCallback(async (row) => {
    const saved = await db.aliyahLog.save(row);
    setLogMap((prev) => { const m = new Map(prev); m.set(logKey(saved.book_key, saved.parashah_key, saved.aliyah_key), saved); return m; });
    return saved;
  }, []);
  const removeAliyah = useCallback(async (row) => {
    await db.aliyahLog.remove(row.id);
    setLogMap((prev) => { const m = new Map(prev); m.delete(logKey(row.book_key, row.parashah_key, row.aliyah_key)); return m; });
  }, []);
  const markAllAliyos = useCallback(async (book_key, parashah_key) => {
    const missing = idx.aliyot.filter((a) => !logMap.has(logKey(book_key, parashah_key, a.key)));
    for (const a of missing) await saveAliyah({ book_key, parashah_key, aliyah_key: a.key, date: null, synagogue: '', notes: '' });
  }, [idx, logMap, saveAliyah]);

  // ---- admin: lists ----
  const saveRef = useCallback(async (table, row) => {
    const saved = await db.refs.save(table, row);
    setRefs((prev) => {
      const arr = [...(prev[table] || [])];
      const i = arr.findIndex((x) => x.key === saved.key);
      if (i >= 0) arr[i] = saved; else arr.push(saved);
      return { ...prev, [table]: arr };
    });
    return saved;
  }, []);
  const removeRef = useCallback(async (table, key) => {
    if (table === 'sections') {
      // books inside the section go with it (the database only cascades categories -> sections/books -> parshiyot)
      for (const b of idx.books.filter((b) => b.section_key === key)) await db.refs.remove('books', b.key);
    }
    await db.refs.remove(table, key);
    setRefs(await db.refs.load());
  }, [idx]);
  const reorder = useCallback(async (table, row, delta) => {
    const sibs = siblingsOf(idx, table, row);
    const i = sibs.findIndex((x) => x.key === row.key);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= sibs.length) return;
    const order = [...sibs]; [order[i], order[j]] = [order[j], order[i]];
    const changes = order.map((x, n) => ({ ...x, sort_order: n + 1 })).filter((x, n) => x.sort_order !== (Number(order[n].sort_order) || 0));
    for (const c of changes) await saveRef(table, c);
  }, [idx, saveRef]);
  const resetDefaults = useCallback(async () => { setRefs(await db.refs.seedDefaults()); }, []);
  const importRefs = useCallback(async (data) => { setRefs(await db.refs.replaceAll(data)); }, []);

  // ---- backup ----
  const exportBackup = useCallback(async () => ({
    app: 'torah-tracker', version: 1, exported_at: new Date().toISOString(),
    refs, progress: await db.progress.load(), aliyah_log: await db.aliyahLog.load(),
  }), [refs]);
  const importBackup = useCallback(async (data, { includeLists = false } = {}) => {
    if (includeLists && data.refs) await db.refs.replaceAll(data.refs);
    if (Array.isArray(data.progress) && data.progress.length) await db.progress.add(data.progress);
    for (const row of data.aliyah_log || []) {
      const { id: _id, user_id: _u, created_at: _c, ...rest } = row;
      await db.aliyahLog.save(rest);
    }
    await reload();
  }, [reload]);

  const value = useMemo(() => ({
    refs, idx, pm, progressRows: rows, logMap, loading, error, setError, reload, pendingCount,
    toggleItem, setAllItems, saveAliyah, removeAliyah, markAllAliyos,
    saveRef, removeRef, reorder, resetDefaults, importRefs, exportBackup, importBackup,
  }), [refs, idx, pm, rows, logMap, loading, error, reload, pendingCount, toggleItem, setAllItems, saveAliyah, removeAliyah, markAllAliyos, saveRef, removeRef, reorder, resetDefaults, importRefs, exportBackup, importBackup]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
