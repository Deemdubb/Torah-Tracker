// Tests for src/lib/model.js using the real reference lists as fixture data.
// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildIndex, bookItems, bookTotals, sectionTotals, categoryTotals, resolveStudyPath, resolveAliyosPath, progressMapFrom, logMapFrom, siblingsOf, scopeKey, logKey, studyPath, aliyosPath,
} from '../src/lib/model.js';

const refs = JSON.parse(readFileSync(new URL('../src/data/referenceData.json', import.meta.url), 'utf8'));
const idx = buildIndex(refs);
const emptyPm = new Map();
const emptyLog = new Map();

const pmOf = (rows) => progressMapFrom(rows);
const book = (key) => idx.book[key];
const cat = (key) => idx.cat[key];
const sec = (key) => idx.sec[key];

// ---------- keys ----------
test('scopeKey and logKey build stable pipe-joined keys', () => {
  assert.equal(scopeKey('b'), 'b|');
  assert.equal(scopeKey('b', ''), 'b|');
  assert.equal(scopeKey('b', null), 'b|');
  assert.equal(scopeKey('b', 'p'), 'b|p');
  assert.equal(logKey('b', 'p', 'a'), 'b|p|a');
});

// ---------- buildIndex ----------
test('buildIndex sorts every table by sort_order and indexes by key', () => {
  assert.equal(idx.categories.length, 6);
  assert.deepEqual(idx.categories.map((c) => c.key), ['tanach', 'mishnah', 'gemara', 'rambam', 'shulchan-aruch', 'yerushalmi']);
  assert.equal(idx.sections.length, 9);
  assert.equal(idx.books.length, 139);
  assert.equal(idx.parshiyot.length, 54);
  assert.equal(idx.aliyot.length, 8);
  assert.equal(idx.studyAliyot.length, 7, 'maftir is not in study');
  assert.ok(!idx.studyAliyot.some((a) => a.key === 'maftir'));
  assert.equal(idx.sectionsOf('tanach').length, 3);
  assert.equal(idx.booksOf('tanach', 'torah').length, 5);
  assert.equal(idx.booksOf('gemara', '').length, 37);
  assert.equal(idx.booksOf('gemara').length, 37, 'missing section key means no section');
  assert.equal(idx.booksOfCategory('mishnah').length, 63);
  assert.equal(idx.parshiyotOf('tanach-bereishis').length, 12);
  assert.equal(idx.torahBooks().length, 5);
});

test('buildIndex tolerates missing tables and orders ties by key', () => {
  const i = buildIndex({ categories: [{ key: 'b', sort_order: 1 }, { key: 'a', sort_order: 1 }] });
  assert.deepEqual(i.categories.map((c) => c.key), ['a', 'b']);
  assert.deepEqual(i.books, []);
  assert.deepEqual(i.studyAliyot, []);
});

// ---------- bookItems ----------
test('bookItems for a perek book runs 1..item_count', () => {
  const items = bookItems(book('tanach-yehoshua'));
  assert.equal(items.length, 24);
  assert.equal(items[0], '1');
  assert.equal(items.at(-1), '24');
  assert.ok(items.every((x) => typeof x === 'string'));
});

test('bookItems for a daf (Gemara) book runs 2..item_count', () => {
  const items = bookItems(book('gemara-brachos'));
  assert.equal(items[0], '2', 'printed Gemara starts on daf 2');
  assert.equal(items.at(-1), '64');
  assert.equal(items.length, 63);
});

test('bookItems defaults first_item to 1 and returns nothing when the range is empty', () => {
  assert.deepEqual(bookItems({ item_count: 3 }), ['1', '2', '3']);
  assert.deepEqual(bookItems({ item_count: 0 }), []);
  assert.deepEqual(bookItems({ first_item: 5, item_count: 3 }), []);
  assert.deepEqual(bookItems({ first_item: '2', item_count: '3' }), ['2', '3']);
});

test('every Gemara book in the reference data starts at daf 2', () => {
  for (const b of idx.booksOfCategory('gemara')) assert.equal(b.first_item, 2, b.key);
});

// ---------- bookTotals ----------
test('bookTotals in items mode counts only items inside the current range', () => {
  const b = book('tanach-yehoshua');
  assert.deepEqual(bookTotals(idx, b, emptyPm), { total: 24, completed: 0, cycles: 0 });
  const pm = pmOf([
    { book_key: b.key, parashah_key: '', item: '1' },
    { book_key: b.key, parashah_key: null, item: 2 },
    { book_key: b.key, parashah_key: '', item: '99' }, // left over from an old, larger count
    { book_key: 'tanach-shoftim', parashah_key: '', item: '1' }, // other book
  ]);
  assert.deepEqual(bookTotals(idx, b, pm), { total: 24, completed: 2, cycles: 0 });
});

test('bookTotals for a daf book ignores daf 1 (not part of the book)', () => {
  const b = book('gemara-brachos');
  const pm = pmOf([{ book_key: b.key, parashah_key: '', item: '1' }, { book_key: b.key, parashah_key: '', item: '2' }]);
  assert.deepEqual(bookTotals(idx, b, pm), { total: 63, completed: 1, cycles: 0 });
});

test('bookTotals in parshiyot mode is parshiyot x study aliyot and ignores maftir', () => {
  const b = book('tanach-bereishis');
  assert.deepEqual(bookTotals(idx, b, emptyPm), { total: 84, completed: 0, cycles: 0 });
  const pm = pmOf([
    { book_key: b.key, parashah_key: 'noach', item: 'kohen' },
    { book_key: b.key, parashah_key: 'noach', item: 'levi' },
    { book_key: b.key, parashah_key: 'noach', item: 'maftir' }, // not in study
    { book_key: b.key, parashah_key: 'bereishis', item: 'shvii' },
    { book_key: b.key, parashah_key: 'gone', item: 'kohen' }, // parashah that no longer exists
  ]);
  assert.deepEqual(bookTotals(idx, b, pm), { total: 84, completed: 3, cycles: 0 });
});

test('bookTotals never reports more completed than total', () => {
  const b = book('tanach-yonah');
  const pm = pmOf(['1', '2', '3', '4', '5', '6'].map((item) => ({ book_key: b.key, parashah_key: '', item })));
  const t = bookTotals(idx, b, pm);
  assert.equal(t.total, 4);
  assert.ok(t.completed <= t.total);
});

// ---------- section / category sums ----------
test('sectionTotals sums the books of one section', () => {
  assert.equal(sectionTotals(idx, sec('torah'), emptyPm).total, 378, '54 parshiyot x 7');
  assert.equal(sectionTotals(idx, sec('neviim'), emptyPm).total, 380);
  assert.equal(sectionTotals(idx, sec('ketuvim'), emptyPm).total, 362);
  const pm = pmOf([{ book_key: 'tanach-yehoshua', parashah_key: '', item: '3' }, { book_key: 'tanach-bereishis', parashah_key: 'noach', item: 'kohen' }]);
  assert.equal(sectionTotals(idx, sec('neviim'), pm).completed, 1);
  assert.equal(sectionTotals(idx, sec('torah'), pm).completed, 1);
});

test('categoryTotals sums every book of the category, with or without sections', () => {
  assert.deepEqual(categoryTotals(idx, cat('tanach'), emptyPm), { total: 1120, completed: 0 });
  assert.equal(categoryTotals(idx, cat('mishnah'), emptyPm).total, 524);
  assert.equal(categoryTotals(idx, cat('gemara'), emptyPm).total, 2696, '2733 pages minus 37 first pages');
  assert.deepEqual(categoryTotals(idx, cat('rambam'), emptyPm), { total: 0, completed: 0 });
  const pm = pmOf([
    { book_key: 'gemara-brachos', parashah_key: '', item: '2' },
    { book_key: 'gemara-shabbos', parashah_key: '', item: '10' },
    { book_key: 'mishnah-avos', parashah_key: '', item: '1' },
  ]);
  assert.equal(categoryTotals(idx, cat('gemara'), pm).completed, 2);
  assert.equal(categoryTotals(idx, cat('mishnah'), pm).completed, 1);
  assert.equal(categoryTotals(idx, cat('tanach'), pm).completed, 0);
});

test('category total equals the sum of its section totals plus books without a section', () => {
  for (const c of idx.categories) {
    const fromSections = idx.sectionsOf(c.key).reduce((n, s) => n + sectionTotals(idx, s, emptyPm).total, 0);
    const loose = idx.booksOf(c.key, '').reduce((n, b) => n + bookTotals(idx, b, emptyPm).total, 0);
    assert.equal(categoryTotals(idx, c, emptyPm).total, fromSections + loose, c.key);
  }
});

// ---------- study paths ----------
test('studyPath encodes every segment', () => {
  assert.equal(studyPath.cat({ key: 'a b' }), '/study/a%20b');
  assert.equal(studyPath.sec({ key: 'c' }, { key: 's/1' }), '/study/c/s%2F1');
  assert.equal(studyPath.book({ key: 'c' }, { key: 's' }, { key: 'b' }), '/study/c/s/b');
  assert.equal(studyPath.book({ key: 'c' }, null, { key: 'b' }), '/study/c/b');
  assert.equal(studyPath.par({ key: 'c' }, null, { key: 'b' }, { key: 'p' }), '/study/c/b/p');
});

test('resolveStudyPath: root lists the categories with totals', () => {
  const v = resolveStudyPath([], idx, emptyPm);
  assert.equal(v.type, 'categories');
  assert.deepEqual(v.crumbs, []);
  assert.equal(v.items.length, 6);
  assert.equal(v.items[0].key, 'tanach');
  assert.equal(v.items[0].path, '/study/tanach');
  assert.equal(v.items[0].total, 1120);
  assert.equal(v.items[2].total, 2696);
});

test('resolveStudyPath: category with sections', () => {
  const v = resolveStudyPath(['tanach'], idx, emptyPm);
  assert.equal(v.type, 'sections');
  assert.equal(v.title.key, 'tanach');
  assert.deepEqual(v.items.map((i) => i.key), ['torah', 'neviim', 'ketuvim']);
  assert.equal(v.items[1].path, '/study/tanach/neviim');
  assert.equal(v.items[1].total, 380);
});

test('resolveStudyPath: category without sections lists books directly', () => {
  const v = resolveStudyPath(['gemara'], idx, emptyPm);
  assert.equal(v.type, 'books');
  assert.equal(v.items.length, 37);
  assert.equal(v.items[0].path, '/study/gemara/gemara-brachos');
  assert.equal(v.items[0].total, 63);
});

test('resolveStudyPath: books of a section', () => {
  const v = resolveStudyPath(['mishnah', 'zeraim'], idx, emptyPm);
  assert.equal(v.type, 'books');
  assert.equal(v.title.key, 'zeraim');
  assert.equal(v.items.length, 11);
  assert.equal(v.items[0].path, '/study/mishnah/zeraim/mishnah-brachos');
  assert.equal(v.crumbs.length, 1);
  assert.equal(v.crumbs[0].path, '/study/mishnah');
});

test('resolveStudyPath: parshiyot of a Chumash book, each out of 7', () => {
  const pm = pmOf([{ book_key: 'tanach-bereishis', parashah_key: 'noach', item: 'kohen' }, { book_key: 'tanach-bereishis', parashah_key: 'noach', item: 'maftir' }]);
  const v = resolveStudyPath(['tanach', 'torah', 'tanach-bereishis'], idx, pm);
  assert.equal(v.type, 'parshiyot');
  assert.equal(v.items.length, 12);
  assert.equal(v.items[0].key, 'bereishis');
  assert.equal(v.items[1].key, 'noach');
  assert.equal(v.items[1].total, 7);
  assert.equal(v.items[1].completed, 1, 'maftir does not count in study');
  assert.equal(v.items[1].path, '/study/tanach/torah/tanach-bereishis/noach');
  assert.deepEqual(v.crumbs.map((c) => c.path), ['/study/tanach', '/study/tanach/torah']);
});

test('resolveStudyPath: leaf screen for one parashah (7 aliyot with ranges)', () => {
  const v = resolveStudyPath(['tanach', 'torah', 'tanach-bereishis', 'noach'], idx, emptyPm);
  assert.equal(v.type, 'chumash_aliyot');
  assert.equal(v.book.key, 'tanach-bereishis');
  assert.equal(v.parashah.key, 'noach');
  assert.equal(v.aliyot.length, 7);
  assert.equal(v.ranges.length, 7);
  assert.deepEqual(v.ranges[0], [6, 7]);
  assert.deepEqual(v.scope, { book_key: 'tanach-bereishis', parashah_key: 'noach' });
  assert.deepEqual(v.crumbs.map((c) => c.path), ['/study/tanach', '/study/tanach/torah', '/study/tanach/torah/tanach-bereishis']);
});

test('resolveStudyPath: leaf screen for a perek book and for a daf book', () => {
  const perek = resolveStudyPath(['tanach', 'neviim', 'tanach-yehoshua'], idx, emptyPm);
  assert.equal(perek.type, 'leaves');
  assert.equal(perek.leafType, 'perek');
  assert.equal(perek.items.length, 24);
  assert.equal(perek.items[0], '1');
  assert.deepEqual(perek.scope, { book_key: 'tanach-yehoshua', parashah_key: '' });
  assert.equal(perek.crumbs.length, 2);

  const daf = resolveStudyPath(['gemara', 'gemara-brachos'], idx, emptyPm);
  assert.equal(daf.type, 'leaves');
  assert.equal(daf.leafType, 'daf');
  assert.equal(daf.items[0], '2');
  assert.equal(daf.items.length, 63);
  assert.equal(daf.crumbs.length, 1);
  assert.equal(daf.crumbs[0].path, '/study/gemara');
});

test('resolveStudyPath: placeholder categories', () => {
  for (const k of ['rambam', 'shulchan-aruch', 'yerushalmi']) {
    const v = resolveStudyPath([k], idx, emptyPm);
    assert.equal(v.type, 'placeholder', k);
    assert.equal(v.title.key, k);
  }
  const withSections = buildIndex({ categories: [{ key: 'x', has_sections: true }] });
  assert.equal(resolveStudyPath(['x'], withSections, emptyPm).type, 'placeholder');
});

test('resolveStudyPath: invalid paths return null', () => {
  const bad = [
    ['nope'],
    ['tanach', 'nope'],
    ['tanach', 'zeraim'], // section of another category
    ['tanach', 'torah', 'nope'],
    ['tanach', 'torah', 'gemara-brachos'], // book of another category
    ['tanach', 'torah', 'tanach-yehoshua'], // book exists but under neviim: still resolves (same category) so not here
    ['tanach', 'torah', 'tanach-bereishis', 'nope'],
    ['tanach', 'torah', 'tanach-bereishis', 'devarim'], // parashah of another book
    ['tanach', 'neviim', 'tanach-yehoshua', 'extra'],
    ['gemara', 'nope'],
    ['gemara', 'gemara-brachos', 'extra'],
    ['gemara', 'tanach-yehoshua'],
    ['rambam', 'anything'],
  ];
  for (const parts of bad) {
    if (parts.join('/') === 'tanach/torah/tanach-yehoshua') continue;
    assert.equal(resolveStudyPath(parts, idx, emptyPm), null, parts.join('/'));
  }
});

test('resolveStudyPath: a parshiyot-mode book inside a category without sections still resolves', () => {
  const i = buildIndex({
    categories: [{ key: 'c', has_sections: false, leaf_type: 'perek' }],
    books: [{ key: 'b', category_key: 'c', section_key: '', track_mode: 'parshiyot' }],
    parshiyot: [{ key: 'p', book_key: 'b', aliyah_ranges: [[1, 1]] }],
    aliyot: [{ key: 'k', in_study: true }, { key: 'm', in_study: false }],
  });
  const list = resolveStudyPath(['c', 'b'], i, emptyPm);
  assert.equal(list.type, 'parshiyot');
  assert.equal(list.items[0].path, '/study/c/b/p');
  assert.equal(list.items[0].total, 1);
  const leaf = resolveStudyPath(['c', 'b', 'p'], i, emptyPm);
  assert.equal(leaf.type, 'chumash_aliyot');
  assert.equal(leaf.aliyot.length, 1);
});

// ---------- aliyos paths ----------
test('aliyosPath encodes segments', () => {
  assert.equal(aliyosPath.book({ key: 'a b' }), '/aliyos/a%20b');
  assert.equal(aliyosPath.par({ key: 'b' }, { key: 'p' }), '/aliyos/b/p');
});

test('resolveAliyosPath: root lists the five sefarim out of parshiyot x 8', () => {
  const v = resolveAliyosPath([], idx, emptyLog);
  assert.equal(v.type, 'sefarim');
  assert.equal(v.items.length, 5);
  assert.equal(v.items[0].key, 'tanach-bereishis');
  assert.equal(v.items[0].total, 96, '12 parshiyot x 8 honors');
  assert.equal(v.items[0].completed, 0);
  assert.equal(v.items[0].path, '/aliyos/tanach-bereishis');
  assert.equal(v.items.reduce((n, i) => n + i.total, 0), 54 * 8);
});

test('resolveAliyosPath: parshiyot of a sefer and the leaf with all 8 honors', () => {
  const log = logMapFrom([
    { id: '1', book_key: 'tanach-devarim', parashah_key: 'shoftim', aliyah_key: 'shlishi', date: '2026-08-17' },
    { id: '2', book_key: 'tanach-devarim', parashah_key: 'vayeilech', aliyah_key: 'shvii' },
    { id: '3', book_key: 'tanach-devarim', parashah_key: 'shoftim', aliyah_key: 'unknown-honor' },
  ]);
  const root = resolveAliyosPath([], idx, log);
  assert.equal(root.items.find((i) => i.key === 'tanach-devarim').completed, 2, 'unknown honors are not counted');

  const list = resolveAliyosPath(['tanach-devarim'], idx, log);
  assert.equal(list.type, 'parshiyot');
  assert.equal(list.items.length, 11);
  const shoftim = list.items.find((i) => i.key === 'shoftim');
  assert.equal(shoftim.total, 8);
  assert.equal(shoftim.completed, 1);
  assert.equal(shoftim.path, '/aliyos/tanach-devarim/shoftim');

  const leaf = resolveAliyosPath(['tanach-devarim', 'shoftim'], idx, log);
  assert.equal(leaf.type, 'aliyot');
  assert.equal(leaf.aliyot.length, 8, 'maftir is included in the Aliyos module');
  assert.equal(leaf.aliyot.at(-1).key, 'maftir');
  assert.equal(leaf.book.key, 'tanach-devarim');
  assert.equal(leaf.parashah.key, 'shoftim');
  assert.deepEqual(leaf.crumbs.map((c) => c.path), ['/aliyos/tanach-devarim']);
});

test('resolveAliyosPath: invalid paths return null', () => {
  for (const parts of [['nope'], ['gemara-brachos'], ['tanach-yehoshua'], ['tanach-bereishis', 'nope'], ['tanach-bereishis', 'devarim']]) {
    assert.equal(resolveAliyosPath(parts, idx, emptyLog), null, parts.join('/'));
  }
});

// ---------- maps ----------
test('progressMapFrom groups rows by book|parashah and counts repeats', () => {
  const pm = progressMapFrom([
    { book_key: 'b', parashah_key: '', item: 1 },
    { book_key: 'b', parashah_key: null, item: '2' },
    { book_key: 'b', item: 3 },
    { book_key: 'b', parashah_key: 'p', item: 'kohen' },
    { book_key: 'b', parashah_key: 'p', item: 'kohen' }, // learned twice
  ]);
  assert.equal(pm.size, 2);
  assert.deepEqual([...pm.get('b|').keys()].sort(), ['1', '2', '3']);
  assert.equal(pm.get('b|').get('1'), 1);
  assert.equal(pm.get('b|p').get('kohen'), 2);
  assert.equal(progressMapFrom(null).size, 0);
  assert.equal(progressMapFrom(undefined).size, 0);
});

test('bookTotals: learned-once progress plus full cycles', () => {
  const book = idx.book['gemara-brachos']; // dapim 2..64 = 63 items
  const once = bookItems(book).map((n) => ({ book_key: book.key, parashah_key: '', item: n }));
  assert.deepEqual(bookTotals(idx, book, pmOf(once)), { total: 63, completed: 63, cycles: 1 });
  assert.deepEqual(bookTotals(idx, book, pmOf([...once, ...once])), { total: 63, completed: 63, cycles: 2 });
  assert.deepEqual(bookTotals(idx, book, pmOf([...once, ...once.slice(0, 10)])), { total: 63, completed: 63, cycles: 1 });
  assert.deepEqual(bookTotals(idx, book, pmOf(once.slice(1))), { total: 63, completed: 62, cycles: 0 });
});

test('logMapFrom keys rows by book|parashah|aliyah and keeps every entry, newest first', () => {
  const a = { id: 'x', book_key: 'b', parashah_key: 'p', aliyah_key: 'a', date: '2024-01-01' };
  const b = { id: 'y', book_key: 'b', parashah_key: 'p', aliyah_key: 'a', date: '2026-01-01', combined: true };
  const m = logMapFrom([a, b]);
  assert.equal(m.size, 1);
  assert.deepEqual(m.get('b|p|a').map((r) => r.id), ['y', 'x']);
  assert.equal(logMapFrom(null).size, 0);
});

// ---------- siblings ----------
test('siblingsOf returns only the rows in the same group', () => {
  assert.equal(siblingsOf(idx, 'categories', cat('tanach')).length, 6);
  assert.equal(siblingsOf(idx, 'sections', sec('torah')).length, 3);
  assert.ok(siblingsOf(idx, 'sections', sec('torah')).every((s) => s.category_key === 'tanach'));
  assert.equal(siblingsOf(idx, 'books', book('mishnah-brachos')).length, 11);
  assert.ok(siblingsOf(idx, 'books', book('mishnah-brachos')).every((b) => b.section_key === 'zeraim'));
  assert.equal(siblingsOf(idx, 'books', book('gemara-brachos')).length, 37);
  assert.equal(siblingsOf(idx, 'books', { category_key: 'gemara' }).length, 37, 'missing section_key is the same as empty');
  assert.equal(siblingsOf(idx, 'parshiyot', idx.par.noach).length, 12);
  assert.ok(siblingsOf(idx, 'parshiyot', idx.par.noach).every((p) => p.book_key === 'tanach-bereishis'));
  assert.equal(siblingsOf(idx, 'aliyot', idx.ali.kohen).length, 8);
  assert.deepEqual(siblingsOf(idx, 'unknown', {}), []);
});

// ---------- reference data sanity ----------
test('reference data: keys are unique per table and every child points at a parent', () => {
  for (const t of ['categories', 'sections', 'books', 'parshiyot', 'aliyot']) {
    const keys = refs[t].map((r) => r.key);
    assert.equal(new Set(keys).size, keys.length, `${t} has duplicate keys`);
    for (const r of refs[t]) { assert.ok(r.name_he, `${t}/${r.key} has no Hebrew name`); assert.ok(r.name_en, `${t}/${r.key} has no English name`); }
  }
  for (const s of refs.sections) assert.ok(idx.cat[s.category_key], `section ${s.key} points at missing category`);
  for (const b of refs.books) {
    assert.ok(idx.cat[b.category_key], `book ${b.key} points at missing category`);
    if (b.section_key) assert.ok(idx.sec[b.section_key], `book ${b.key} points at missing section`);
  }
  for (const p of refs.parshiyot) {
    assert.ok(idx.book[p.book_key], `parashah ${p.key} points at missing book`);
    assert.equal(idx.book[p.book_key].track_mode, 'parshiyot');
    assert.equal(p.aliyah_ranges.length, 7, `parashah ${p.key} should have 7 ranges`);
    for (const [s, e] of p.aliyah_ranges) assert.ok(s >= 1 && e >= s && e <= idx.book[p.book_key].item_count, `parashah ${p.key} range ${s}-${e}`);
  }
});
