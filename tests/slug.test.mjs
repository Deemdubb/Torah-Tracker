// Tests for src/lib/slug.js (admin key generation).
// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { slugify, uniqueKey } from '../src/lib/slug.js';

test('slugify lower-cases, drops apostrophes and joins words with dashes', () => {
  assert.equal(slugify('Lech Lecha'), 'lech-lecha');
  assert.equal(slugify("Revi'i"), 'revii');
  assert.equal(slugify('Nevi’im'), 'neviim');
  assert.equal(slugify('Shvi"i'), 'shvii');
  assert.equal(slugify('  Bava   Kamma!! '), 'bava-kamma');
  assert.equal(slugify('Shmuel Alef (I)'), 'shmuel-alef-i');
  assert.equal(slugify('Perek 15'), 'perek-15');
  assert.equal(slugify('ABC'), 'abc');
});

test('slugify handles empty, null and non-Latin input', () => {
  assert.equal(slugify(''), '');
  assert.equal(slugify(null), '');
  assert.equal(slugify(undefined), '');
  assert.equal(slugify('בראשית'), '', 'Hebrew-only text has no slug');
  assert.equal(slugify('---'), '');
});

test('uniqueKey returns the base when free and adds -2, -3, ... when taken', () => {
  assert.equal(uniqueKey('noach', []), 'noach');
  assert.equal(uniqueKey('noach', ['bereishis']), 'noach');
  assert.equal(uniqueKey('noach', ['noach']), 'noach-2');
  assert.equal(uniqueKey('noach', ['noach', 'noach-2']), 'noach-3');
  assert.equal(uniqueKey('noach', new Set(['noach', 'noach-2', 'noach-3'])), 'noach-4');
});

test('uniqueKey falls back to "item" for an empty base and keeps that fallback when numbering', () => {
  assert.equal(uniqueKey('', []), 'item');
  assert.equal(uniqueKey(undefined, []), 'item');
  assert.equal(uniqueKey('', ['item']), 'item-2');
  assert.equal(uniqueKey('', ['item', 'item-2']), 'item-3');
});

test('uniqueKey never collides with the seeded reference keys', () => {
  const refs = JSON.parse(readFileSync(new URL('../src/data/referenceData.json', import.meta.url), 'utf8'));
  const parKeys = refs.parshiyot.map((p) => p.key);
  const k = uniqueKey(slugify('Noach'), parKeys);
  assert.ok(!parKeys.includes(k));
  assert.equal(k, 'noach-2');
  const bookKeys = refs.books.map((b) => b.key);
  assert.equal(uniqueKey(`gemara-${slugify('Brachos')}`, bookKeys), 'gemara-brachos-2');
  assert.equal(uniqueKey(`gemara-${slugify('Kinim')}`, bookKeys), 'gemara-kinim');
});
