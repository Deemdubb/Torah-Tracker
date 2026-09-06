import { Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, ScrollText, Settings, ShieldCheck, CloudOff, BarChart3 } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Spinner from './Spinner';
import { Banner, Button } from './ui';

function TabButton({ active, to, icon: Icon, label }) {
  return (
    <Link to={to} aria-current={active ? 'page' : undefined}
      className={`tap flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}>
      <Icon className="w-4 h-4" />{label}
    </Link>
  );
}

export default function AppLayout() {
  const { pathname } = useLocation();
  const { dir, t } = useLang();
  const { isAdmin } = useAuth();
  const { loading, error, setError, reload, pendingCount, offline } = useData();
  const tab = pathname.startsWith('/aliyos') ? 'aliyos' : pathname.startsWith('/dashboard') ? 'dashboard' : pathname.startsWith('/admin') ? 'admin' : pathname.startsWith('/settings') ? 'settings' : 'study';

  return (
    <div className="min-h-dvh bg-background text-foreground" dir={dir}>
      <header className="sticky top-0 z-20 backdrop-blur-md bg-background/80 border-b border-border safe-top">
        <div className="max-w-3xl mx-auto px-4 pt-3 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <Link to="/study" className="tap flex items-center gap-2.5 min-w-0">
              <img src="./icons/icon-192.png" alt="" className="w-10 h-10 rounded-2xl shrink-0" />
              <div className="leading-tight min-w-0">
                <div className="text-base sm:text-xl font-display font-extrabold truncate">{t('brandMain')}</div>
                <div className="text-[11px] text-muted-foreground tracking-wide truncate">{t('brandSub')}</div>
              </div>
            </Link>
            <div className="ms-auto flex items-center gap-1.5">
              <Link to="/settings" aria-label={t('settings')} className={`tap p-2 rounded-xl border border-border ${tab === 'settings' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'}`}>
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="flex gap-1 p-1 rounded-2xl bg-card border border-border">
            <TabButton active={tab === 'study'} to="/study" icon={BookOpen} label={t('tabStudy')} />
            <TabButton active={tab === 'aliyos'} to="/aliyos" icon={ScrollText} label={t('tabAliyos')} />
            <TabButton active={tab === 'dashboard'} to="/dashboard" icon={BarChart3} label={t('tabDashboard')} />
            {isAdmin && <TabButton active={tab === 'admin'} to="/admin" icon={ShieldCheck} label={t('tabAdmin')} />}
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 pt-3 safe-bottom">
        {offline && (
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><CloudOff className="w-3.5 h-3.5" />{t('offlineCached')}</div>
        )}
        {pendingCount > 0 && (
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><CloudOff className="w-3.5 h-3.5" />{pendingCount} {t('pendingSync')}</div>
        )}
        {error && (
          <div className="mb-3"><Banner tone="error"><div className="flex items-center gap-2 flex-wrap"><span className="flex-1">{error === 'db-needs-update' ? t('dbNeedsUpdate') : `${t('error')}: ${error}`}</span><Button size="sm" variant="outline" onClick={() => { setError(null); reload(); }}>{t('retry')}</Button></div></Banner></div>
        )}
        {loading ? <Spinner /> : <Outlet />}
      </main>
    </div>
  );
}
