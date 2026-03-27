import { getApiBaseUrl } from '../utils/apiBase';

const opts = { credentials: 'include' };

export async function fetchWallet() {
  const res = await fetch(`${getApiBaseUrl()}/api/wallet`, { ...opts, cache: 'no-store' });
  if (!res.ok) throw new Error('Erro ao carregar carteira');
  return res.json();
}

export async function refreshWallet() {
  const res = await fetch(`${getApiBaseUrl()}/api/wallet/refresh`, {
    method: 'POST',
    ...opts,
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Erro ao atualizar carteira');
  return res.json();
}

export async function importSteamWallet() {
  const res = await fetch(`${getApiBaseUrl()}/api/wallet/import-steam`, {
    method: 'POST',
    ...opts,
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Erro ao importar inventário Steam');
  return res.json();
}
