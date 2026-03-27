/**
 * Normaliza URL do avatar Steam para formato absoluto.
 * URLs consistentes permitem cache do navegador entre páginas.
 */
const DEFAULT_AVATAR = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';

export function normalizeAvatarUrl(raw) {
  if (!raw || typeof raw !== 'string') return DEFAULT_AVATAR;
  if (raw.startsWith('http')) return raw;
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `https://cdn.akamai.steamstatic.com${path}`;
}
