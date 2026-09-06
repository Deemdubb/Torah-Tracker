import { Check } from 'lucide-react';

// A round check. When the item was learned more than once, the number of times replaces the check mark.
// The key changes with the count so the little "bump" animation plays again on every change.
export default function CircularCheckbox({ checked, count = 0 }) {
  const many = count >= 2;
  return (
    <span key={count} aria-hidden="true" className={`relative w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
      checked ? 'bg-primary border-primary text-primary-foreground animate-bump' : 'border-muted-foreground/40 text-transparent'}`}>
      {many ? <span className="text-xs font-bold tabular-nums leading-none">{count > 99 ? '99+' : count}</span> : <Check className="w-4 h-4" strokeWidth={3} />}
    </span>
  );
}
