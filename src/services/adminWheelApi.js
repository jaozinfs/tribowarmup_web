/**
 * adminWheelApi.js — Chamadas à API admin da roda (exigem token ou sessão admin).
 */

const ADMIN_TOKEN_KEY = 'snaptap_admin_token';
const BASE = '/api';

export function getAdminToken() {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token) {
  if (typeof window === 'undefined') return;
  if (token) window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  else window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

function adminHeaders() {
  const token = getAdminToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['x-admin-token'] = token;
  return headers;
}

async function adminFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: { ...adminHeaders(), ...options.headers },
  });
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    if (data.code === 'ADMIN_REQUIRED') {
      setAdminToken(null);
      throw new Error('Acesso negado. Token inválido ou expirado.');
    }
  }
  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    const msg = data.code === 'ADMIN_LOCKOUT' || data.code === 'RATE_LIMIT_UNAUTH'
      ? (data.error || 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.')
      : (data.error || 'Muitas requisições. Tente novamente mais tarde.');
    throw new Error(msg);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || 'Erro na requisição');
  }
  return res.json();
}

export async function fetchAdminWheelSpins(params = {}) {
  const q = new URLSearchParams();
  if (params.user) q.set('user', params.user);
  if (params.item) q.set('item', params.item);
  if (params.rarity) q.set('rarity', params.rarity);
  if (params.date_start) q.set('date_start', params.date_start);
  if (params.date_end) q.set('date_end', params.date_end);
  if (params.is_redeemed !== undefined && params.is_redeemed !== '') q.set('is_redeemed', params.is_redeemed);
  if (params.page) q.set('page', params.page);
  if (params.per_page) q.set('per_page', params.per_page);
  return adminFetch(`/admin/wheel/spins?${q.toString()}`);
}

export async function fetchAdminWheelSpinId(id) {
  return adminFetch(`/admin/wheel/spin/${id}`);
}

export async function fetchAdminWheelStats() {
  return adminFetch('/admin/wheel/stats');
}

/**
 * Verifica se o token atual é válido. Em 403/429 limpa o token e lança.
 * Use antes de autorizar o admin: só chame setAuthorized(true) após verifyAdminToken() resolver.
 */
export async function verifyAdminToken() {
  const res = await fetch(`${BASE}/admin/wheel/stats`, {
    method: 'GET',
    credentials: 'include',
    headers: adminHeaders(),
  });
  if (res.status === 403) {
    setAdminToken(null);
    throw new Error('Token inválido ou expirado.');
  }
  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Muitas tentativas. Aguarde alguns minutos.');
  }
  if (!res.ok) throw new Error('Verificação falhou');
  return res.json();
}
