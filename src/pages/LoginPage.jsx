import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn, Mail } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import LanguageToggle from '@/components/LanguageToggle';
import Spinner from '@/components/Spinner';
import { Banner, Button, Card, Field, Input } from '@/components/ui';

export default function LoginPage() {
  const { t, dir } = useLang();
  const { user, loading, signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (loading) return <Spinner full />;
  if (user) return <Navigate to="/study" replace />;

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await signInWithEmail(email.trim()); setSent(true); } catch (err) { setError(err.message || String(err)); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10" dir={dir}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6"><LanguageToggle size="lg" /></div>
        <div className="text-center mb-8">
          <img src="./icons/icon-192.png" alt="" className="w-16 h-16 rounded-3xl mx-auto mb-4" />
          <h1 className="text-3xl font-display font-extrabold">{t('brandMain')}</h1>
          <p className="text-muted-foreground mt-2">{t('loginSubtitle')}</p>
        </div>
        <Card className="p-6">
          {sent ? (
            <Banner><div className="flex items-center gap-2"><Mail className="w-4 h-4" />{t('linkSent')}</div></Banner>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {error && <Banner tone="error">{error}</Banner>}
              <Field label={t('email')}><Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" dir="ltr" /></Field>
              <Button type="submit" size="lg" className="w-full" disabled={busy}><LogIn className="w-4 h-4" />{t('sendLink')}</Button>
              <Button type="button" size="lg" variant="outline" className="w-full" onClick={() => signInWithGoogle().catch((e) => setError(e.message))}>{t('continueWithGoogle')}</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
