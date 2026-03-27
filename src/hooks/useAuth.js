import { useState, useEffect, useCallback } from 'react';
import { getMe, logout as authLogout, getSteamLoginUrl } from '../services/authService';

export function useAuth() {
  const [steamId, setSteamId] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const user = await getMe();
      setSteamId(user?.steamId ?? null);
    } catch {
      setSteamId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback((returnTo) => {
    window.location.href = getSteamLoginUrl(returnTo);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authLogout();
    } catch {
      // Even if request fails, reflect logged-out UI immediately.
    } finally {
      setSteamId(null);
    }
  }, []);

  return { steamId, loading, login, logout, refresh };
}
