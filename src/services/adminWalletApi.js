import { getApiBaseUrl } from '../utils/apiBase';
import { getAdminToken } from './adminWheelApi';

const base = `${getApiBaseUrl()}/api/admin/wallet`;

function headers() {
  const token = getAdminToken();
  return token ? { 'x-admin-token': token } : {};
}

async function asJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`);
  return data;
}

export async function fetchAdminWalletStatus() {
  const res = await fetch(`${base}/status`, { headers: headers() });
  return asJson(res);
}

export async function clearAdminWalletCache() {
  const res = await fetch(`${base}/cache/clear`, { method: 'POST', headers: headers() });
  return asJson(res);
}

export async function refreshNowAdminWallet() {
  const res = await fetch(`${base}/refresh-now`, { method: 'POST', headers: headers() });
  return asJson(res);
}

export async function clearAdminWalletInventory(steamId) {
  const res = await fetch(`${base}/inventory/clear`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ steamId }),
  });
  return asJson(res);
}

export async function testAdminCsfloat(skinName) {
  const res = await fetch(`${base}/csfloat/test`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ skinName: String(skinName || '').trim() || undefined }),
  });
  return asJson(res);
}
