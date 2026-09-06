import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn, Mail, UserPlus } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import LanguageToggle from '@/components/LanguageToggle';
import Spinner from '@/components/Spinner';
import { Banner, Button, Card, Field, Input } from '@/components/ui';

export default function LoginPage() {
  const { t, dir } = useLang();
  const { user, loading, signInWithEmail, signInWithPassword, signUpWithPassword } = useAuth();
  const [mode, setMode] = useState('password'); // 'password' | 'link'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (loading) return <Spinner full />;
  if (user) return <Navigate to="/study" replace />;

  const run = async (fn) => {
    setError(''); setNotice(''); setBusy(true);
    try { await fn(); } catch (err) { setError(err.message || String(err)); } finally { setBusy(false); }
  };
  const submit = (e) => {
    e.preventDefault();
    if (mode === 'link') return run(async () => { await signInWithEmail(email.trim()); setNotice(t('linkSent')); });
    if (password.length < 6) { setError(t('passwordTooShort')); return; }
    return run(() => signInWithPassword(email.trim(), password));
  };
  const create = () => {
    if (password.length < 6) { setError(t('passwordTooShort')); return; }
    return run(async () => { const ready = await signUpWithPassword(email.trim(), password); if (!ready) setNotice(t('checkEmailConfirm')); });
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10" dir={dir}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6"><LanguageToggle size="lg" /></div>
        <div className="text-center mb-8">
          <img src="./icons/icon-192.png" alt="" className="w-16 h-16 rounded-3xl mx-auto mb-4" />
          <h1 className="text-3xl font-display font-extrabold">{t('brandMain')}</h1>
          <p className="text-muted-foreground mt-2">{mode === 'link' ? t('loginSubtitle') : t('loginSubtitlePassword')}</p>
        </div>
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            {error && <Banner tone="error">{error}</Banner>}
            {notice && <Banner><div className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0" />{notice}</div></Banner>}
            <Field label={t('email')}><Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" dir="ltr" /></Field>
            {mode === 'password' && (
              <Field label={t('password')}><Input type="password" required autoComplete="current-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" /></Field>
            )}
            {mode === 'password' ? (
              <>
                <Button type="submit" size="lg" className="w-full" disabled={busy}><LogIn className="w-4 h-4" />{t('signIn')}</Button>
                <Button type="button" size="lg" variant="outline" className="w-full" disabled={busy} onClick={create}><UserPlus className="w-4 h-4" />{t('createAccount')}</Button>
              </>
            ) : (
              <Button type="submit" size="lg" className="w-full" disabled={busy}><Mail className="w-4 h-4" />{t('sendLink')}</Button>
            )}
            <button type="button" className="tap w-full text-sm text-primary hover:underline py-1" onClick={() => { setMode(mode === 'password' ? 'link' : 'password'); setError(''); setNotice(''); }}>
              {mode === 'password' ? t('useMagicLink') : t('usePassword')}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
