import { getAdminToken, setAdminToken } from './adminWheelApi';

const BASE = '/api';

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
    throw new Error(data.error || 'Muitas tentativas. Aguarde alguns minutos.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || res.statusText || 'Erro na requisição');
  return data;
}

export async function fetchAdminMissions() {
  return adminFetch('/admin/missions');
}

export async function createAdminMission(payload) {
  return adminFetch('/admin/missions', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function updateAdminMission(id, payload) {
  return adminFetch(`/admin/missions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload || {}),
  });
}

export async function deleteAdminMission(id) {
  return adminFetch(`/admin/missions/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function resetAllUserMissions() {
  return adminFetch('/admin/missions/reset-all', { method: 'POST', body: JSON.stringify({}) });
}

export async function fetchMissionAntiFarmBypass() {
  return adminFetch('/admin/missions/anti-farm-bypass');
}

export async function addMissionAntiFarmBypass(steamId) {
  return adminFetch('/admin/missions/anti-farm-bypass', {
    method: 'POST',
    body: JSON.stringify({ steamId }),
  });
}

export async function removeMissionAntiFarmBypass(steamId) {
  return adminFetch(`/admin/missions/anti-farm-bypass/${encodeURIComponent(steamId)}`, { method: 'DELETE' });
}

export async function adminFillMissionProgressFull(steamId) {
  return adminFetch('/admin/missions/test-fill-progress', {
    method: 'POST',
    body: JSON.stringify({ steamId }),
  });
}

export async function resetDailyLoginMission(steamId) {
  return adminFetch('/admin/missions/reset-daily-login', {
    method: 'POST',
    body: JSON.stringify({ steamId }),
  });
}

