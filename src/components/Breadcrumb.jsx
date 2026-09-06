import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Name } from './ui';
import { useLang } from '@/lib/LanguageContext';

export default function Breadcrumb({ rootLabel, rootPath, items = [] }) {
  const { dir } = useLang();
  const RootArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;
  return (
    <nav className="flex items-center gap-1.5 mb-4 text-sm text-muted-foreground overflow-x-auto no-scrollbar whitespace-nowrap">
      <Link to={rootPath} className="tap hover:text-foreground flex items-center gap-1 py-1">
        <RootArrow className="w-4 h-4 shrink-0" />{rootLabel}
      </Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="opacity-40">/</span>
          <Link to={it.path} className="tap hover:text-foreground py-1"><Name>{it.name}</Name></Link>
        </span>
      ))}
    </nav>
  );
}
