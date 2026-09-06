// Hebrew gematria (number → Hebrew letters), used for פרק and דף labels.
const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];

export function toGematria(num) {
  const n0 = Number(num);
  if (!n0 || n0 <= 0) return '';
  let n = n0;
  const h = Math.floor(n / 100);
  n -= h * 100;
  const t = Math.floor(n / 10);
  const o = n % 10;
  let lower;
  if (t === 1 && o === 5) lower = 'טו';
  else if (t === 1 && o === 6) lower = 'טז';
  else lower = TENS[t] + ONES[o];
  return (HUNDREDS[Math.min(h, 9)] || '') + lower;
}
