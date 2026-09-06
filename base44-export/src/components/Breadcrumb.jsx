import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function Breadcrumb({ rootLabel, rootPath, items = [] }) {
  const { dir } = useLang();
  const RootArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;
  return (
    <div className="flex items-center gap-1.5 mb-4 text-sm text-muted-foreground overflow-x-auto no-scrollbar">
      <Link to={rootPath} className="hover:text-foreground flex items-center gap-1 whitespace-nowrap">
        <RootArrow className="w-4 h-4" />
        {rootLabel}
      </Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="opacity-40">/</span>
          <Link to={it.path} className="hover:text-foreground">{it.name}</Link>
        </span>
      ))}
    </div>
  );
}
