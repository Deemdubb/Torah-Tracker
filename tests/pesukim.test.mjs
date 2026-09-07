// Tests for src/lib/pesukim.js and for the Torah structure data in src/data/referenceData.json.
// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildIndex } from '../src/lib/model.js';
import { isRange, presetRange, entryRange, hasCustomRange, parashahRange, pasukOrdinal, rangeProblem, countPesukim, rangeText, torahTotal, pesukimStats, hasPesukim } from '../src/lib/pesukim.js';

const refs = JSON.parse(readFileSync(new URL('../src/data/referenceData.json', import.meta.url), 'utf8'));
const idx = buildIndex(refs);
const bereishis = idx.book['tanach-bereishis'], devarim = idx.book['tanach-devarim'];
const parBereishis = idx.par['bereishis'], shoftim = idx.par['shoftim'];

test('isRange accepts four positive whole numbers only', () => {
  assert.equal(isRange([1, 1, 2, 3]), true);
  assert.equal(isRange([1, 1, 2]), false);
  assert.equal(isRange([1, 0, 2, 3]), false);
  assert.equal(isRange([1, 1, 2, 3.5]), false);
  assert.equal(isRange([1, 1, 2, NaN]), false);
  assert.equal(isRange(null), false);
});

test('presetRange reads the usual range of an honor; the maftir of V\'Zos Habrachah has none', () => {
  assert.deepEqual(presetRange(parBereishis, 'kohen'), [1, 1, 2, 3]);
  assert.deepEqual(presetRange(parBereishis, 'maftir'), [6, 5, 6, 8]);
  assert.equal(presetRange(parBereishis, 'hosafah'), null);
  assert.equal(presetRange(idx.par['vzos-habrachah'], 'maftir'), null);
  assert.equal(presetRange(null, 'kohen'), null);
});

test('pasukOrdinal counts through the perakim and rejects places that do not exist', () => {
  assert.equal(pasukOrdinal(bereishis, 1, 1), 1);
  assert.equal(pasukOrdinal(bereishis, 1, 31), 31);
  assert.equal(pasukOrdinal(bereishis, 2, 1), 32);
  assert.equal(pasukOrdinal(bereishis, 1, 32), null, 'perek 1 has 31 pesukim');
  assert.equal(pasukOrdinal(bereishis, 51, 1), null, 'no perek 51');
  assert.equal(pasukOrdinal(bereishis, 0, 1), null);
  assert.equal(pasukOrdinal(idx.book['mishnah-avos'] || { pesukim: null }, 1, 1), null, 'no perek lengths outside Chumash');
});

test('countPesukim and rangeProblem', () => {
  assert.equal(countPesukim(bereishis, [1, 1, 2, 3]), 34);
  assert.equal(countPesukim(bereishis, [6, 5, 6, 8]), 4);
  assert.equal(countPesukim(bereishis, [1, 5, 1, 5]), 1);
  assert.equal(rangeProblem(bereishis, [1, 1, 2, 3]), null);
  assert.equal(rangeProblem(bereishis, [1, 1, 2, '']), 'incomplete');
  assert.equal(rangeProblem(bereishis, [1, 1, 99, 3]), 'outside');
  assert.equal(rangeProblem(bereishis, [2, 3, 1, 1]), 'order');
  assert.equal(countPesukim(bereishis, [2, 3, 1, 1]), null);
});

test('rangeText uses gematria in Hebrew modes and digits in English', () => {
  assert.equal(rangeText('he', [1, 1, 2, 3]), 'א:א–ב:ג');
  assert.equal(rangeText('en-he', [5, 25, 6, 8]), 'ה:כה–ו:ח');
  assert.equal(rangeText('en', [1, 1, 2, 3]), '1:1–2:3');
  assert.equal(rangeText('en', null), '');
});

test('entryRange prefers the entry\'s own range and falls back to the honor\'s usual one', () => {
  const plain = { aliyah_key: 'kohen' };
  const own = { aliyah_key: 'kohen', from_perek: 1, from_pasuk: 1, to_perek: 1, to_pasuk: 10 };
  assert.equal(hasCustomRange(plain), false);
  assert.equal(hasCustomRange(own), true);
  assert.equal(hasCustomRange({ aliyah_key: 'kohen', from_perek: 1, from_pasuk: null, to_perek: 1, to_pasuk: 10 }), false);
  assert.deepEqual(entryRange(plain, parBereishis), [1, 1, 2, 3]);
  assert.deepEqual(entryRange(own, parBereishis), [1, 1, 1, 10]);
  assert.deepEqual(entryRange({ aliyah_key: 'kohen', from_perek: '1', from_pasuk: '1', to_perek: '1', to_pasuk: '10' }, parBereishis), [1, 1, 1, 10], 'strings from a form are fine');
});

test('parashahRange spans from the first study aliyah to the last', () => {
  assert.deepEqual(parashahRange(parBereishis, idx.studyAliyot), [1, 1, 6, 8]);
  assert.equal(parashahRange({ aliyah_pesukim: {} }, idx.studyAliyot), null);
});

test('torahTotal and pesukimStats (total, and different pesukim covered)', () => {
  assert.equal(torahTotal(idx), 5846);
  const shlishi = presetRange(shoftim, 'shlishi');
  const n = countPesukim(devarim, shlishi);
  assert.ok(n > 0);
  const entries = [
    { book_key: 'tanach-devarim', parashah_key: 'shoftim', aliyah_key: 'shlishi' },
    { book_key: 'tanach-devarim', parashah_key: 'shoftim', aliyah_key: 'shlishi' }, // the same aliyah in another year: counted twice, covered once
    { book_key: 'tanach-devarim', parashah_key: 'shoftim', aliyah_key: 'hosafah', from_perek: shlishi[0], from_pasuk: shlishi[1], to_perek: shlishi[0], to_pasuk: shlishi[1] }, // one pasuk inside shlishi
    { book_key: 'tanach-devarim', parashah_key: 'shoftim', aliyah_key: 'hosafah' }, // a hosafah without a range cannot be counted
    { book_key: 'tanach-bereishis', parashah_key: 'bereishis', aliyah_key: 'maftir' },
  ];
  const s = pesukimStats(entries, idx);
  assert.equal(s.total, n * 2 + 1 + 4);
  assert.equal(s.counted, 4);
  assert.equal(s.distinct, n + 4);
  assert.equal(s.torahTotal, 5846);
  assert.deepEqual(pesukimStats([], idx), { total: 0, counted: 0, distinct: 0, torahTotal: 5846 });
});

// ---------- the data itself ----------
test('every Chumash sefer has perek lengths that match its perek count', () => {
  for (const b of idx.torahBooks()) {
    assert.ok(hasPesukim(b), `${b.key} has pesukim`);
    assert.equal(b.pesukim.length, b.item_count, `${b.key}: one length per perek`);
    assert.ok(b.pesukim.every((n) => Number.isInteger(n) && n > 0));
  }
  assert.equal(idx.books.filter((b) => b.track_mode !== 'parshiyot').some((b) => b.pesukim), false, 'no perek lengths outside Chumash');
});

test('the aliyos of every parashah follow each other with no gap, and the parshiyot cover each sefer from start to end', () => {
  const study = idx.studyAliyot.map((a) => a.key);
  for (const b of idx.torahBooks()) {
    const ps = idx.parshiyotOf(b.key);
    let expectNext = 1; // ordinal where the next aliyah must start
    for (const p of ps) {
      for (const k of study) {
        const r = presetRange(p, k);
        assert.ok(r, `${p.key} ${k} has a range`);
        assert.equal(rangeProblem(b, r), null, `${p.key} ${k} range is valid`);
        assert.equal(pasukOrdinal(b, r[0], r[1]), expectNext, `${p.key} ${k} starts right after the previous aliyah`);
        expectNext = pasukOrdinal(b, r[2], r[3]) + 1;
      }
      const m = presetRange(p, 'maftir');
      if (m) {
        const last = presetRange(p, study[study.length - 1]);
        assert.equal(rangeProblem(b, m), null);
        assert.deepEqual([m[2], m[3]], [last[2], last[3]], `${p.key}: the maftir ends where the parashah ends`);
        assert.ok(pasukOrdinal(b, m[0], m[1]) >= pasukOrdinal(b, last[0], last[1]), `${p.key}: the maftir lies inside the last aliyah`);
        assert.ok(countPesukim(b, m) >= 3, `${p.key}: a maftir has at least three pesukim`);
      }
    }
    assert.equal(expectNext - 1, b.pesukim.reduce((s, n) => s + n, 0), `${b.key}: the parshiyot end at the last pasuk of the sefer`);
  }
});

test('the extra aliyah "hosafah" exists, is not a study aliyah, and is left out of the regular aliyos', () => {
  const h = idx.ali['hosafah'];
  assert.ok(h);
  assert.equal(h.is_extra, true);
  assert.equal(h.in_study, false);
  assert.equal(idx.regularAliyot.some((a) => a.key === 'hosafah'), false);
  assert.equal(idx.regularAliyot.length, 8);
  assert.equal(idx.aliyot.length, 9);
});
