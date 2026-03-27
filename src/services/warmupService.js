import { getApiBaseUrl } from '../utils/apiBase';

const BASE = () => `${getApiBaseUrl()}/api/warmup`;

export async function getWarmupStats(steamId) {
  const res = await fetch(`${BASE()}/stats/${encodeURIComponent(steamId)}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Erro ao buscar estatísticas de warmup');
  return res.json();
}
