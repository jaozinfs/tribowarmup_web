/** Rótulo curto para histórico de partidas (lobbyType / game_mode no backend). */
export function formatGameModeLabel(mode) {
  const m = String(mode || 'pug').trim().toLowerCase();
  const map = {
    pug: 'PUG',
    mix: 'MIX',
    squad: 'Clan',
    snaparena: 'SnapArena',
    snaphack: 'SnapHack',
  };
  return map[m] || (m ? m.charAt(0).toUpperCase() + m.slice(1) : 'PUG');
}
