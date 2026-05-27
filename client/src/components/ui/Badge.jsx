import { cn } from '../../utils/helpers';

const colors = {
  primary: 'bg-gradient-badge text-white border-transparent',
  secondary: 'bg-gradient-button text-white border-transparent',
  accent: 'bg-accent/15 text-accent border-accent/30',
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-accent/15 text-accent border-accent/30',
  danger: 'bg-error/15 text-error border-error/30',
  muted: 'bg-card text-muted border-border',
};

export default function Badge({ children, color = 'primary', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        colors[color] || colors.muted,
        className
      )}
    >
      {children}
    </span>
  );
}
