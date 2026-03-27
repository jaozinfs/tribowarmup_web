/**
 * skinsService.js — Catálogo de skins da API
 */

import { getApiBaseUrl } from '../utils/apiBase';

export async function fetchSkins() {
  const res = await fetch(`${getApiBaseUrl()}/api/skins`);
  if (!res.ok) throw new Error('Erro ao buscar skins');
  return res.json();
}
