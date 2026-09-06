import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn, Mail, UserPlus, Hourglass } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/Spinner';
import { Banner, Button, Card, Field, Input } from '@/components/ui';

// Three views: 'signin' (email + password), 'signup' (email + password + confirm), 'link' (email only, sign-in link by email).
export default function LoginPage() {
  const { t, dir } = useLang();
  const { user, loading, signInWithEmail, signInWithPassword, signUpWithPassword, resendConfirmation, resetPassword } = useAuth();
  const [view, setView] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [waitingFor, setWaitingFor] = useState(''); // email address awaiting verification
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (loading) return <Spinner full />;
  if (user) return <Navigate to="/study" replace />;

  const run = async (fn) => {
    setError(''); setNotice(''); setBusy(true);
    try { await fn(); } catch (err) { setError(err.message || String(err)); } finally { setBusy(false); }
  };
  const switchView = (v) => { setView(v); setError(''); setNotice(''); setConfirm(''); };

  const submit = (e) => {
    e.preventDefault();
    const em = email.trim();
    if (view === 'link') return run(async () => { await signInWithEmail(em); setNotice(t('linkSent')); });
    if (password.length < 6) { setError(t('passwordTooShort')); return; }
    if (view === 'signup') {
      if (password !== confirm) { setError(t('passwordMismatch')); return; }
      return run(async () => { const ready = await signUpWithPassword(em, password); if (!ready) { setWaitingFor(em); switchView('signin'); } });
    }
    return run(() => signInWithPassword(em, password));
  };

  const subtitle = view === 'signup' ? t('createAccountSubtitle') : view === 'link' ? t('loginSubtitle') : t('loginSubtitlePassword');

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10" dir={dir}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="./icons/icon-192.png" alt="" className="w-16 h-16 rounded-3xl mx-auto mb-4" />
          <h1 className="text-3xl font-display font-extrabold">{t('brandMain')}</h1>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </div>
        {waitingFor && (
          <div className="mb-4">
            <Banner>
              <div className="flex items-start gap-2">
                <Hourglass className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">{t('verifyWaiting')} <span dir="ltr" className="font-medium">{waitingFor}</span>. {t('verifyThenSignIn')}</div>
                <button type="button" className="tap text-sm underline shrink-0" onClick={() => run(async () => { await resendConfirmation(waitingFor); setNotice(t('linkSent')); })}>{t('resend')}</button>
              </div>
            </Banner>
          </div>
        )}
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            {error && <Banner tone="error">{error}</Banner>}
            {notice && <Banner><div className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0" />{notice}</div></Banner>}
            <Field label={t('email')}><Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" dir="ltr" /></Field>
            {view !== 'link' && (
              <Field label={t('password')}><Input type="password" required autoComplete={view === 'signup' ? 'new-password' : 'current-password'} minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" /></Field>
            )}
            {view === 'signup' && (
              <Field label={t('confirmPassword')}><Input type="password" required autoComplete="new-password" minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} dir="ltr" /></Field>
            )}
            {view === 'signin' && <Button type="submit" size="lg" className="w-full" disabled={busy}><LogIn className="w-4 h-4" />{t('signIn')}</Button>}
            {view === 'signin' && (
              <button type="button" className="tap w-full text-sm text-muted-foreground hover:text-foreground py-1" disabled={busy}
                onClick={() => { const em = email.trim(); if (!em) { setError(t('enterEmailFirst')); return; } run(async () => { await resetPassword(em); setNotice(t('resetSent')); }); }}>
                {t('forgotPassword')}
              </button>
            )}
            {view === 'signup' && <Button type="submit" size="lg" className="w-full" disabled={busy}><UserPlus className="w-4 h-4" />{t('createAccount')}</Button>}
            {view === 'link' && <Button type="submit" size="lg" className="w-full" disabled={busy}><Mail className="w-4 h-4" />{t('sendLink')}</Button>}
            <div className="flex flex-col items-center gap-1 text-sm">
              {view !== 'signup' && <button type="button" className="tap text-primary hover:underline py-1" onClick={() => switchView('signup')}>{t('noAccountYet')}</button>}
              {view !== 'signin' && <button type="button" className="tap text-primary hover:underline py-1" onClick={() => switchView('signin')}>{t('haveAccount')}</button>}
              {view === 'signin' && <button type="button" className="tap text-muted-foreground hover:text-foreground py-1" onClick={() => switchView('link')}>{t('useMagicLink')}</button>}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
