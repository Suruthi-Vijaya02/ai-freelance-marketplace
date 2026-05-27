import { cn } from '../../utils/helpers';

export default function Input({ label, error, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text">{label}</label>
      )}
      <input
        className={cn(
          'w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors',
          error && 'border-error focus:ring-error/40',
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
