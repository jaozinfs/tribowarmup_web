import { getApiBaseUrl } from '../utils/apiBase';

const BASE = () => `${getApiBaseUrl()}/api/warmup`;

export async function createVipWarmup({ name, map, durationMinutes, password, hasPassword, hasBots }) {
  const res = await fetch(`${BASE()}/vip/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: (name || '').trim(),
      map,
      durationMinutes,
      hasPassword: Boolean(hasPassword && password),
      password: hasPassword ? password : null,
      hasBots: Boolean(hasBots),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao criar warmup VIP');
  }
  return res.json();
}

export async function pingVipWarmup(roomId) {
  const res = await fetch(`${BASE()}/vip/rooms/${encodeURIComponent(roomId)}/ping`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao manter warmup ativo');
  }
  return res.json();
}

export async function getMyVipWarmups() {
  const res = await fetch(`${BASE()}/vip/rooms/me`, {
    credentials: 'include',
  });
  if (!res.ok) return { rooms: [] };
  return res.json();
}

