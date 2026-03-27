/**
 * adminGiveawayApi.js — CRUD de giveaway_items via API admin.
 */

import { getAdminToken, setAdminToken } from './adminWheelApi';

const BASE = '/api';

function adminHeaders() {
  const token = getAdminToken();
  const headers = {};
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || 'Erro na requisição');
  }
  return res.json();
}

export async function fetchGiveawayItems(params = {}) {
  const q = new URLSearchParams();
  if (params.active !== undefined && params.active !== '') {
    q.set('active', params.active ? '1' : '0');
  }
  const qs = q.toString();
  const suffix = qs ? `?${qs}` : '';
  return adminFetch(`/admin/giveaway/items${suffix}`);
}

export async function createGiveawayItem(payload) {
  return adminFetch('/admin/giveaway/items', {
    method: 'POST',
    body: payload,
  });
}

export async function updateGiveawayItem(id, payload) {
  return adminFetch(`/admin/giveaway/items/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function deleteGiveawayItem(id) {
  return adminFetch(`/admin/giveaway/items/${id}`, {
    method: 'DELETE',
  });
}

