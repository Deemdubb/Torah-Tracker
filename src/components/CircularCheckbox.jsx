import { Check } from 'lucide-react';

export default function CircularCheckbox({ checked }) {
  return (
    <span aria-hidden="true" className={`relative w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
      checked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 text-transparent'}`}>
      <Check className="w-4 h-4" strokeWidth={3} />
    </span>
  );
}
