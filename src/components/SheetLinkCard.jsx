// Settings card: a secret link that a Google Sheet can pull the user's data through (cloud mode only).
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

function FormulaRow({ label, formula }) {
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
        <Button variant="outline" size="sm" className="shrink-0 self-center" onClick={copy}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? t('copied') : t('copy')}</Button>
      </div>
    </div>
  );
}

export default function SheetLinkCard() {
  const { t } = useLang();
  const { isLocalMode } = useAuth();
  const confirm = useConfirm();
  const [token, setToken] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showFormulas, setShowFormulas] = useState(!TEMPLATE_URL);

  useEffect(() => {
    if (isLocalMode || !db.sheetLink) return;
    db.sheetLink.get().then(setToken).catch((e) => setError(e.message || String(e)));
  }, [isLocalMode]);

  const make = async () => {
    if (token && !(await confirm({ title: t('sheetRegenerate'), text: t('sheetRegenerateConfirm'), okLabel: t('sheetRegenerate'), danger: true }))) return;
    setBusy(true); setError('');
    try { setToken(await db.sheetLink.set(newToken())); } catch (e) { setError(e.message || String(e)); } finally { setBusy(false); }
  };

  const formula = (type) => `=IMPORTDATA("${db.sheetLink.url(token, type)}")`;

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
              <FormulaRow label={t('sheetYourLink')} formula={db.sheetLink.base(token)} />
              {TEMPLATE_URL ? (
                <>
                  <a href={templateCopyUrl()} target="_blank" rel="noreferrer" className="tap inline-flex items-center justify-center gap-2 h-11 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 w-full"><ExternalLink className="w-4 h-4" />{t('sheetTemplateBtn')}</a>
                  <p className="text-sm text-muted-foreground">{t('sheetTemplateHow')}</p>
                </>
              ) : (
                <p className="text-sm">{t('sheetHow')}</p>
              )}
              {TEMPLATE_URL && (
                <button type="button" className="tap text-sm text-primary flex items-center gap-1" onClick={() => setShowFormulas((v) => !v)}><ChevronDown className={`w-4 h-4 transition ${showFormulas ? 'rotate-180' : ''}`} />{t('sheetManual')}</button>
              )}
              {showFormulas && (
                <div className="space-y-3">
                  <FormulaRow label={t('sheetTabStudy')} formula={formula('study')} />
                  <FormulaRow label={t('sheetTabAliyos')} formula={formula('aliyos')} />
                  <FormulaRow label={t('sheetTabParashah')} formula={formula('parashah')} />
                  <FormulaRow label={t('sheetTabBooks')} formula={formula('books')} />
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
