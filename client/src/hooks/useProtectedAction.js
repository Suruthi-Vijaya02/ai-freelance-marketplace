import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const REDIRECT_KEY = 'auth_redirect';

export function storeAuthRedirect(path) {
  try {
    localStorage.setItem(REDIRECT_KEY, path);
  } catch {
    /* ignore */
  }
}

export function consumeAuthRedirect() {
  try {
    const path = localStorage.getItem(REDIRECT_KEY);
    if (path) localStorage.removeItem(REDIRECT_KEY);
    return path;
  } catch {
    return null;
  }
}

export function useProtectedAction() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const requireAuth = useCallback(
    (targetPath, onAuthed) => {
      if (isAuthenticated) {
        if (onAuthed) onAuthed();
        else if (targetPath) navigate(targetPath);
        return true;
      }
      if (targetPath) storeAuthRedirect(targetPath);
      setShowLoginModal(true);
      return false;
    },
    [isAuthenticated, navigate]
  );

  const closeLoginModal = useCallback(() => setShowLoginModal(false), []);

  return { requireAuth, showLoginModal, closeLoginModal, isAuthenticated };
}
