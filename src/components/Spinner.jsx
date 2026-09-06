import { Loader2 } from 'lucide-react';

export default function Spinner({ full = false }) {
  const cls = full ? 'fixed inset-0 flex items-center justify-center' : 'flex justify-center py-20';
  return <div className={cls}><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;
}
