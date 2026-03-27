/**
 * loadoutService.js — API de loadout
 */

import { getApiBaseUrl } from '../utils/apiBase';

export async function fetchLoadout(steamId) {
  const res = await fetch(`${getApiBaseUrl()}/api/loadout/${steamId}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Erro ao buscar loadout');
  return res.json();
}

export async function saveLoadout(
  steamId,
  { agent_ct, agent_t, music_kit, knife_ct, knife_t, weapons, gloves_ct, gloves_t }
) {
  const res = await fetch(`${getApiBaseUrl()}/api/loadout/${steamId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_ct, agent_t, music_kit, knife_ct, knife_t, weapons, gloves_ct, gloves_t }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Erro ao salvar loadout');
  return res.json();
}
