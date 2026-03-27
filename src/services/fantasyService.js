import { getApiBaseUrl } from '../utils/apiBase';

const opts = { credentials: 'include' };

function buildQuery(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export async function fetchFantasyPlayerHltvProfile(playerId) {
  const res = await fetch(
    `${getApiBaseUrl()}/api/fantasy/players/${encodeURIComponent(playerId)}/hltv-profile`,
    { ...opts, cache: 'no-store' },
  );
  if (!res.ok) throw new Error('Erro ao carregar perfil HLTV');
  return res.json();
}

export async function fetchFantasyPlayerLoadoutKit(playerId) {
  const res = await fetch(
    `${getApiBaseUrl()}/api/fantasy/players/${encodeURIComponent(playerId)}/loadout-kit`,
    { ...opts, cache: 'no-store' },
  );
  if (!res.ok) throw new Error('Erro ao carregar kit de loadout');
  return res.json();
}

/** @param {Record<string, string|number|undefined>} params — week, page, limit, q, sort, team, role */
export async function fetchFantasyPlayers(params = {}) {
  const q = buildQuery(params);
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/players${q}`, { ...opts, cache: 'no-store' });
  if (!res.ok) throw new Error('Erro ao buscar jogadores fantasy');
  return res.json();
}

export async function fetchFantasySession(weekKey) {
  const q = weekKey ? `?week=${encodeURIComponent(weekKey)}` : '';
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/session${q}`, opts);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Erro ao carregar sessão fantasy');
  return res.json();
}

export async function fetchFantasyInventory(weekKey) {
  const q = weekKey ? `?week=${encodeURIComponent(weekKey)}` : '';
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/inventory${q}`, opts);
  if (res.status === 401) return { cards: [] };
  if (!res.ok) throw new Error('Erro ao carregar coleção');
  return res.json();
}

export async function fetchFantasyPacks(paramsOrWeekKey) {
  const params = typeof paramsOrWeekKey === 'string' ? { week: paramsOrWeekKey } : (paramsOrWeekKey || {});
  const q = buildQuery(params);
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/packs${q}`, opts);
  if (res.status === 401) return { packs: [] };
  if (!res.ok) throw new Error('Erro ao carregar packs');
  return res.json();
}

export async function openFantasyPack({ weekKey, packId }) {
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/packs/open`, {
    method: 'POST',
    ...opts,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weekKey, packId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Erro ao abrir pacote');
  return data;
}

export async function markFantasyTutorialDone() {
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/tutorial/done`, {
    method: 'POST',
    ...opts,
  });
  if (!res.ok) throw new Error('Erro ao salvar tutorial');
  return res.json();
}

export async function fetchMyFantasyTeam(weekKey) {
  const q = weekKey ? `?week=${encodeURIComponent(weekKey)}` : '';
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/teams/me${q}`, opts);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Erro ao buscar seu time fantasy');
  return res.json();
}

export async function saveFantasyTeam({ weekKey, players, captainId, benchId = null, coachId = null }) {
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/teams/me`, {
    method: 'POST',
    ...opts,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weekKey, players, captainId, benchId, coachId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Erro ao salvar time fantasy');
  return data;
}

export async function createFantasyLeague(name) {
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/leagues`, {
    method: 'POST',
    ...opts,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Erro ao criar liga');
  return data;
}

export async function joinFantasyLeague(leagueId, inviteCode) {
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/leagues/${encodeURIComponent(leagueId)}/join`, {
    method: 'POST',
    ...opts,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteCode }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Erro ao entrar na liga');
  return data;
}

export async function fetchFantasyGlobalRanking() {
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/ranking/global`, opts);
  if (!res.ok) throw new Error('Erro ao buscar ranking fantasy');
  return res.json();
}

export async function fetchFantasyWeeklyRanking(weekKey) {
  const q = weekKey ? `?week=${encodeURIComponent(weekKey)}` : '';
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/ranking/weekly${q}`, opts);
  if (!res.ok) throw new Error('Erro ao buscar ranking semanal fantasy');
  return res.json();
}

export async function fetchMyFantasyLeagues() {
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/leagues/my`, opts);
  if (res.status === 401) return [];
  if (!res.ok) throw new Error('Erro ao buscar ligas fantasy');
  return res.json();
}

export async function fetchFantasyLeagueRanking(leagueId, weekKey) {
  const q = weekKey ? `?week=${encodeURIComponent(weekKey)}` : '';
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/leagues/${encodeURIComponent(leagueId)}/ranking${q}`, opts);
  if (!res.ok) throw new Error('Erro ao buscar ranking da liga');
  return res.json();
}

export async function fetchFantasyWeekMeta() {
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/week/meta`, { ...opts, cache: 'no-store' });
  if (!res.ok) throw new Error('Erro ao carregar semana do fantasy');
  return res.json();
}

export async function fetchFantasyLatestResults() {
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/results/latest`, { ...opts, cache: 'no-store' });
  if (!res.ok) throw new Error('Erro ao carregar últimos resultados do fantasy');
  return res.json();
}

export async function fetchMyFantasySummary() {
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/me/summary`, { ...opts, cache: 'no-store' });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Erro ao carregar resumo do fantasy');
  return res.json();
}

export async function fetchMyFantasyStatement(limit = 12) {
  const res = await fetch(`${getApiBaseUrl()}/api/fantasy/me/statement?limit=${encodeURIComponent(String(limit))}`, { ...opts, cache: 'no-store' });
  if (res.status === 401) return [];
  if (!res.ok) throw new Error('Erro ao carregar extrato do fantasy');
  return res.json();
}
