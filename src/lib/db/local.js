// Local backend: everything is saved in this browser's localStorage.
// Used when no Supabase keys are configured. The single user is an admin.
import seed from '@/data/referenceData.json';

const KEYS = { refs: 'tt.refs', progress: 'tt.progress', log: 'tt.aliyah_log' };
const REF_TABLES = ['categories', 'sections', 'books', 'parshiyot', 'aliyot'];
const LOCAL_USER = { id: 'local', email: '', role: 'admin', local: true };

const read = (k, fallback) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const cloneSeed = () => JSON.parse(JSON.stringify(Object.fromEntries(REF_TABLES.map((t) => [t, seed[t] || []]))));
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
const now = () => new Date().toISOString();

function loadRefs() {
  let r = read(KEYS.refs, null);
  if (!r || !Array.isArray(r.categories)) { r = cloneSeed(); write(KEYS.refs, r); }
  for (const t of REF_TABLES) if (!Array.isArray(r[t])) r[t] = [];
  // Lists saved before "connected parshiyos" existed: fill the pairs in from the built-in data once.
  if (r.parshiyot.length && !r.parshiyot.some((p) => 'pair_key' in p)) {
    const seedPairs = Object.fromEntries((seed.parshiyot || []).map((p) => [p.key, p.pair_key || '']));
    r.parshiyot = r.parshiyot.map((p) => ({ ...p, pair_key: seedPairs[p.key] || '' }));
    write(KEYS.refs, r);
  }
  // Lists saved before pesukim existed: add perek lengths, aliyah pesukim ranges, and the extra "hosafah" aliyah once.
  if (r.parshiyot.length && !r.parshiyot.some((p) => 'aliyah_pesukim' in p)) {
    const seedPar = Object.fromEntries((seed.parshiyot || []).map((p) => [p.key, p]));
    const seedBook = Object.fromEntries((seed.books || []).map((b) => [b.key, b]));
    r.parshiyot = r.parshiyot.map((p) => ({ ...p, aliyah_pesukim: seedPar[p.key]?.aliyah_pesukim || {} }));
    r.books = r.books.map((b) => (seedBook[b.key]?.pesukim ? { ...b, pesukim: seedBook[b.key].pesukim } : b));
    for (const a of seed.aliyot || []) if (a.is_extra && !r.aliyot.some((x) => x.key === a.key)) r.aliyot.push({ ...a });
    write(KEYS.refs, r);
  }
  return r;
}

// Removing a parent removes its children too (like a database cascade).
function cascadeRemove(r, table, key) {
  if (table === 'categories') {
    r.sections = r.sections.filter((s) => s.category_key !== key);
    const bookKeys = r.books.filter((b) => b.category_key === key).map((b) => b.key);
    r.books = r.books.filter((b) => b.category_key !== key);
    r.parshiyot = r.parshiyot.filter((p) => !bookKeys.includes(p.book_key));
  } else if (table === 'sections') {
    const bookKeys = r.books.filter((b) => b.section_key === key).map((b) => b.key);
    r.books = r.books.filter((b) => b.section_key !== key);
    r.parshiyot = r.parshiyot.filter((p) => !bookKeys.includes(p.book_key));
  } else if (table === 'books') {
    r.parshiyot = r.parshiyot.filter((p) => p.book_key !== key);
  }
  r[table] = r[table].filter((x) => x.key !== key);
}

export function createLocalBackend() {
  return {
    mode: 'local',
    auth: {
      async getUser() { return LOCAL_USER; },
      onChange() { return () => {}; },
      async signInWithEmail() {},
      async signInWithPassword() {},
      async signUpWithPassword() { return true; },
      async updatePassword() {},
      async resendConfirmation() {},
      async resetPassword() {},
      async signInWithGoogle() {},
      async signOut() {},
    },
    refs: {
      async load() { return loadRefs(); },
      async save(table, row) {
        const r = loadRefs();
        const i = r[table].findIndex((x) => x.key === row.key);
        const saved = i >= 0 ? { ...r[table][i], ...row } : { ...row };
        if (i >= 0) r[table][i] = saved; else r[table].push(saved);
        write(KEYS.refs, r);
        return saved;
      },
      async remove(table, key) {
        const r = loadRefs();
        cascadeRemove(r, table, key);
        write(KEYS.refs, r);
      },
      async replaceAll(data) {
        const r = Object.fromEntries(REF_TABLES.map((t) => [t, Array.isArray(data[t]) ? data[t] : []]));
        write(KEYS.refs, r);
        return r;
      },
      async seedDefaults() { const r = cloneSeed(); write(KEYS.refs, r); return r; },
    },
    progress: {
      async load() { return read(KEYS.progress, []); },
      // One row per completion. The same item may appear many times (learned twice = two rows).
      async add(rows) {
        const cur = read(KEYS.progress, []);
        for (const row of rows) cur.push({ book_key: row.book_key, parashah_key: row.parashah_key || '', item: String(row.item), completed_at: row.completed_at || now() });
        write(KEYS.progress, cur);
      },
      // Removes the most recent completion of one item.
      async removeOne({ book_key, parashah_key = '', item }) {
        const cur = read(KEYS.progress, []);
        let best = -1;
        cur.forEach((r, i) => { if (r.book_key === book_key && (r.parashah_key || '') === parashah_key && String(r.item) === String(item) && (best < 0 || String(r.completed_at) >= String(cur[best].completed_at))) best = i; });
        if (best >= 0) { cur.splice(best, 1); write(KEYS.progress, cur); }
      },
      async remove({ book_key, parashah_key = '', items }) {
        const cur = read(KEYS.progress, []);
        const set = items ? new Set(items.map(String)) : null;
        write(KEYS.progress, cur.filter((r) => !(r.book_key === book_key && (r.parashah_key || '') === parashah_key && (!set || set.has(String(r.item))))));
      },
    },
    aliyahLog: {
      async load() { return read(KEYS.log, []); },
      // Several entries per honor are allowed. A row with an id updates that entry; without an id it is a new entry.
      async save(row) {
        const cur = read(KEYS.log, []);
        const { id, ...rest } = row; // a new entry arrives with id undefined; it must not overwrite the fresh id
        const i = id ? cur.findIndex((r) => r.id === id) : -1;
        const saved = i >= 0 ? { ...cur[i], ...rest, id, combined: !!row.combined } : { ...rest, id: newId(), created_at: now(), combined: !!row.combined };
        if (i >= 0) cur[i] = saved; else cur.push(saved);
        write(KEYS.log, cur);
        return saved;
      },
      async remove(id) { write(KEYS.log, read(KEYS.log, []).filter((r) => r.id !== id)); },
    },
    sheetLink: null, // live Google Sheet links need cloud mode
    pendingCount: () => 0,
    async flush() {},
    async diagnose() { return [{ name: 'storage', ok: true, ms: 0, info: 'local mode' }]; },
  };
}
