import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

export default function Card({ children, className, hover = false, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={hover ? { y: -2, boxShadow: '0 8px 32px rgba(61,71,212,0.14)' } : {}}
      style={{ boxShadow: '0 4px 24px rgba(61,71,212,0.08)' }}
      className={cn(
        'bg-white/55 backdrop-blur-[12px] rounded-[20px] border border-border/70 p-7',
        hover && 'cursor-pointer transition-colors duration-200 hover:border-btn-blue/30',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
