import { cn } from '../../utils/helpers';

export default function Skeleton({ className }) {
  return (
    <div
      className={cn('animate-pulse bg-[#1e2f38] rounded-lg', className)}
      aria-hidden="true"
    />
  );
}
