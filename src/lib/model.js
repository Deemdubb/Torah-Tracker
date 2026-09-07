// Pure helpers that turn the database lists + progress into what the screens show.
// No React here, so it is easy to test.
//
// Progress is a list of "completions": one row every time an item (a perek, a daf, an aliyah) is learned.
// The same item can appear many times = learned many times. In memory we keep counts:
//   pm : Map<"book|parashah", Map<item, count>>
// "Learned" for progress bars means count >= 1. A sefer shows "x2" when every item has count >= 2.

export const scopeKey = (bookKey, parashahKey = '') => `${bookKey}|${parashahKey || ''}`;
export const logKey = (bookKey, parashahKey, aliyahKey) => `${bookKey}|${parashahKey}|${aliyahKey}`;

const bySort = (a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || String(a.key).localeCompare(String(b.key));
const byKey = (arr) => Object.fromEntries(arr.map((x) => [x.key, x]));

export function buildIndex(refs) {
  const categories = [...(refs.categories || [])].sort(bySort);
  const sections = [...(refs.sections || [])].sort(bySort);
  const books = [...(refs.books || [])].sort(bySort);
  const parshiyot = [...(refs.parshiyot || [])].sort(bySort);
  const aliyot = [...(refs.aliyot || [])].sort(bySort);
  return {
    categories, sections, books, parshiyot, aliyot,
    cat: byKey(categories), sec: byKey(sections), book: byKey(books), par: byKey(parshiyot), ali: byKey(aliyot),
    studyAliyot: aliyot.filter((a) => a.in_study !== false),
    regularAliyot: aliyot.filter((a) => !a.is_extra), // hosafos are extras: shown, but not part of "all aliyos"
    sectionsOf: (catKey) => sections.filter((s) => s.category_key === catKey),
    booksOf: (catKey, secKey = '') => books.filter((b) => b.category_key === catKey && (b.section_key || '') === (secKey || '')),
    booksOfCategory: (catKey) => books.filter((b) => b.category_key === catKey),
    parshiyotOf: (bookKey) => parshiyot.filter((p) => p.book_key === bookKey),
    torahBooks: () => books.filter((b) => b.track_mode === 'parshiyot'),
  };
}

// Items of a plain book: "1".."N" for chapters, "2".."N" for pages.
export function bookItems(book) {
  const first = Number(book.first_item) || 1;
  const last = Number(book.item_count) || 0;
  const items = [];
  for (let n = first; n <= last; n++) items.push(String(n));
  return items;
}

// ---- counts ----
export const countOf = (pm, scope, item) => pm.get(scopeKey(scope.book_key, scope.parashah_key))?.get(String(item)) || 0;

// How many of `keys` have been learned at least once.
function learnedIn(counts, keys) {
  if (!counts) return 0;
  let n = 0;
  for (const k of keys) if ((counts.get(k) || 0) > 0) n++;
  return n;
}
// The smallest count among `keys`: how many times the whole set was learned in full.
function cyclesIn(counts, keys) {
  if (!keys.length) return 0;
  let min = Infinity;
  for (const k of keys) { const c = counts?.get(k) || 0; if (c < min) min = c; if (min === 0) return 0; }
  return min === Infinity ? 0 : min;
}
const studyAliyahKeys = (idx) => idx.studyAliyot.map((a) => a.key);

export function bookTotals(idx, book, pm) {
  if (book.track_mode === 'parshiyot') {
    const ps = idx.parshiyotOf(book.key);
    const keys = studyAliyahKeys(idx);
    let completed = 0, cycles = ps.length ? Infinity : 0;
    for (const p of ps) {
      const counts = pm.get(scopeKey(book.key, p.key));
      completed += learnedIn(counts, keys);
      cycles = Math.min(cycles, cyclesIn(counts, keys));
    }
    return { total: ps.length * keys.length, completed, cycles: cycles === Infinity ? 0 : cycles };
  }
  const items = bookItems(book);
  const counts = pm.get(scopeKey(book.key));
  return { total: items.length, completed: learnedIn(counts, items), cycles: cyclesIn(counts, items) };
}

function sum(list, fn) {
  let total = 0, completed = 0;
  for (const x of list) { const t = fn(x); total += t.total; completed += t.completed; }
  return { total, completed };
}
export const sectionTotals = (idx, sec, pm) => sum(idx.booksOf(sec.category_key, sec.key), (b) => bookTotals(idx, b, pm));
export const categoryTotals = (idx, cat, pm) => sum(idx.booksOfCategory(cat.key), (b) => bookTotals(idx, b, pm));

const enc = encodeURIComponent;
export const studyPath = {
  cat: (c) => `/study/${enc(c.key)}`,
  sec: (c, s) => `/study/${enc(c.key)}/${enc(s.key)}`,
  book: (c, s, b) => (s ? `/study/${enc(c.key)}/${enc(s.key)}/${enc(b.key)}` : `/study/${enc(c.key)}/${enc(b.key)}`),
  par: (c, s, b, p) => `${studyPath.book(c, s, b)}/${enc(p.key)}`,
};

// parts = URL segments after /study, e.g. ["tanach","torah","tanach-bereishis","noach"]
export function resolveStudyPath(parts, idx, pm) {
  const item = (row, path, totals) => ({ row, key: row.key, path, ...totals });
  if (parts.length === 0) {
    return { type: 'categories', crumbs: [], items: idx.categories.map((c) => item(c, studyPath.cat(c), categoryTotals(idx, c, pm))) };
  }
  const cat = idx.cat[parts[0]];
  if (!cat) return null;
  const catCrumb = { row: cat, path: studyPath.cat(cat) };

  if (parts.length === 1) {
    if (cat.has_sections) {
      const secs = idx.sectionsOf(cat.key);
      if (!secs.length && !idx.booksOfCategory(cat.key).length) return { type: 'placeholder', title: cat, crumbs: [] };
      return { type: 'sections', title: cat, crumbs: [], items: secs.map((s) => item(s, studyPath.sec(cat, s), sectionTotals(idx, s, pm))) };
    }
    const books = idx.booksOfCategory(cat.key); // no sections: every sefer of the category, whatever its old section was
    if (!books.length) return { type: 'placeholder', title: cat, crumbs: [] };
    return { type: 'books', title: cat, crumbs: [], items: books.map((b) => item(b, studyPath.book(cat, null, b), bookTotals(idx, b, pm))) };
  }

  let sec = null, book, rest, crumbs;
  if (cat.has_sections) {
    sec = idx.sec[parts[1]];
    if (!sec || sec.category_key !== cat.key) return null;
    if (parts.length === 2) {
      return { type: 'books', title: sec, crumbs: [catCrumb], items: idx.booksOf(cat.key, sec.key).map((b) => item(b, studyPath.book(cat, sec, b), bookTotals(idx, b, pm))) };
    }
    book = idx.book[parts[2]]; rest = parts.slice(3);
    crumbs = [catCrumb, { row: sec, path: studyPath.sec(cat, sec) }];
  } else {
    book = idx.book[parts[1]]; rest = parts.slice(2);
    crumbs = [catCrumb];
  }
  if (!book || book.category_key !== cat.key) return null;

  if (book.track_mode === 'parshiyot') {
    const ps = idx.parshiyotOf(book.key);
    const keys = studyAliyahKeys(idx);
    if (rest.length === 0) {
      return {
        type: 'parshiyot', title: book, crumbs,
        items: ps.map((p) => { const counts = pm.get(scopeKey(book.key, p.key)); return item(p, studyPath.par(cat, sec, book, p), { total: keys.length, completed: learnedIn(counts, keys), cycles: cyclesIn(counts, keys) }); }),
      };
    }
    const par = idx.par[rest[0]];
    if (!par || par.book_key !== book.key) return null;
    return {
      type: 'chumash_aliyot', book, parashah: par, aliyot: idx.studyAliyot, ranges: par.aliyah_ranges || [],
      scope: { book_key: book.key, parashah_key: par.key }, crumbs: [...crumbs, { row: book, path: studyPath.book(cat, sec, book) }],
    };
  }
  if (rest.length) return null;
  return { type: 'leaves', title: book, book, leafType: cat.leaf_type || 'perek', items: bookItems(book), scope: { book_key: book.key, parashah_key: '' }, crumbs };
}

export const aliyosPath = {
  book: (b) => `/aliyos/${enc(b.key)}`,
  par: (b, p) => `/aliyos/${enc(b.key)}/${enc(p.key)}`,
};

// parts = URL segments after /aliyos, e.g. ["tanach-bereishis","noach"]
// logMap : Map<"book|parashah|aliyah", row[]>  (one honor can have several entries)
export function resolveAliyosPath(parts, idx, logMap) {
  const all = idx.regularAliyot;
  const has = (b, p, a) => (logMap.get(logKey(b.key, p.key, a.key))?.length || 0) > 0;
  const countPar = (b, p) => all.filter((a) => has(b, p, a)).length;
  if (parts.length === 0) {
    return {
      type: 'sefarim', crumbs: [],
      items: idx.torahBooks().map((b) => {
        const ps = idx.parshiyotOf(b.key);
        let completed = 0; for (const p of ps) completed += countPar(b, p);
        return { row: b, key: b.key, path: aliyosPath.book(b), total: ps.length * all.length, completed };
      }),
    };
  }
  const book = idx.book[parts[0]];
  if (!book || book.track_mode !== 'parshiyot') return null;
  if (parts.length === 1) {
    return { type: 'parshiyot', title: book, crumbs: [], items: idx.parshiyotOf(book.key).map((p) => ({ row: p, key: p.key, path: aliyosPath.par(book, p), total: all.length, completed: countPar(book, p) })) };
  }
  const par = idx.par[parts[1]];
  if (!par || par.book_key !== book.key) return null;
  return { type: 'aliyot', book, parashah: par, partner: par.pair_key ? idx.par[par.pair_key] || null : null, aliyot: idx.aliyot, regular: all, crumbs: [{ row: book, path: aliyosPath.book(book) }] };
}

// Builds the in-memory count map from completion rows.
export function progressMapFrom(rows) {
  const pm = new Map();
  for (const r of rows || []) {
    const k = scopeKey(r.book_key, r.parashah_key || '');
    if (!pm.has(k)) pm.set(k, new Map());
    const counts = pm.get(k);
    const item = String(r.item);
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  return pm;
}
// Groups aliyah entries by honor, newest date first.
export function logMapFrom(rows) {
  const m = new Map();
  for (const r of rows || []) {
    const k = logKey(r.book_key, r.parashah_key, r.aliyah_key);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  for (const list of m.values()) list.sort((a, b) => String(b.date || b.created_at || '').localeCompare(String(a.date || a.created_at || '')));
  return m;
}
export const allEntries = (logMap) => [...logMap.values()].flat();

// Helpers used by the admin screens to keep sort_order tidy within one group.
export function siblingsOf(idx, table, row) {
  if (table === 'categories') return idx.categories;
  if (table === 'sections') return idx.sections.filter((s) => s.category_key === row.category_key);
  if (table === 'books') return idx.books.filter((b) => b.category_key === row.category_key && (b.section_key || '') === (row.section_key || ''));
  if (table === 'parshiyot') return idx.parshiyot.filter((p) => p.book_key === row.book_key);
  if (table === 'aliyot') return idx.aliyot;
  return [];
}
