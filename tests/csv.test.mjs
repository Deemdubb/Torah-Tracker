import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, csvToObjects, pgTimestampToIso } from '../src/lib/csvParse.js';

test('parseCsv handles quotes, doubled quotes, commas and line breaks inside quotes', () => {
  const rows = parseCsv('a,b,c\r\n1,"x,y","he said ""hi"""\n2,"multi\nline",z\n');
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[1].map((c) => c.value), ['1', 'x,y', 'he said "hi"']);
  assert.deepEqual(rows[2].map((c) => c.value), ['2', 'multi\nline', 'z']);
});

test('empty quoted field is an empty string, empty bare field is null', () => {
  const rows = csvToObjects('key,section_key,date\ngemara-brachos,"",\n');
  assert.deepEqual(rows, [{ key: 'gemara-brachos', section_key: '', date: null }]);
});

test('booleans, integers, json and timestamps are converted', () => {
  const text = 'key,sort_order,in_study,has_sections,aliyah_ranges,completed_at,combined\n' +
    'kohen,1,t,f,"[[1, 2], [2, 3]]","2026-09-06 12:46:30.655873+00",f\n';
  const [row] = csvToObjects(text);
  assert.equal(row.sort_order, 1);
  assert.equal(row.in_study, true);
  assert.equal(row.has_sections, false);
  assert.deepEqual(row.aliyah_ranges, [[1, 2], [2, 3]]);
  assert.equal(row.completed_at, '2026-09-06T12:46:30.655873+00:00');
  assert.equal(row.combined, false);
  assert.ok(!Number.isNaN(new Date(row.completed_at).getTime()));
});

test('item stays a string and Hebrew text passes through', () => {
  const [row] = csvToObjects('book_key,parashah_key,item,name_he\nmishnah-avos,"",1,אבות\n');
  assert.equal(row.item, '1');
  assert.equal(row.parashah_key, '');
  assert.equal(row.name_he, 'אבות');
});

test('pgTimestampToIso leaves ISO strings and dates alone', () => {
  assert.equal(pgTimestampToIso('2026-09-05'), '2026-09-05');
  assert.equal(pgTimestampToIso('2026-09-06T12:00:00.000Z'), '2026-09-06T12:00:00.000Z');
  assert.equal(pgTimestampToIso('2026-09-06 12:00:00+02'), '2026-09-06T12:00:00+02:00');
});

test('empty text gives no rows', () => {
  assert.deepEqual(csvToObjects(''), []);
  assert.deepEqual(csvToObjects('a,b\n'), []);
});
