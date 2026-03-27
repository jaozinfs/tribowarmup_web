/**
 * profileService.js — Perfil do usuário, progresso e Stripe checkout.
 */

import { getApiBaseUrl } from '../utils/apiBase';

const opts = { credentials: 'include' };

export async function getProfile(sessionId = null) {
  const url = sessionId
    ? `${getApiBaseUrl()}/api/profile/me?session_id=${encodeURIComponent(sessionId)}`
    : `${getApiBaseUrl()}/api/profile/me`;
  const res = await fetch(url, opts);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Erro ao buscar perfil');
  return res.json();
}

export async function getProgressUpdate() {
  const res = await fetch(`${getApiBaseUrl()}/api/profile/me/progress-update`, opts);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Erro ao buscar atualização');
  const data = await res.json();
  return data && typeof data === 'object' && (data.previousLevel != null || data.pointsDelta != null) ? data : null;
}

export async function createCheckoutSession() {
  const res = await fetch(`${getApiBaseUrl()}/api/stripe/create-checkout-session`, {
    method: 'POST',
    ...opts,
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || 'Erro ao criar sessão de pagamento');
  }
  const data = await res.json();
  if (!data?.url) throw new Error('Resposta inválida do servidor. Verifique a configuração do Stripe.');
  return data;
}

export async function getProfileBySteamId(steamId) {
  const res = await fetch(`${getApiBaseUrl()}/api/profile/${encodeURIComponent(steamId)}`, opts);
  if (!res.ok) return null;
  return res.json();
}

export async function getProfileAffiliates(page = 1, perPage = 20) {
  const res = await fetch(
    `${getApiBaseUrl()}/api/profile/affiliates?page=${page}&per_page=${perPage}`,
    opts
  );
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Erro ao carregar afiliados');
  return res.json();
}

export async function claimAffiliate(ref) {
  const res = await fetch(`${getApiBaseUrl()}/api/affiliate/claim`, {
    method: 'POST',
    ...opts,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: String(ref).trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Erro ao vincular indicação');
  return data;
}

export async function saveMarketingContact({ fullName, email, phone }) {
  const res = await fetch(`${getApiBaseUrl()}/api/profile/me/marketing-contact`, {
    method: 'POST',
    ...opts,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, phone }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Erro ao salvar dados');
  return data;
}
