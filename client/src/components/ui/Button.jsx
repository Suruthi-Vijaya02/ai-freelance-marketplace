import { cn } from '../../utils/helpers';

const variants = {
  primary:
    'bg-gradient-button hover:brightness-110 text-white font-semibold shadow-md shadow-primary/25 rounded-full',
  secondary:
    'bg-gradient-badge hover:brightness-110 text-white font-semibold rounded-full',
  accent: 'bg-accent hover:brightness-110 text-white font-semibold rounded-full',
  outline:
    'border border-border hover:border-primary text-text hover:text-primary bg-surface rounded-full',
  ghost: 'hover:bg-card text-muted hover:text-text rounded-full',
  danger: 'bg-error hover:brightness-110 text-white rounded-full',
};

const sizes = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-5 py-2 text-sm',
  lg: 'px-7 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant] || variants.primary,
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
