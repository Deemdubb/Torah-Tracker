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
      async add(rows) {
        const cur = read(KEYS.progress, []);
        const has = new Set(cur.map((r) => `${r.book_key}|${r.parashah_key || ''}|${r.item}`));
        for (const row of rows) {
          const k = `${row.book_key}|${row.parashah_key || ''}|${row.item}`;
          if (!has.has(k)) { cur.push({ book_key: row.book_key, parashah_key: row.parashah_key || '', item: String(row.item), completed_at: now() }); has.add(k); }
        }
        write(KEYS.progress, cur);
      },
      async remove({ book_key, parashah_key = '', items }) {
        const cur = read(KEYS.progress, []);
        const set = items ? new Set(items.map(String)) : null;
        write(KEYS.progress, cur.filter((r) => !(r.book_key === book_key && (r.parashah_key || '') === parashah_key && (!set || set.has(String(r.item))))));
      },
    },
    aliyahLog: {
      async load() { return read(KEYS.log, []); },
      async save(row) {
        const cur = read(KEYS.log, []);
        const i = cur.findIndex((r) => r.book_key === row.book_key && r.parashah_key === row.parashah_key && r.aliyah_key === row.aliyah_key);
        const saved = i >= 0 ? { ...cur[i], ...row, id: cur[i].id } : { id: newId(), created_at: now(), ...row };
        if (i >= 0) cur[i] = saved; else cur.push(saved);
        write(KEYS.log, cur);
        return saved;
      },
      async remove(id) { write(KEYS.log, read(KEYS.log, []).filter((r) => r.id !== id)); },
    },
    sheetLink: null, // live Google Sheet links need cloud mode
    pendingCount: () => 0,
    async flush() {},
  };
}
