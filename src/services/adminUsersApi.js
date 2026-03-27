/**
 * adminUsersApi.js — Chamadas à API admin de usuários (revogar VIP, etc.).
 * Usa o mesmo token do admin (adminWheelApi).
 */

import { getAdminToken } from './adminWheelApi';

const BASE = '/api';

function adminHeaders() {
  const token = getAdminToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['x-admin-token'] = token;
  return headers;
}

export async function revokeVip(steamId) {
  const res = await fetch(`${BASE}/admin/users/revoke-vip`, {
    method: 'POST',
    credentials: 'include',
    headers: adminHeaders(),
    body: JSON.stringify({ steamId: String(steamId).trim() }),
  });
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    if (data.code === 'ADMIN_REQUIRED') throw new Error('Acesso negado. Token inválido ou expirado.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || 'Erro na requisição');
  }
  return res.json();
}

export async function addVip(steamId, days = 30) {
  const res = await fetch(`${BASE}/admin/users/add-vip`, {
    method: 'POST',
    credentials: 'include',
    headers: adminHeaders(),
    body: JSON.stringify({
      steamId: String(steamId).trim(),
      days: Math.max(1, Math.floor(Number(days) || 30)),
    }),
  });
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    if (data.code === 'ADMIN_REQUIRED') throw new Error('Acesso negado. Token inválido ou expirado.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || 'Erro na requisição');
  }
  return res.json();
}

export async function addPoints(steamId, points, tickets) {
  const res = await fetch(`${BASE}/admin/users/add-points`, {
    method: 'POST',
    credentials: 'include',
    headers: adminHeaders(),
    body: JSON.stringify({
      steamId: String(steamId).trim(),
      points: Math.max(0, Math.floor(Number(points) || 0)),
      tickets: Math.max(0, Math.floor(Number(tickets) || 0)),
    }),
  });
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    if (data.code === 'ADMIN_REQUIRED') throw new Error('Acesso negado. Token inválido ou expirado.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || 'Erro na requisição');
  }
  return res.json();
}

export async function getWarmupTop(limit = 10) {
  const safeLimit = Math.max(1, Math.min(50, Math.floor(Number(limit) || 10)));
  const res = await fetch(`${BASE}/admin/users/warmup-top?limit=${safeLimit}`, {
    method: 'GET',
    credentials: 'include',
    headers: adminHeaders(),
  });
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    if (data.code === 'ADMIN_REQUIRED') throw new Error('Acesso negado. Token inválido ou expirado.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || 'Erro na requisição');
  }
  return res.json();
}
