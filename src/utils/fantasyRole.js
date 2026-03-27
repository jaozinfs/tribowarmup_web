export const FIELD_ROLES = ['captain', 'support', 'entry', 'lurk', 'anchor'];

export const FANTASY_ROLES = [...FIELD_ROLES, 'coach'];

export const ROLE_LABELS_PT = {
  captain: 'Capitão',
  support: 'Support',
  entry: 'Entry',
  lurk: 'Lurk',
  anchor: 'Âncora',
  coach: 'Técnico',
};

function simpleHash(str) {
  let h = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function isCoachPlayer(playerId) {
  return simpleHash(`coach:${String(playerId)}`) % 10 === 0;
}

export function roleForPlayerId(playerId) {
  if (isCoachPlayer(playerId)) return 'coach';
  const h = simpleHash(String(playerId));
  return FIELD_ROLES[h % FIELD_ROLES.length];
}

export function roleSlotIndex(role) {
  const r = String(role || '').toLowerCase();
  if (r === 'coach') return -1;
  const i = FIELD_ROLES.indexOf(r);
  return i >= 0 ? i : 0;
}
