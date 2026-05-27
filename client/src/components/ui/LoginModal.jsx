import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import Button from './Button';

export default function LoginModal({ open, onClose, message = 'Please log in to continue' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-muted hover:text-text transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 id="login-modal-title" className="font-heading text-xl font-semibold text-text pr-8">
          {message}
        </h2>
        <p className="mt-2 text-sm text-muted">
          Sign in or create an account to access projects, talent, and messaging.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link to="/login" className="flex-1" onClick={onClose}>
            <Button variant="outline" className="w-full">Log In</Button>
          </Link>
          <Link to="/signup" className="flex-1" onClick={onClose}>
            <Button className="w-full">Sign Up</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
