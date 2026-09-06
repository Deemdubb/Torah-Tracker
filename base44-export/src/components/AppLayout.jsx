import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, ScrollText } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

function TabButton({ active, to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}

export default function AppLayout() {
  const { pathname } = useLocation();
  const { dir, t } = useLang();
  const tab = pathname.startsWith('/aliyos') ? 'aliyos' : 'study';
  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <header className="sticky top-0 z-20 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center mb-3">
            <Link to="/study" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                <ScrollText className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <div className="text-xl font-display font-extrabold">{t('brandMain')}</div>
                <div className="text-[11px] text-muted-foreground tracking-wide">{t('brandSub')}</div>
              </div>
            </Link>
            <div className="ms-auto"><LanguageToggle /></div>
          </div>
          <div className="flex gap-1 p-1 rounded-2xl bg-card border border-border">
            <TabButton active={tab === 'study'} to="/study" icon={BookOpen} label={t('tabStudy')} />
            <TabButton active={tab === 'aliyos'} to="/aliyos" icon={ScrollText} label={t('tabAliyos')} />
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 pb-24 pt-3">
        <Outlet />
      </main>
    </div>
  );
}
