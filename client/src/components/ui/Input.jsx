import { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

const Input = forwardRef(({ className, type = 'text', error, ...props }, ref) => {
  return (
    <div className="w-full">
      <input
        type={type}
        ref={ref}
        className={cn(
          'w-full bg-white/60 border-[1.5px] border-border rounded-xl px-4 py-3 text-black font-body text-[15px]',
          'transition-all duration-200 outline-none',
          'focus:border-btn-blue focus:ring-[3px] focus:ring-[rgba(61,71,212,0.12)]',
          'placeholder:text-mid/60',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-error focus:border-error focus:ring-error/20',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-error font-medium">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
