// Turns an English name into a stable key: "Lech Lecha" -> "lech-lecha".
export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Makes a key unique against an existing list of keys by adding -2, -3, ...
export function uniqueKey(base, existingKeys) {
  const taken = new Set(existingKeys);
  const root = base || 'item';
  let key = root;
  let i = 2;
  while (taken.has(key)) key = `${root}-${i++}`;
  return key;
}
