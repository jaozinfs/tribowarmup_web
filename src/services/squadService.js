import { getApiBaseUrl } from '../utils/apiBase';

const BASE = () => `${getApiBaseUrl()}/api/squad`;

export async function getMySquad() {
  const res = await fetch(`${BASE()}/me`, { credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json();
  return data || null;
}

export async function createSquad(name) {
  const res = await fetch(`${BASE()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name: (name || '').trim() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao criar squad');
  }
  return res.json();
}

export async function leaveSquad() {
  const res = await fetch(`${BASE()}/leave`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao sair');
  }
  return res.json();
}

export async function dissolveSquad() {
  const res = await fetch(`${BASE()}/dissolve`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao dissolver');
  }
  return res.json();
}

export async function generateInvite(password, expiresInMinutes) {
  const res = await fetch(`${BASE()}/invite/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password: password || '', expiresInMinutes: expiresInMinutes || 60 * 24 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao gerar convite');
  }
  return res.json();
}

export async function joinSquadByInvite(token, password) {
  const res = await fetch(`${BASE()}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token: (token || '').trim(), password: password || '' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao entrar no squad');
  }
  return res.json();
}

export async function getSquadById(squadId) {
  const res = await fetch(`${BASE()}/${encodeURIComponent(squadId)}`, { credentials: 'include' });
  if (!res.ok) return null;
  return res.json();
}

export async function updateSquad(payload) {
  const res = await fetch(`${BASE()}/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao atualizar squad');
  }
  return res.json();
}
