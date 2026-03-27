import { getApiBaseUrl } from '../utils/apiBase';

// ByMykel CSGO-API agents (raw GitHub)
const AGENTS_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/agents.json';

let _cache = null;
let _cacheAt = 0;
const TTL_MS = 1000 * 60 * 30;

export async function fetchAgents() {
  if (_cache && Date.now() - _cacheAt < TTL_MS) return _cache;
  const res = await fetch(AGENTS_URL, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  _cache = Array.isArray(data) ? data : [];
  _cacheAt = Date.now();
  return _cache;
}

export async function fetchAgentsByTeam(teamId /* 'counter-terrorists' | 'terrorists' */) {
  const all = await fetchAgents();
  return all.filter((a) => a?.team?.id === teamId);
}

