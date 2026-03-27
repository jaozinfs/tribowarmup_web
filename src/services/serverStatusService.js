/**
 * serverStatusService.js — Status dos servidores (mapa, modo, jogadores, top 3) vindo do backend.
 */

import { getApiBaseUrl } from '../utils/apiBase';

export async function fetchServerStatus() {
  const res = await fetch(`${getApiBaseUrl()}/api/servers/status`, { cache: 'no-store' });
  if (!res.ok) return {};
  return res.json();
}

/** Total de jogadores online em todos os servidores (inclui PUG). */
export async function fetchOnlineSummary() {
  const res = await fetch(`${getApiBaseUrl()}/api/servers/status/summary`, { cache: 'no-store' });
  if (!res.ok) return { totalPlayersOnline: 0, serverCount: 0 };
  return res.json();
}
