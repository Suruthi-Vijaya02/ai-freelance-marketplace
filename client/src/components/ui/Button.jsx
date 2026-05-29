import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

const variants = {
  primary: 'bg-btn-blue hover:brightness-90 text-white font-semibold',
  secondary: 'bg-btn-blue hover:brightness-90 text-white font-semibold',
  accent: 'bg-accent hover:brightness-90 text-white font-semibold',
  outline: 'border-[1.5px] border-black text-black hover:bg-black/5 bg-transparent',
  ghost: 'hover:bg-white/40 text-black bg-transparent',
  danger: 'bg-error hover:brightness-90 text-white font-semibold',
};

const sizes = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-6 py-2.5 text-base',
  lg: 'px-8 py-3.5 text-lg',
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
    <motion.button
      type="button"
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-body',
        variants[variant] || variants.primary,
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
