import { useRef, useState } from 'react';
import { Download, Upload, LogOut, Smartphone, KeyRound } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import LanguageToggle from '@/components/LanguageToggle';
import SheetLinkCard from '@/components/SheetLinkCard';
import { Banner, Button, Card, Field, Input } from '@/components/ui';
import { downloadText, readFileAsText, toCsv } from '@/lib/csv';
import { leafLabel } from '@/lib/i18n';
import { allEntries } from '@/lib/model';

const today = () => new Date().toISOString().slice(0, 10);

export default function SettingsPage() {
  const { t } = useLang();
  const { user, isLocalMode, signOut, updatePassword } = useAuth();
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const { idx, progressRows, logMap, exportBackup, importBackup, setError } = useData();
  const fileRef = useRef(null);
  const [msg, setMsg] = useState('');

  const exportStudy = () => {
    // one row per completion, so learning a daf twice gives two rows
    const rows = progressRows.map((r) => {
      const book = idx.book[r.book_key]; if (!book) return null;
      const cat = idx.cat[book.category_key]; const sec = idx.sec[book.section_key]; const par = r.parashah_key ? idx.par[r.parashah_key] : null; const ali = idx.ali[r.item];
      return {
        category_he: cat?.name_he, category_en: cat?.name_en, section_he: sec?.name_he || '', section_en: sec?.name_en || '',
        book_he: book.name_he, book_en: book.name_en, parashah_he: par?.name_he || '', parashah_en: par?.name_en || '',
        item_he: ali ? ali.name_he : leafLabel('he', cat?.leaf_type, r.item), item_en: ali ? ali.name_en : leafLabel('en', cat?.leaf_type, r.item),
        item_key: r.item, book_key: r.book_key, parashah_key: r.parashah_key || '', completed_at: String(r.completed_at || '').slice(0, 19).replace('T', ' '),
      };
    }).filter(Boolean);
    rows.sort((a, b) => `${a.book_key}|${a.parashah_key}`.localeCompare(`${b.book_key}|${b.parashah_key}`) || (Number(a.item_key) || 0) - (Number(b.item_key) || 0) || a.completed_at.localeCompare(b.completed_at));
    const headers = ['category_he', 'category_en', 'section_he', 'section_en', 'book_he', 'book_en', 'parashah_he', 'parashah_en', 'item_he', 'item_en', 'item_key', 'book_key', 'parashah_key', 'completed_at'];
    downloadText(`torah-study-progress-${today()}.csv`, toCsv(headers, rows));
  };

  const exportAliyos = () => {
    const rows = allEntries(logMap).map((r) => {
      const book = idx.book[r.book_key], par = idx.par[r.parashah_key], ali = idx.ali[r.aliyah_key];
      return { sefer_he: book?.name_he, sefer_en: book?.name_en, parashah_he: par?.name_he, parashah_en: par?.name_en, aliyah_he: ali?.name_he, aliyah_en: ali?.name_en, date: r.date || '', synagogue: r.synagogue || '', combined: r.combined ? 'yes' : '', notes: r.notes || '' };
    }).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    downloadText(`torah-aliyos-log-${today()}.csv`, toCsv(['sefer_he', 'sefer_en', 'parashah_he', 'parashah_en', 'aliyah_he', 'aliyah_en', 'date', 'synagogue', 'combined', 'notes'], rows));
  };

  const backup = async () => downloadText(`torah-tracker-backup-${today()}.json`, JSON.stringify(await exportBackup(), null, 2), 'application/json');
  const restore = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try { const data = JSON.parse(await readFileAsText(file)); await importBackup(data, { includeLists: false }); setMsg(t('restoreDone')); }
    catch (err) { setError(err); }
    finally { e.target.value = ''; }
  };

  return (
    <div className="pt-1 space-y-4">
      <h1 className="text-3xl font-display font-extrabold mb-4">{t('settings')}</h1>
      {msg && <Banner>{msg}</Banner>}

      <Card className="p-4 space-y-3">
        <div className="font-semibold">{t('language')}</div>
        <LanguageToggle size="lg" />
        <p className="text-xs text-muted-foreground">{t('langLegend')}</p>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="font-semibold">{t('dataMode')}</div>
        <p className="text-sm text-muted-foreground">{isLocalMode ? t('modeLocal') : t('modeCloud')}</p>
        {isLocalMode && <Banner>{t('localWarning')}</Banner>}
      </Card>

      <Card className="p-4 space-y-3">
        <div className="font-semibold">{t('exportTitle')}</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={exportStudy}><Download className="w-4 h-4" />{t('exportStudy')}</Button>
          <Button variant="outline" className="flex-1" onClick={exportAliyos}><Download className="w-4 h-4" />{t('exportAliyos')}</Button>
        </div>
      </Card>

      <SheetLinkCard />

      <Card className="p-4 space-y-3">
        <div className="font-semibold">{t('backupTitle')}</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={backup}><Download className="w-4 h-4" />{t('backupAll')}</Button>
          <Button variant="outline" className="flex-1" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" />{t('restore')}</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={restore} />
        </div>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="font-semibold flex items-center gap-2"><Smartphone className="w-4 h-4" />{t('installTitle')}</div>
        <p className="text-sm text-muted-foreground">{t('installText')}</p>
      </Card>

      {!isLocalMode && (
        <Card className="p-4 space-y-3">
          <div className="font-semibold">{t('account')}</div>
          <p className="text-sm text-muted-foreground">{t('signedInAs')} <span dir="ltr">{user?.email}</span>{user?.role === 'admin' ? ` · ${t('tabAdmin')}` : ''}</p>
          <form className="space-y-3 pt-1" onSubmit={async (e) => {
            e.preventDefault(); setPwMsg('');
            if (pw1.length < 6) { setPwMsg(t('passwordTooShort')); return; }
            if (pw1 !== pw2) { setPwMsg(t('passwordMismatch')); return; }
            setPwBusy(true);
            try { await updatePassword(pw1); setPw1(''); setPw2(''); setPwMsg(t('passwordSaved')); } catch (err) { setPwMsg(err.message || String(err)); } finally { setPwBusy(false); }
          }}>
            <div className="text-sm font-medium flex items-center gap-2"><KeyRound className="w-4 h-4" />{t('setPassword')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Field label={t('newPassword')}><Input type="password" autoComplete="new-password" minLength={6} value={pw1} onChange={(e) => setPw1(e.target.value)} dir="ltr" /></Field>
              <Field label={t('confirmPassword')}><Input type="password" autoComplete="new-password" minLength={6} value={pw2} onChange={(e) => setPw2(e.target.value)} dir="ltr" /></Field>
            </div>
            {pwMsg && <Banner tone={pwMsg === t('passwordSaved') ? 'info' : 'error'}>{pwMsg}</Banner>}
            <Button type="submit" variant="outline" disabled={pwBusy}>{pwBusy ? t('saving') : t('savePassword')}</Button>
          </form>
          <Button variant="destructive" onClick={signOut}><LogOut className="w-4 h-4" />{t('signOut')}</Button>
        </Card>
      )}
    </div>
  );
}
