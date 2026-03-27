/**
 * Base URL para chamadas à API.
 * - Dev (Vite): pode usar VITE_BACKEND_URL (ex.: http://localhost:3001).
 * - Build/produção (inclui Docker com Nginx): usa URL relativa ('')
 *   para aproveitar proxy /api e /socket.io do container frontend.
 */
export function getApiBaseUrl() {
  const envBase = (import.meta.env.VITE_BACKEND_URL || '').trim();
  if (import.meta.env.DEV && envBase) return envBase;
  return '';
}
