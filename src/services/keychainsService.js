// ByMykel CSGO-API keychains (charms)
const KEYCHAINS_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/keychains.json';

let _cache = null;
let _cacheAt = 0;
const TTL_MS = 1000 * 60 * 30;

export async function fetchKeychains() {
  if (_cache && Date.now() - _cacheAt < TTL_MS) return _cache;
  const res = await fetch(KEYCHAINS_URL, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  _cache = Array.isArray(data) ? data : [];
  _cacheAt = Date.now();
  return _cache;
}

