// Supabase backend: data is saved in your Supabase project (free tier).
// Each user only sees their own progress (row-level security in supabase/schema.sql).
// Progress writes that fail because you are offline are queued and retried later.
import { createClient } from '@supabase/supabase-js';
import seed from '@/data/referenceData.json';
import { csvToObjects } from '@/lib/csvParse';

const REF_TABLES = ['categories', 'sections', 'books', 'parshiyot', 'aliyot'];
const QUEUE_KEY = 'tt.queue';

const readQueue = () => { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; } };
const writeQueue = (q) => localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
const isNetworkError = (e) => /fetch|network|offline|load failed/i.test(String(e?.message || e));
const check = ({ data, error }) => { if (error) throw error; return data; };

// A request that hangs is treated as failed after this long, so the app can fall back to saved data.
const REQUEST_TIMEOUT_MS = 20000;
const fetchWithTimeout = (input, init = {}) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  if (init.signal) { if (init.signal.aborted) ctrl.abort(); else init.signal.addEventListener('abort', () => ctrl.abort(), { once: true }); }
  return fetch(input, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(timer));
};

export function createSupabaseBackend(url, key) {
  const sb = createClient(url, key, {
    // The library's default "navigator lock" is known to stall in Safari on iPhone. One app tab at a time is fine for us.
    auth: { lock: (_name, _timeout, fn) => fn(), persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    global: { fetch: fetchWithTimeout },
  });
  const redirectTo = () => window.location.origin + window.location.pathname;

  // The user's role is remembered on the device so the app can open at once; the real role is checked in the background.
  const roleKey = (id) => `tt.role.${id}`;
  const listeners = new Set();
  const notify = (u) => listeners.forEach((cb) => { try { cb(u); } catch (e) { console.error(e); } });
  async function withProfile(user, { background = true } = {}) {
    if (!user) return null;
    let cached = null;
    try { cached = localStorage.getItem(roleKey(user.id)); } catch { /* ignore */ }
    const fresh = async () => {
      const { data } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
      const role = data?.role || 'user';
      try { localStorage.setItem(roleKey(user.id), role); } catch { /* ignore */ }
      return role;
    };
    if (cached && background) {
      fresh().then((role) => { if (role !== cached) notify({ id: user.id, email: user.email, role }); }).catch(() => {});
      return { id: user.id, email: user.email, role: cached };
    }
    let role = 'user';
    try { role = await fresh(); } catch { role = cached || 'user'; }
    return { id: user.id, email: user.email, role };
  }
  // The signed-in user's id from the locally cached session (no extra network round trip per tap).
  async function uid() {
    const { data } = await sb.auth.getSession();
    return data?.session?.user?.id;
  }

  // All list reads come back as plain-text CSV (see src/lib/csvParse.js for why), then become objects here.
  async function readCsv(query) {
    const { data, error } = await query.csv();
    if (error) throw error;
    return csvToObjects(data);
  }
  // Supabase returns at most 1000 rows per request. A serious learner has more progress rows
  // than that (Gemara alone is 2696 pages), so read in pages until a page comes back short.
  const PAGE = 1000;
  async function fetchAll(query) {
    const out = [];
    for (let from = 0; ; from += PAGE) {
      const rows = await readCsv(query().range(from, from + PAGE - 1));
      out.push(...rows);
      if (rows.length < PAGE) return out;
    }
  }

  async function exec(op) {
    if (op.type === 'progress.add') {
      const user_id = await uid();
      const rows = op.rows.map((r) => ({ user_id, book_key: r.book_key, parashah_key: r.parashah_key || '', item: String(r.item), ...(r.completed_at ? { completed_at: r.completed_at } : {}) }));
      check(await sb.from('study_progress').insert(rows));
    } else if (op.type === 'progress.removeOne') {
      const { book_key, parashah_key = '', item } = op.scope;
      const latest = check(await sb.from('study_progress').select('id').eq('book_key', book_key).eq('parashah_key', parashah_key).eq('item', String(item)).order('completed_at', { ascending: false }).limit(1));
      if (latest?.[0]) check(await sb.from('study_progress').delete().eq('id', latest[0].id));
    } else if (op.type === 'progress.remove') {
      const { book_key, parashah_key = '', items } = op.scope;
      let q = sb.from('study_progress').delete().eq('book_key', book_key).eq('parashah_key', parashah_key);
      if (items) q = q.in('item', items.map(String));
      check(await q);
    }
  }
  async function flush() {
    const q = readQueue();
    if (!q.length) return;
    const rest = [];
    for (const op of q) {
      try { await exec(op); } catch (e) { if (isNetworkError(e)) rest.push(op); }
    }
    writeQueue(rest);
  }
  async function runOrQueue(op) {
    try { await exec(op); } catch (e) {
      if (isNetworkError(e)) { writeQueue([...readQueue(), op]); return; }
      throw e;
    }
  }
  window.addEventListener('online', () => { flush().catch(() => {}); });

  async function replaceAll(data) {
    for (const t of [...REF_TABLES].reverse()) check(await sb.from(t).delete().neq('key', ''));
    for (const t of REF_TABLES) if (data[t]?.length) check(await sb.from(t).insert(data[t]));
    return Object.fromEntries(REF_TABLES.map((t) => [t, data[t] || []]));
  }

  return {
    mode: 'supabase',
    auth: {
      async getUser() {
        const { data } = await sb.auth.getSession();
        return withProfile(data?.session?.user);
      },
      onChange(cb) {
        listeners.add(cb);
        const { data } = sb.auth.onAuthStateChange((event, session) => {
          // Email links land on #access_token=... which HashRouter would read as a page name.
          const h = window.location.hash;
          if (/^#(access_token|refresh_token|error)=/.test(h)) {
            window.location.hash = /type=recovery/.test(h) ? '#/settings' : (event === 'SIGNED_IN' || session ? '#/study' : '#/login');
          }
          if (event === 'PASSWORD_RECOVERY') window.location.hash = '#/settings'; // the Settings screen has the new-password box
          withProfile(session?.user).then(cb);
        });
        return () => { listeners.delete(cb); data.subscription.unsubscribe(); };
      },
      async signInWithEmail(email) { check(await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } })); },
      async signInWithPassword(email, password) { check(await sb.auth.signInWithPassword({ email, password })); },
      // Returns true when the account is ready to use, false when Supabase first wants the email confirmed.
      async signUpWithPassword(email, password) {
        const data = check(await sb.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } }));
        return !!data?.session;
      },
      async updatePassword(password) { check(await sb.auth.updateUser({ password })); },
      async resetPassword(email) { check(await sb.auth.resetPasswordForEmail(email, { redirectTo: redirectTo() })); },
      async resendConfirmation(email) { check(await sb.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo() } })); },
      async signInWithGoogle() { check(await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo() } })); },
      async signOut() { await sb.auth.signOut(); },
    },
    refs: {
      async load() {
        // all five lists at the same time instead of one after another
        const results = await Promise.all(REF_TABLES.map((t) => readCsv(sb.from(t).select('*').order('sort_order'))));
        return Object.fromEntries(REF_TABLES.map((t, i) => [t, results[i]]));
      },
      async save(table, row) { return check(await sb.from(table).upsert(row, { onConflict: 'key' }).select().single()); },
      async remove(table, key) { check(await sb.from(table).delete().eq('key', key)); },
      replaceAll,
      async seedDefaults() { return replaceAll(seed); },
    },
    progress: {
      async load() { return fetchAll(() => sb.from('study_progress').select('book_key,parashah_key,item,completed_at').order('completed_at').order('id')); },
      add(rows) { return runOrQueue({ type: 'progress.add', rows }); },
      removeOne(scope) { return runOrQueue({ type: 'progress.removeOne', scope }); },
      remove(scope) { return runOrQueue({ type: 'progress.remove', scope }); },
    },
    aliyahLog: {
      async load() { return fetchAll(() => sb.from('aliyah_log').select('*').order('created_at').order('id')); },
      // Several entries per honor are allowed. With an id the entry is updated, without one a new entry is added.
      async save(row) {
        const payload = { book_key: row.book_key, parashah_key: row.parashah_key, aliyah_key: row.aliyah_key, date: row.date || null, synagogue: row.synagogue || '', notes: row.notes || '', combined: !!row.combined };
        if (row.id) return check(await sb.from('aliyah_log').update(payload).eq('id', row.id).select().single());
        const user_id = await uid();
        return check(await sb.from('aliyah_log').insert({ user_id, ...payload }).select().single());
      },
      async remove(id) { check(await sb.from('aliyah_log').delete().eq('id', id)); },
    },
    sheetLink: {
      async get() {
        const user_id = await uid();
        const { data } = await sb.from('sheet_links').select('token').eq('user_id', user_id).maybeSingle();
        return data?.token || null;
      },
      async set(token) {
        const user_id = await uid();
        check(await sb.from('sheet_links').upsert({ user_id, token }, { onConflict: 'user_id' }));
        return token;
      },
      base: (token) => `${url.replace(/\/$/, '')}/functions/v1/sheet-export?token=${token}`,
      // type: all (default) | study | aliyos | parashah | books. lang: he | en | en-he. tz: the user's time zone.
      url: (token, { type, lang, tz } = {}) => {
        const q = new URLSearchParams({ token });
        if (type) q.set('type', type);
        if (lang) q.set('lang', lang);
        if (tz) q.set('tz', tz);
        return `${url.replace(/\/$/, '')}/functions/v1/sheet-export?${q.toString().replace(/%2F/g, '/')}`; // keep America/New_York readable
      },
    },
    pendingCount: () => readQueue().length,
    flush,
    // Runs a few small requests and reports what works. Shown in Settings -> Connection check.
    async diagnose() {
      const steps = [];
      const step = async (name, fn) => { const t0 = performance.now(); try { const info = await fn(); steps.push({ name, ok: true, ms: Math.round(performance.now() - t0), info }); } catch (e) { steps.push({ name, ok: false, ms: Math.round(performance.now() - t0), info: e?.message || String(e) }); } };
      await step('auth', async () => { const r = await fetchWithTimeout(`${url}/auth/v1/health`, { headers: { apikey: key } }); return `HTTP ${r.status}`; });
      await step('session', async () => { const { data } = await sb.auth.getSession(); return data?.session ? `user ${data.session.user.email}` : 'no session'; });
      await step('lists (text)', async () => { const rows = await readCsv(sb.from('books').select('key,name_he')); return `${rows.length} rows`; });
      await step('lists (json)', async () => { const { data, error } = await sb.from('books').select('key,name_he'); if (error) throw error; return `${data.length} rows`; });
      await step('progress (text)', async () => { const rows = await readCsv(sb.from('study_progress').select('*').limit(200)); return `${rows.length} rows`; });
      await step('function', async () => { const r = await fetchWithTimeout(`${url}/functions/v1/sheet-export`); return `HTTP ${r.status}`; });
      return steps;
    },
  };
}
