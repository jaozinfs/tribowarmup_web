/**
 * authService.js — Autenticação Steam (sessão no backend)
 */

import { getApiBaseUrl } from '../utils/apiBase';

const opts = { credentials: 'include' };

export async function getMe() {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, opts);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Erro ao verificar sessão');
  return res.json();
}

export async function logout() {
  await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
    method: 'POST',
    ...opts,
  });
}

/**
 * @param {string} [returnTo] - Path do frontend para redirecionar após login (ex.: '/pug'). Se omitido, o backend redireciona para /loadout.
 * Retorna URL absoluta em produção (mesmo origin) para garantir que o clique leve ao backend e depois à Steam.
 */
export function getSteamLoginUrl(returnTo) {
  let base = `${getApiBaseUrl()}/api/auth/steam`;
  if (!base.startsWith('http') && typeof window !== 'undefined') {
    base = `${window.location.origin}${base.startsWith('/') ? '' : '/'}${base}`;
  }
  if (returnTo && typeof returnTo === 'string' && returnTo.startsWith('/')) {
    return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return base;
}
