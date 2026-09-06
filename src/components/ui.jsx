// Small building blocks used everywhere: buttons, inputs, labels, name wrapper.
import { cloneElement, forwardRef, isValidElement, useId } from 'react';

const base = 'tap inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20',
  soft: 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25',
  outline: 'border border-border bg-card hover:border-primary/40 text-foreground',
  ghost: 'text-muted-foreground hover:text-foreground hover:bg-card',
  destructive: 'bg-destructive/15 text-destructive border border-destructive/40 hover:bg-destructive/25',
};
const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base', icon: 'h-9 w-9 p-0' };

export function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  return <button type="button" className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}

export const Input = forwardRef(function Input({ className = '', ...props }, ref) {
  return <input ref={ref} className={`w-full h-11 rounded-xl border border-border bg-input px-3 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${className}`} {...props} />;
});

export function Textarea({ className = '', ...props }) {
  return <textarea className={`w-full rounded-xl border border-border bg-input px-3 py-2 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return <select className={`w-full h-11 rounded-xl border border-border bg-input px-3 text-base focus:outline-none focus:ring-2 focus:ring-ring ${className}`} {...props}>{children}</select>;
}

export function Label({ children, hint, htmlFor }) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">{children}</label>
      {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

// A labelled form field. When the child is one of our controls (Input, Textarea, Select) it gets an id
// and the label points at it, so screen readers read the label and tapping the label focuses the field.
export function Field({ label, hint, children }) {
  const autoId = useId();
  const isControl = isValidElement(children) && typeof children.type !== 'string';
  const id = isControl ? (children.props.id || autoId) : undefined;
  const control = isControl && !children.props.id ? cloneElement(children, { id }) : children;
  return <div className="text-start"><Label htmlFor={id} hint={hint}>{label}</Label>{control}</div>;
}

// Wrap Torah names in <bdi> so Hebrew renders correctly inside an English (LTR) layout and vice versa.
export function Name({ children, className = '' }) {
  return <bdi className={className}>{children}</bdi>;
}

export function Card({ className = '', ...props }) {
  return <div className={`rounded-2xl bg-card border border-border ${className}`} {...props} />;
}

export function Banner({ tone = 'info', children }) {
  const cls = tone === 'error' ? 'bg-destructive/10 text-destructive border-destructive/30' : 'bg-primary/10 text-primary border-primary/30';
  return <div className={`rounded-xl border px-3 py-2 text-sm ${cls}`}>{children}</div>;
}
