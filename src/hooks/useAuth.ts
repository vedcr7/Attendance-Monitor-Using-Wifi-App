/**
 * useAuth.ts — Authentication state + auto-login from stored token.
 *
 * On mount: checks EncryptedStorage for a saved token.
 * If found and valid → auto-navigate to Dashboard.
 * If expired/invalid → stay on Login.
 */
import { useCallback, useEffect, useState } from 'react';
import { getMe, loadStoredSession, logout } from '../services/authService';
import type { AuthUser } from '../types';

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const stored = await loadStoredSession();
        if (!stored) {
          if (mounted) setIsLoading(false);
          return;
        }

        // Validate token is still accepted by the server
        const me = await getMe();
        if (mounted) {
          setUser(me);
          setIsLoading(false);
        }
      } catch {
        if (mounted) setIsLoading(false);
      }
    }

    checkSession();
    return () => { mounted = false; };
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    signOut,
  };
}
