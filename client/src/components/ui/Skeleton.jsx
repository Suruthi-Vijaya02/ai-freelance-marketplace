import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

export default function Skeleton({ className }) {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      className={cn('bg-surface rounded-lg', className)}
      aria-hidden="true"
    />
  );
}
