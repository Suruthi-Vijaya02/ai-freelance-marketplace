import { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

const Input = forwardRef(({ className, type = 'text', label, error, id, ...props }, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text mb-1.5 ml-1">
          {label}
        </label>
      )}
      <input
        type={type}
        ref={ref}
        id={inputId}
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
