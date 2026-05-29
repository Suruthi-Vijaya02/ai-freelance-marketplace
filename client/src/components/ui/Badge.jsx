import { cn } from '../../utils/helpers';

const colorVariants = {
  primary: 'bg-[rgba(61,71,212,0.12)] text-btn-blue',
  accent: 'bg-[rgba(61,71,212,0.12)] text-btn-blue',
  success: 'bg-success/12 text-[#15803d]',
  warning: 'bg-[#eab308]/12 text-[#92400e]',
  error: 'bg-error/12 text-accent',
  danger: 'bg-error/12 text-accent',
  muted: 'bg-[rgba(61,71,212,0.12)] text-btn-blue',
};

export default function Badge({ children, color = 'primary', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest font-body',
        colorVariants[color] || colorVariants.primary,
        className
      )}
    >
      {children}
    </span>
  );
}
