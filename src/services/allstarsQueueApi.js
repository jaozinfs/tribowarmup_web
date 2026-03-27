import { getApiBaseUrl } from '../utils/apiBase';

function baseUrl(matchId) {
  const b = getApiBaseUrl();
  return `${b}/api/allstars/match/${encodeURIComponent(String(matchId || '').trim())}`;
}

/**
 * Enfileira comando lido pelo plugin (HandleBackendCommand / poll).
 * POST /api/allstars/match/:matchId/command
 */
export async function enqueueAllstarsCommand(matchId, type, payload = {}) {
  const mid = String(matchId || '').trim();
  if (!mid) throw new Error('Informe o Match ID.');
  const t = String(type || '').trim();
  if (!t) throw new Error('Tipo de comando obrigatório.');

  const res = await fetch(`${baseUrl(mid)}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ type: t, payload: payload && typeof payload === 'object' ? payload : {} }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * GET poll — mesma fila que o servidor CS2 consome.
 */
export async function pollAllstarsCommands(matchId, cursor = '0', limit = 30) {
  const mid = String(matchId || '').trim();
  if (!mid) throw new Error('Informe o Match ID.');
  const c = String(cursor ?? '0');
  const url = `${baseUrl(mid)}/poll?cursor=${encodeURIComponent(c)}&limit=${Math.min(100, Math.max(1, Number(limit) || 30))}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
