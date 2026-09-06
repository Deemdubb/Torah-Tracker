// Hebrew gematria (numeric → Hebrew letters), used for פרקים and דפים labels.
const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת'];

export function toGematria(num) {
  if (!num || num <= 0) return '';
  let n = num;
  const h = Math.floor(n / 100);
  n -= h * 100;
  const t = Math.floor(n / 10);
  const o = n % 10;
  let lower;
  if (t === 1 && o === 5) lower = 'טו';
  else if (t === 1 && o === 6) lower = 'טז';
  else lower = TENS[t] + ONES[o];
  return (h > 0 ? HUNDREDS[Math.min(h, 4)] : '') + lower;
}
