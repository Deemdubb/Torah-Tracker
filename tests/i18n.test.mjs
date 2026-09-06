// Tests for src/lib/i18n.js and src/lib/hebrew.js.
// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toGematria } from '../src/lib/hebrew.js';
import { LANG_MODES, STRINGS, uiLang, titleLang, dirOf, t, displayName, leafLabel, rangeLabel } from '../src/lib/i18n.js';

const MODES = ['he', 'en-he', 'en'];

// ---------- gematria ----------
test('toGematria: units, tens, hundreds', () => {
  assert.equal(toGematria(1), 'א');
  assert.equal(toGematria(9), 'ט');
  assert.equal(toGematria(10), 'י');
  assert.equal(toGematria(11), 'יא');
  assert.equal(toGematria(20), 'כ');
  assert.equal(toGematria(24), 'כד');
  assert.equal(toGematria(64), 'סד');
  assert.equal(toGematria(99), 'צט');
  assert.equal(toGematria(100), 'ק');
  assert.equal(toGematria(101), 'קא');
  assert.equal(toGematria(150), 'קנ');
  assert.equal(toGematria(176), 'קעו');
  assert.equal(toGematria(200), 'ר');
  assert.equal(toGematria(400), 'ת');
  assert.equal(toGematria(500), 'תק');
  assert.equal(toGematria(900), 'תתק');
});

test('toGematria: 15 and 16 avoid spelling the Divine name', () => {
  assert.equal(toGematria(15), 'טו');
  assert.equal(toGematria(16), 'טז');
  assert.equal(toGematria(115), 'קטו');
  assert.equal(toGematria(116), 'קטז');
  assert.equal(toGematria(215), 'רטו');
});

test('toGematria: zero, negatives, non-numbers and strings', () => {
  assert.equal(toGematria(0), '');
  assert.equal(toGematria(-5), '');
  assert.equal(toGematria('abc'), '');
  assert.equal(toGematria(null), '');
  assert.equal(toGematria(undefined), '');
  assert.equal(toGematria('12'), 'יב', 'numeric strings work (items are stored as strings)');
});

// ---------- modes ----------
test('LANG_MODES lists the three modes in order', () => {
  assert.deepEqual(LANG_MODES.map((m) => m.mode), MODES);
  for (const m of LANG_MODES) { assert.ok(m.label); assert.ok(m.title); }
});

test('uiLang / titleLang / dirOf per mode', () => {
  assert.equal(uiLang('he'), 'he'); assert.equal(titleLang('he'), 'he'); assert.equal(dirOf('he'), 'rtl');
  assert.equal(uiLang('en-he'), 'en'); assert.equal(titleLang('en-he'), 'he'); assert.equal(dirOf('en-he'), 'ltr');
  assert.equal(uiLang('en'), 'en'); assert.equal(titleLang('en'), 'en'); assert.equal(dirOf('en'), 'ltr');
});

// ---------- strings ----------
test('STRINGS: Hebrew and English have exactly the same keys and no empty values', () => {
  const he = Object.keys(STRINGS.he).sort();
  const en = Object.keys(STRINGS.en).sort();
  assert.deepEqual(he, en);
  for (const lang of ['he', 'en']) for (const [k, v] of Object.entries(STRINGS[lang])) assert.ok(typeof v === 'string' && v.trim(), `${lang}.${k} is empty`);
});

test('STRINGS: the spec strings are present with the expected text', () => {
  assert.equal(STRINGS.he.tabStudy, 'לימוד'); assert.equal(STRINGS.en.tabStudy, 'Study');
  assert.equal(STRINGS.he.tabAliyos, 'עליות'); assert.equal(STRINGS.en.tabAliyos, 'Aliyos');
  assert.equal(STRINGS.he.markAll, 'סמן הכל'); assert.equal(STRINGS.en.markAll, 'Mark all');
  assert.equal(STRINGS.he.unmarkAll, 'בטל הכל'); assert.equal(STRINGS.en.unmarkAll, 'Unmark all');
  assert.equal(STRINGS.he.comingSoon, 'תוכן יתווסף בקרוב'); assert.equal(STRINGS.en.comingSoon, 'Coming soon');
  assert.equal(STRINGS.he.modalSave, 'שמור'); assert.equal(STRINGS.en.modalDelete, 'Delete');
  assert.equal(STRINGS.he.notFound, 'לא נמצא'); assert.equal(STRINGS.en.notFound, 'Not found');
});

test('t() picks Hebrew UI only in he mode and falls back to English, then the key', () => {
  assert.equal(t('he', 'tabStudy'), 'לימוד');
  assert.equal(t('en-he', 'tabStudy'), 'Study');
  assert.equal(t('en', 'tabStudy'), 'Study');
  assert.equal(t('he', 'no_such_key'), 'no_such_key');
  assert.equal(t('en', 'no_such_key'), 'no_such_key');
});

// ---------- names ----------
test('displayName uses Hebrew names in he and en-he, English names in en', () => {
  const row = { name_he: 'בראשית', name_en: 'Bereishis' };
  assert.equal(displayName('he', row), 'בראשית');
  assert.equal(displayName('en-he', row), 'בראשית');
  assert.equal(displayName('en', row), 'Bereishis');
});

test('displayName falls back to the other language and handles missing rows', () => {
  assert.equal(displayName('en', { name_he: 'נח' }), 'נח');
  assert.equal(displayName('he', { name_en: 'Noach' }), 'Noach');
  assert.equal(displayName('he', {}), '');
  assert.equal(displayName('he', null), '');
  assert.equal(displayName('en', undefined), '');
});

// ---------- labels ----------
test('leafLabel per mode for perek and daf', () => {
  assert.equal(leafLabel('he', 'perek', 1), 'פרק א');
  assert.equal(leafLabel('he', 'daf', 2), 'דף ב');
  assert.equal(leafLabel('he', 'perek', '15'), 'פרק טו');
  assert.equal(leafLabel('en-he', 'perek', 1), 'פרק א', 'en-he keeps Hebrew labels');
  assert.equal(leafLabel('en-he', 'daf', 64), 'דף סד');
  assert.equal(leafLabel('en', 'perek', 1), 'Perek 1');
  assert.equal(leafLabel('en', 'daf', 2), 'Daf 2');
  assert.equal(leafLabel('en', 'daf', '64'), 'Daf 64');
  assert.equal(leafLabel('he', undefined, 3), 'פרק ג', 'unknown leaf type means perek');
  assert.equal(leafLabel('en', undefined, 3), 'Perek 3');
});

test('rangeLabel per mode, collapsing equal ends', () => {
  assert.equal(rangeLabel('he', 1, 3), 'פרק א–ג');
  assert.equal(rangeLabel('he', 7, 7), 'פרק ז');
  assert.equal(rangeLabel('en-he', 6, 7), 'פרק ו–ז');
  assert.equal(rangeLabel('en', 1, 3), 'Perek 1–3');
  assert.equal(rangeLabel('en', 11, 11), 'Perek 11');
  assert.equal(rangeLabel('he', null, 3), '');
  assert.equal(rangeLabel('en', 1, undefined), '');
});
