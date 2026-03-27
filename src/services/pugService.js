import { getApiBaseUrl } from '../utils/apiBase';

const BASE = () => `${getApiBaseUrl()}/api/pug`;

export async function getLobbies() {
  const res = await fetch(`${BASE()}/lobbies`, { credentials: 'include' });
  if (!res.ok) throw new Error('Erro ao buscar lobbies');
  return res.json();
}

export async function createLobby(displayName = null, lobbyPassword = null, lobbyType = 'pug', matchzyOwnerAdmin = false) {
  const res = await fetch(`${BASE()}/lobbies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ displayName, lobbyPassword, lobbyType, matchzyOwnerAdmin }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao criar lobby');
  }
  return res.json();
}

export async function updateLobbySettings(lobbyId, settings) {
  const res = await fetch(`${BASE()}/lobbies/${lobbyId}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao atualizar configurações');
  }
  return res.json();
}

export async function getLobby(lobbyId) {
  const res = await fetch(`${BASE()}/lobbies/${lobbyId}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Lobby não encontrado');
  return res.json();
}

export async function joinLobby(lobbyId, displayName = null, lobbyPassword = null, options = {}) {
  const preferredSide = options?.preferredSide || null;
  const res = await fetch(`${BASE()}/lobbies/${lobbyId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ displayName, lobbyPassword, preferredSide }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao entrar no lobby');
  }
  return res.json();
}

export async function leaveLobby(lobbyId) {
  const res = await fetch(`${BASE()}/lobbies/${lobbyId}/leave`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao sair do lobby');
  }
  return res.json();
}

export async function addBots(lobbyId) {
  const res = await fetch(`${BASE()}/lobbies/${lobbyId}/add-bots`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao adicionar bots');
  }
  return res.json();
}

export async function resetLobby(lobbyId) {
  const res = await fetch(`${BASE()}/lobbies/${lobbyId}/reset`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao resetar lobby');
  }
  return res.json();
}

export async function getMyLobby() {
  const res = await fetch(`${BASE()}/my-lobby`, { credentials: 'include' });
  if (!res.ok) return null;
  return res.json();
}

export async function getConnectInfo() {
  const res = await fetch(`${BASE()}/connect-info`, { credentials: 'include' });
  if (!res.ok) return null;
  return res.json();
}

export async function getPoolStatus() {
  const res = await fetch(`${BASE()}/pool/status`, { credentials: 'include' });
  if (!res.ok) return [];
  return res.json();
}

export async function testDynamicScale() {
  const res = await fetch(`${BASE()}/pool/test-dynamic`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

export async function testResetPool() {
  const res = await fetch(`${BASE()}/pool/test-reset`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

export async function getLobbyMessages(lobbyId) {
  const res = await fetch(`${BASE()}/lobbies/${lobbyId}/messages`, { credentials: 'include' });
  if (!res.ok) return [];
  return res.json();
}

export async function sendChatMessage(lobbyId, text) {
  const res = await fetch(`${BASE()}/lobbies/${lobbyId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao enviar mensagem');
  }
  return res.json();
}

export async function requestAiStrategy(lobbyId, payload = {}) {
  const res = await fetch(`${BASE()}/lobbies/${lobbyId}/ai-strategy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao pedir estratégia');
  }
  return res.json();
}

export async function beginVeto(lobbyId) {
  const res = await fetch(`${BASE()}/lobbies/${lobbyId}/begin-veto`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao iniciar veto');
  }
  return res.json();
}

export async function vetoMap(lobbyId, map) {
  const res = await fetch(`${BASE()}/lobbies/${lobbyId}/veto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ map }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao banir mapa');
  }
  return res.json();
}

export async function vetoAuto(lobbyId) {
  const res = await fetch(`${BASE()}/lobbies/${lobbyId}/veto/auto`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro no auto-ban');
  }
  return res.json();
}

/** @param body {{ cardId?: string, confirm?: boolean }} */
export async function selectSnapArenaCard(lobbyId, body) {
  const res = await fetch(`${BASE()}/lobbies/${lobbyId}/cards/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao selecionar carta');
  }
  return res.json();
}

export async function startMatchAfterCountdown(lobbyId, map) {
  const res = await fetch(`${BASE()}/match/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ lobbyId, map }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao iniciar partida');
  }
  return res.json();
}

export async function getPlayerStats(steamId) {
  const res = await fetch(`${BASE()}/stats/${steamId}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Erro ao buscar estatísticas');
  return res.json();
}

export async function getHeatmapData(steamId, map, type = 'deaths') {
  const res = await fetch(`${BASE()}/stats/${steamId}/heatmap?map=${encodeURIComponent(map)}&type=${type}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Erro ao buscar dados do heatmap');
  return res.json();
}

/**
 * @param {string} steamId
 * @param {number} [limit=10]
 * @param {number} [page=1]
 * @param {{ gameMode?: string, sort?: 'asc'|'desc' }} [opts]
 * @returns {Promise<{ matches: object[], page: number, limit: number, hasMore: boolean }>}
 */
export async function getRecentMatches(steamId, limit = 10, page = 1, opts = {}) {
  const params = new URLSearchParams({ limit: String(limit), page: String(page) });
  if (opts.gameMode && opts.gameMode !== 'all') params.set('gameMode', opts.gameMode);
  if (opts.sort === 'asc' || opts.sort === 'desc') params.set('sort', opts.sort);
  const res = await fetch(
    `${BASE()}/stats/${encodeURIComponent(steamId)}/matches?${params.toString()}`,
    { credentials: 'include' }
  );
  if (!res.ok) throw new Error('Erro ao buscar partidas recentes');
  return res.json();
}
