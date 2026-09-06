// Supabase backend: data is saved in your Supabase project (free tier).
// Each user only sees their own progress (row-level security in supabase/schema.sql).
// Progress writes that fail because you are offline are queued and retried later.
import { createClient } from '@supabase/supabase-js';
import seed from '@/data/referenceData.json';

const REF_TABLES = ['categories', 'sections', 'books', 'parshiyot', 'aliyot'];
const QUEUE_KEY = 'tt.queue';

const readQueue = () => { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; } };
const writeQueue = (q) => localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
const isNetworkError = (e) => /fetch|network|offline|load failed/i.test(String(e?.message || e));
const check = ({ data, error }) => { if (error) throw error; return data; };

export function createSupabaseBackend(url, key) {
  const sb = createClient(url, key);
  const redirectTo = () => window.location.origin + window.location.pathname;

  async function withProfile(user) {
    if (!user) return null;
    const { data } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
    return { id: user.id, email: user.email, role: data?.role || 'user' };
  }
  // The signed-in user's id from the locally cached session (no extra network round trip per tap).
  async function uid() {
    const { data } = await sb.auth.getSession();
    return data?.session?.user?.id;
  }

  // Supabase returns at most 1000 rows per request. A serious learner has more progress rows
  // than that (Gemara alone is 2696 pages), so read in pages until everything is in.
  const PAGE = 1000;
  async function fetchAll(query) {
    const out = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error, count } = await query().range(from, from + PAGE - 1);
      if (error) throw error;
      out.push(...(data || []));
      const done = !data?.length || (count != null ? out.length >= count : data.length < PAGE);
      if (done) return out;
    }
  }

  async function exec(op) {
    if (op.type === 'progress.add') {
      const user_id = await uid();
      const rows = op.rows.map((r) => ({ user_id, book_key: r.book_key, parashah_key: r.parashah_key || '', item: String(r.item) }));
      check(await sb.from('study_progress').upsert(rows, { onConflict: 'user_id,book_key,parashah_key,item', ignoreDuplicates: true }));
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
        const { data } = sb.auth.onAuthStateChange((event, session) => {
          // The email sign-in link lands on #access_token=... which HashRouter would read as a page name.
          if (/^#(access_token|refresh_token|error)=/.test(window.location.hash)) {
            window.location.hash = event === 'SIGNED_IN' || session ? '#/study' : '#/login';
          }
          withProfile(session?.user).then(cb);
        });
        return () => data.subscription.unsubscribe();
      },
      async signInWithEmail(email) { check(await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } })); },
      async signInWithPassword(email, password) { check(await sb.auth.signInWithPassword({ email, password })); },
      // Returns true when the account is ready to use, false when Supabase first wants the email confirmed.
      async signUpWithPassword(email, password) {
        const data = check(await sb.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } }));
        return !!data?.session;
      },
      async updatePassword(password) { check(await sb.auth.updateUser({ password })); },
      async signInWithGoogle() { check(await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo() } })); },
      async signOut() { await sb.auth.signOut(); },
    },
    refs: {
      async load() {
        const out = {};
        for (const t of REF_TABLES) out[t] = check(await sb.from(t).select('*').order('sort_order'));
        return out;
      },
      async save(table, row) { return check(await sb.from(table).upsert(row, { onConflict: 'key' }).select().single()); },
      async remove(table, key) { check(await sb.from(table).delete().eq('key', key)); },
      replaceAll,
      async seedDefaults() { return replaceAll(seed); },
    },
    progress: {
      async load() { return fetchAll(() => sb.from('study_progress').select('book_key,parashah_key,item,completed_at', { count: 'exact' }).order('id')); },
      add(rows) { return runOrQueue({ type: 'progress.add', rows }); },
      remove(scope) { return runOrQueue({ type: 'progress.remove', scope }); },
    },
    aliyahLog: {
      async load() { return fetchAll(() => sb.from('aliyah_log').select('*', { count: 'exact' }).order('created_at').order('id')); },
      async save(row) {
        const user_id = await uid();
        const payload = { user_id, book_key: row.book_key, parashah_key: row.parashah_key, aliyah_key: row.aliyah_key, date: row.date || null, synagogue: row.synagogue || '', notes: row.notes || '' };
        return check(await sb.from('aliyah_log').upsert(payload, { onConflict: 'user_id,book_key,parashah_key,aliyah_key' }).select().single());
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
      url: (token, type) => `${url.replace(/\/$/, '')}/functions/v1/sheet-export?token=${token}&type=${type}`,
    },
    pendingCount: () => readQueue().length,
    flush,
  };
}
