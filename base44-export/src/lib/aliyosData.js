// Static hierarchy for the עליות (Aliyos) tracker: Sefer -> Parashah -> Aliyah.

export const ALIYAH_NAMES = ['כהן', 'לוי', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי', 'מפטיר'];

export const ALIYOT = [
  { sefer: 'בראשית', parshiyot: ['בראשית', 'נח', 'לך לך', 'וירא', 'חיי שרה', 'תולדות', 'ויצא', 'וישלח', 'וישב', 'מקץ', 'ויגש', 'ויחי'] },
  { sefer: 'שמות', parshiyot: ['שמות', 'וארא', 'בא', 'בשלח', 'יתרו', 'משפטים', 'תרומה', 'תצוה', 'כי תשא', 'ויקהל', 'פקודי'] },
  { sefer: 'ויקרא', parshiyot: ['ויקרא', 'צו', 'שמיני', 'תזריע', 'מצורע', 'אחרי מות', 'קדושים', 'אמור', 'בהר', 'בחוקותי'] },
  { sefer: 'במדבר', parshiyot: ['במדבר', 'נשא', 'בהעלותך', 'שלח לך', 'קרח', 'חקת', 'בלק', 'פינחס', 'מטות', 'מסעי'] },
  { sefer: 'דברים', parshiyot: ['דברים', 'ואתחנן', 'עקב', 'ראה', 'שופטים', 'כי תצא', 'כי תבא', 'נצבים', 'וילך', 'האזינו', 'וזאת הברכה'] },
];

const seferPath = (s) => `/aliyos/${encodeURIComponent(s.sefer)}`;

export function resolveAliyosPath(parts, logMap) {
  if (parts.length === 0) {
    return {
      type: 'sefarim', title: 'עליות', breadcrumbs: [],
      items: ALIYOT.map(s => {
        let total = s.parshiyot.length * 8, completed = 0;
        s.parshiyot.forEach(p => ALIYAH_NAMES.forEach(a => { if (logMap.has(`${s.sefer}|${p}|${a}`)) completed++; }));
        return { name: s.sefer, path: seferPath(s), total, completed };
      }),
    };
  }
  const sefer = ALIYOT.find(s => s.sefer === parts[0]);
  if (!sefer) return null;
  if (parts.length === 1) {
    return {
      type: 'parshiyot', title: sefer.sefer, breadcrumbs: [],
      items: sefer.parshiyot.map(p => {
        let completed = 0;
        ALIYAH_NAMES.forEach(a => { if (logMap.has(`${sefer.sefer}|${p}|${a}`)) completed++; });
        return { name: p, path: `${seferPath(sefer)}/${encodeURIComponent(p)}`, total: 8, completed };
      }),
    };
  }
  const parashah = sefer.parshiyot.find(p => p === parts[1]);
  if (!parashah) return null;
  return { type: 'aliyot', sefer: sefer.sefer, parashah, breadcrumbs: [{ name: sefer.sefer, path: seferPath(sefer) }] };
}
