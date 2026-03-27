/**
 * steamId.js — Utilitários para Steam ID
 * Extrai SteamID64 de URL de perfil ou input.
 */

// Regex para Steam profile URL
// https://steamcommunity.com/profiles/76561198000000000
// https://steamcommunity.com/id/username
const PROFILE_RE = /steamcommunity\.com\/profiles\/(\d{17})/i;
const PROFILE_ID_RE = /steamcommunity\.com\/id\/([a-zA-Z0-9_-]+)/i;

export function parseSteamId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  // Já é SteamID64 (17 dígitos)
  if (/^\d{17}$/.test(trimmed)) return trimmed;
  const profileMatch = trimmed.match(PROFILE_RE);
  if (profileMatch) return profileMatch[1];
  return null;
}
