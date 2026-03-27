import { getApiBaseUrl } from '../utils/apiBase';

const opts = { credentials: 'include' };

export async function getMyWeeklyMissions() {
  const res = await fetch(`${getApiBaseUrl()}/api/missions/me`, opts);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Erro ao carregar missões');
  return res.json();
}

export async function claimMission(userMissionId) {
  const res = await fetch(`${getApiBaseUrl()}/api/missions/me/claim`, {
    method: 'POST',
    ...opts,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userMissionId }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(data?.error || 'Erro ao resgatar missão');
  if (data?.ok === false) throw new Error(data?.error || 'Erro ao resgatar missão');
  return data;
}

export async function getMissionsProgressUpdate() {
  const res = await fetch(`${getApiBaseUrl()}/api/missions/me/progress-update`, opts);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Erro ao buscar atualização de missões');
  const data = await res.json();
  return data && typeof data === 'object' && data.kind === 'missions_progress' ? data : null;
}

