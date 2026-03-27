/**
 * useProfile.js — Perfil do usuário (avatar, nome, VIP, level, pontos).
 * options.sessionIdFromUrl: quando voltando da Stripe (vip=success), usar no primeiro refresh para confirmar VIP.
 */

import { useState, useEffect, useCallback } from 'react';
import { getProfile, getProgressUpdate, createCheckoutSession, claimAffiliate } from '../services/profileService';
import { getMissionsProgressUpdate } from '../services/missionsService';
import { useAuth } from './useAuth';

export function useProfile(options = null) {
  const auth = useAuth();
  /** Só true em AppContent: evita consumir a fila de modais em cada página (duplicava / “sumia” o toast). */
  const consumeProgressQueues = options?.consumeProgressQueues === true;
  const sessionIdFromUrl = (options?.sessionIdFromUrl ?? '').trim() || null;
  const vipSuccessFromUrl = options?.vipSuccessFromUrl === true;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressUpdate, setProgressUpdate] = useState(null);
  const [missionsProgressUpdate, setMissionsProgressUpdate] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const refresh = useCallback(async (sessionId = null) => {
    if (!auth.steamId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const effectiveSessionId = sessionId ?? (vipSuccessFromUrl ? sessionIdFromUrl : null);
    try {
      const data = await getProfile(effectiveSessionId);
      setProfile(data);
      const ref = typeof window !== 'undefined' ? window.localStorage.getItem('affiliate_ref') : null;
      if (ref) {
        claimAffiliate(ref).catch(() => {}).finally(() => {
          try { window.localStorage.removeItem('affiliate_ref'); } catch {}
        });
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [auth.steamId, sessionIdFromUrl, vipSuccessFromUrl]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Qualquer tela pode disparar pug:profile-refresh (ex.: resgate de missão) para sincronizar
  // pontos/level entre todas as instâncias de useProfile (App, páginas, etc.).
  useEffect(() => {
    const onProfileRefresh = () => {
      refresh();
    };
    window.addEventListener('pug:profile-refresh', onProfileRefresh);
    return () => window.removeEventListener('pug:profile-refresh', onProfileRefresh);
  }, [refresh]);

  // Modal de level/pontos MIX: só após fim de partida (evento do plugin), sem polling em loop.
  useEffect(() => {
    if (!auth.steamId || !consumeProgressQueues) return;
    let cancelled = false;
    let checking = false;

    const tick = async () => {
      if (checking) return;
      checking = true;
      try {
        const data = await getProgressUpdate();
        if (!cancelled && data) setProgressUpdate(data);
      } catch {} finally {
        checking = false;
      }
    };

    const onMatchFinished = () => {
      if (!cancelled) tick();
    };

    window.addEventListener('pug:match-finished', onMatchFinished);

    return () => {
      cancelled = true;
      window.removeEventListener('pug:match-finished', onMatchFinished);
    };
  }, [auth.steamId, consumeProgressQueues]);

  const clearProgressUpdate = useCallback(() => setProgressUpdate(null), []);
  const clearMissionsProgressUpdate = useCallback(() => setMissionsProgressUpdate(null), []);

  // Modal de missões: só após fim de partida; sem intervalo (evita reabrir várias vezes no site).
  useEffect(() => {
    if (!auth.steamId || !consumeProgressQueues) return;
    let cancelled = false;
    let checking = false;

    const tick = async () => {
      if (checking) return;
      checking = true;
      try {
        const data = await getMissionsProgressUpdate();
        if (!cancelled && data) setMissionsProgressUpdate(data);
      } catch {} finally {
        checking = false;
      }
    };

    const onMatchFinished = () => {
      if (!cancelled) tick();
    };

    window.addEventListener('pug:match-finished', onMatchFinished);

    return () => {
      cancelled = true;
      window.removeEventListener('pug:match-finished', onMatchFinished);
    };
  }, [auth.steamId, consumeProgressQueues]);

  const buyVip = useCallback(async () => {
    setCheckoutLoading(true);
    try {
      const { url } = await createCheckoutSession();
      if (url) {
        window.location.href = url;
        return;
      }
    } catch (err) {
      throw err;
    } finally {
      setCheckoutLoading(false);
    }
  }, []);

  return {
    profile,
    loading: auth.loading || loading,
    refresh,
    progressUpdate,
    clearProgressUpdate,
    missionsProgressUpdate,
    clearMissionsProgressUpdate,
    buyVip,
    checkoutLoading,
  };
}
