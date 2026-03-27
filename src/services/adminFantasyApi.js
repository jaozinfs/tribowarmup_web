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
    headers: { ...adminHeaders(), ...(options.headers || {}) },
  });
  if (res.status === 403) {
    setAdminToken(null);
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Acesso negado.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro na operação admin fantasy');
  return data;
}

export function fetchAdminFantasyStatus(weekKey) {
  const q = weekKey ? `?week=${encodeURIComponent(weekKey)}` : '';
  return adminFetch(`/admin/fantasy/status${q}`);
}

export function clearAdminFantasyCache() {
  return adminFetch('/admin/fantasy/cache/clear', { method: 'POST' });
}

export function refreshAdminFantasy(weekKey) {
  return adminFetch('/admin/fantasy/refresh', {
    method: 'POST',
    body: JSON.stringify(weekKey ? { weekKey } : {}),
  });
}

export function refreshNowAdminFantasy(weekKey) {
  return adminFetch('/admin/fantasy/refresh-now', {
    method: 'POST',
    body: JSON.stringify(weekKey ? { weekKey } : {}),
  });
}

/** Baixa stats, persiste no MySQL e reconstrói cache (use quando o fantasy vier vazio). */
export function syncFullAdminFantasy(weekKey) {
  return adminFetch('/admin/fantasy/sync-full', {
    method: 'POST',
    body: JSON.stringify(weekKey ? { weekKey } : {}),
  });
}

export function simulateAdminFantasyWeek(weekKey) {
  return adminFetch('/admin/fantasy/simulate-week', {
    method: 'POST',
    body: JSON.stringify(weekKey ? { weekKey } : {}),
  });
}

export function resetAdminFantasyTeam({ steamId, weekKey }) {
  return adminFetch('/admin/fantasy/teams/reset', {
    method: 'POST',
    body: JSON.stringify({ steamId, ...(weekKey ? { weekKey } : {}) }),
  });
}

export function repairAdminFantasyWeek(weekKey) {
  return adminFetch('/admin/fantasy/repair-week', {
    method: 'POST',
    body: JSON.stringify(weekKey ? { weekKey } : {}),
  });
}

export function startAdminFantasyRebuildAll(weekKey, options = {}) {
  return adminFetch('/admin/fantasy/rebuild-all/start', {
    method: 'POST',
    body: JSON.stringify({
      ...(weekKey ? { weekKey } : {}),
      ...(options.forceUnsafe ? { forceUnsafe: true } : {}),
    }),
  });
}

export function getAdminFantasyJob(jobId) {
  return adminFetch(`/admin/fantasy/jobs/${encodeURIComponent(String(jobId || ''))}`);
}

