// Settings card: a secret link that a Google Sheet can pull the user's data through (cloud mode only).
// The user pastes one formula into a new Google Sheet; the sheet fills itself and Google refreshes it about hourly.
import { useEffect, useState } from 'react';
import { Link2, RefreshCw, Copy, Check, Table, ExternalLink, ChevronDown } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { Banner, Button, Card } from './ui';
import { useConfirm } from './ConfirmDialog';

const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(24))).map((b) => b.toString(16).padStart(2, '0')).join('');
// A ready-made Google Sheet that people copy; they paste their one link into it and every tab fills itself.
const TEMPLATE_URL = (import.meta.env.VITE_SHEET_TEMPLATE_URL || '').trim();
const templateCopyUrl = () => TEMPLATE_URL.replace(/\/(edit|copy|view)?.*$/, '') + '/copy';
// The user's time zone goes into the link, so a late-night entry lands on the right day in the sheet.
const timeZone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } };

function FormulaRow({ label, formula, primary = false }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(formula); } catch {
      const ta = document.createElement('textarea'); ta.value = formula; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium flex items-center gap-2"><Table className="w-4 h-4 text-primary" />{label}</div>
      <div className="flex gap-2 items-stretch">
        <code dir="ltr" className="flex-1 min-w-0 block text-[11px] leading-snug break-all rounded-xl border border-border bg-background/60 px-3 py-2 text-muted-foreground text-left">{formula}</code>
        <Button variant={primary ? undefined : 'outline'} size="sm" className="shrink-0 self-center" onClick={copy}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? t('copied') : t('copy')}</Button>
      </div>
    </div>
  );
}

export default function SheetLinkCard() {
  const { t, mode } = useLang();
  const { isLocalMode } = useAuth();
  const confirm = useConfirm();
  const [token, setToken] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (isLocalMode || !db.sheetLink) return;
    db.sheetLink.get().then(setToken).catch((e) => setError(e.message || String(e)));
  }, [isLocalMode]);

  const make = async () => {
    if (token && !(await confirm({ title: t('sheetRegenerate'), text: t('sheetRegenerateConfirm'), okLabel: t('sheetRegenerate'), danger: true }))) return;
    setBusy(true); setError('');
    try { setToken(await db.sheetLink.set(newToken())); } catch (e) { setError(e.message || String(e)); } finally { setBusy(false); }
  };

  // No type = everything in one tab. The language mode decides Hebrew or English names and headers.
  const formula = (type) => `=IMPORTDATA("${db.sheetLink.url(token, { type, lang: mode, tz: timeZone() })}")`;

  return (
    <Card className="p-4 space-y-3">
      <div className="font-semibold flex items-center gap-2"><Link2 className="w-4 h-4" />{t('sheetTitle')}</div>
      <p className="text-sm text-muted-foreground">{t('sheetIntro')}</p>
      {isLocalMode || !db.sheetLink ? (
        <Banner>{t('sheetCloudOnly')}</Banner>
      ) : (
        <>
          {error && <Banner tone="error">{error}</Banner>}
          {!token ? (
            <Button onClick={make} disabled={busy}><Link2 className="w-4 h-4" />{t('sheetCreate')}</Button>
          ) : (
            <>
              {TEMPLATE_URL && (
                <>
                  <a href={templateCopyUrl()} target="_blank" rel="noreferrer" className="tap inline-flex items-center justify-center gap-2 h-11 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 w-full"><ExternalLink className="w-4 h-4" />{t('sheetTemplateBtn')}</a>
                  <p className="text-sm text-muted-foreground">{t('sheetTemplateHow')}</p>
                  <FormulaRow label={t('sheetYourLink')} formula={db.sheetLink.base(token)} />
                </>
              )}
              <FormulaRow label={t('sheetTabAll')} formula={formula()} primary />
              <ol className="text-sm space-y-1 list-decimal ps-5">
                <li>{t('sheetStep1')} <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-primary underline inline-flex items-center gap-1">{t('sheetOpenNew')}<ExternalLink className="w-3 h-3" /></a></li>
                <li>{t('sheetStep2')}</li>
                <li>{t('sheetStep3')}</li>
              </ol>
              <p className="text-xs text-muted-foreground">{t('sheetDates')}</p>
              <button type="button" className="tap text-sm text-primary flex items-center gap-1" onClick={() => setShowMore((v) => !v)}><ChevronDown className={`w-4 h-4 transition ${showMore ? 'rotate-180' : ''}`} />{t('sheetMore')}</button>
              {showMore && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{t('sheetHow')}</p>
                  <FormulaRow label={t('sheetTabBooks')} formula={formula('books')} />
                  <FormulaRow label={t('sheetTabParashah')} formula={formula('parashah')} />
                  <FormulaRow label={t('sheetTabStudy')} formula={formula('study')} />
                  <FormulaRow label={t('sheetTabAliyos')} formula={formula('aliyos')} />
                </div>
              )}
              <p className="text-xs text-muted-foreground">{t('sheetWarning')}</p>
              <Button variant="outline" size="sm" onClick={make} disabled={busy}><RefreshCw className="w-4 h-4" />{t('sheetRegenerate')}</Button>
            </>
          )}
        </>
      )}
    </Card>
  );
}
