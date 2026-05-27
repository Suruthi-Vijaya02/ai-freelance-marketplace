import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

export default function Card({ children, className, hover = false, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'bg-card rounded-2xl border border-border p-5 shadow-sm',
        hover &&
          'hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 cursor-pointer transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
