export const SNAPARENA_CARD_CATEGORIES = [
  { key: 'JHON', label: '🃏 Cartas do estilo Jhon' },
  { key: 'COMBAT_DIRECT', label: '🔥 Combate direto (comuns)' },
  { key: 'MOVEMENT', label: '⚡ Movimento / física' },
  { key: 'UTILS', label: '💣 Utilitários' },
  { key: 'LOADOUT', label: '🔫 Armas / loadout' },
  { key: 'TROLL', label: '🧠 Troll / caos' },
  { key: 'ROUND', label: '🧨 Cartas de round (globais)' },
];

/**
 * IDs aceitos no POST /cards/select.
 * `pluginCard` (string truthy) = mapeada no backend e com efeito no plugin → badge OK no UI.
 * Sem `pluginCard` = ainda sem engine / só conceito → badge DEV.
 */
export const SNAPARENA_CARDS = [
  // JHON
  { id: 'WALLHACK', name: 'Wallhack', emoji: '👁️', category: 'JHON', pluginCard: 'WALLHACK' },
  { id: 'NO_RECOIL', name: 'No Recoil', emoji: '🫳', category: 'JHON' },
  { id: 'LIGHT_AIMBOT', name: 'Aimbot leve', emoji: '🎯', category: 'JHON' },
  { id: 'HEADSHOT_ONLY', name: 'Headshot Only', emoji: '🎯', category: 'JHON', pluginCard: 'HEADSHOT_ONLY' },
  { id: 'DOUBLE_DAMAGE', name: '2x damage', emoji: '⚔️', category: 'JHON', pluginCard: 'DOUBLE_DAMAGE' },
  { id: 'INCREASED_HEALTH', name: 'Vida aumentada (150/200 HP)', emoji: '❤️', category: 'JHON', pluginCard: 'INCREASED_HEALTH' },

  // Combate direto (placeholder no engine atual)
  { id: 'COMBAT_DIRECT', name: 'Combate direto', emoji: '🔥', category: 'COMBAT_DIRECT', pluginCard: 'NO_UTILITY' },

  // Movimento / física
  { id: 'SPEED_BOOST', name: 'Velocidade aumentada', emoji: '⚡', category: 'MOVEMENT', pluginCard: 'SPEED_BOOST' },
  { id: 'LOW_GRAVITY', name: 'Low Gravity', emoji: '🌙', category: 'MOVEMENT', pluginCard: 'LOW_GRAVITY' },
  { id: 'SUPER_JUMP', name: 'Super Jump', emoji: '🦘', category: 'MOVEMENT' },
  { id: 'SLOW_MOTION', name: 'Slow Motion (global)', emoji: '⏳', category: 'MOVEMENT' },
  { id: 'TELEPORT', name: 'Teleport (limitado / por tecla)', emoji: '🚪', category: 'MOVEMENT' },

  // Utilitários
  { id: 'INFINITE_GRENADES', name: 'Granada infinita', emoji: '💣', category: 'UTILS', pluginCard: 'INFINITE_GRENADES' },
  { id: 'INFINITE_MOLOTOV', name: 'Molotov infinito', emoji: '🔥', category: 'UTILS', pluginCard: 'INFINITE_MOLOTOV' },
  { id: 'INFINITE_FLASH', name: 'Flash infinito', emoji: '🫨', category: 'UTILS', pluginCard: 'INFINITE_FLASH' },
  { id: 'INFINITE_SMOKE', name: 'Smoke infinito', emoji: '🌫️', category: 'UTILS', pluginCard: 'INFINITE_SMOKE' },
  { id: 'LOW_COOLDOWN_GRENADE', name: 'Granada com cooldown baixo', emoji: '💥', category: 'UTILS', pluginCard: 'LOW_COOLDOWN_GRENADE' },

  // Loadout / armas
  { id: 'ONLY_PISTOL', name: 'Só pistola', emoji: '🔫', category: 'LOADOUT', pluginCard: 'MID_PISTOL' },
  { id: 'ONLY_AWP', name: 'Só AWP', emoji: '🎯', category: 'LOADOUT', pluginCard: 'ONLY_AWP' },
  { id: 'ONLY_KNIFE', name: 'Só faca', emoji: '🗡️', category: 'LOADOUT', pluginCard: 'ONLY_KNIFE' },
  { id: 'RANDOM_WEAPON', name: 'Arma aleatória', emoji: '🎲', category: 'LOADOUT', pluginCard: 'RANDOM_WEAPON' },
  { id: 'AUTO_WEAPON_SWITCH', name: 'Troca automática de arma', emoji: '🔁', category: 'LOADOUT', pluginCard: 'AUTO_WEAPON_ROTATE' },
  { id: 'NO_RELOAD', name: 'Sem reload', emoji: '🔄', category: 'LOADOUT', pluginCard: 'NO_RELOAD' },

  // Troll / caos
  { id: 'PARTIAL_INVISIBILITY', name: 'Invisibilidade parcial', emoji: '🫥', category: 'TROLL' },
  { id: 'ALL_INVISIBLE', name: 'Todo mundo invisível', emoji: '👻', category: 'TROLL' },
  { id: 'GIANT_MODEL', name: 'Modelo gigante', emoji: '🗿', category: 'TROLL' },
  { id: 'SMALL_MODEL', name: 'Modelo pequeno', emoji: '🧩', category: 'TROLL' },
  { id: 'RANDOM_TEAM_SWAP', name: 'Troca de time aleatória', emoji: '🔀', category: 'TROLL' },
  { id: 'RANDOM_SPAWN', name: 'Spawn aleatório no mapa', emoji: '📍', category: 'TROLL' },
  { id: 'MIRROR_MOVEMENT', name: 'Espelhado (invert movement)', emoji: '🪞', category: 'TROLL' },

  // Cartas de round
  { id: 'BOMB_PLANTED', name: 'Bomba já plantada', emoji: '💣', category: 'ROUND' },
  { id: 'DEFUSE_INSTANT', name: 'Defuse instantâneo', emoji: '🧯', category: 'ROUND' },
  { id: 'ROUND_TIME_REDUCED', name: 'Tempo de round reduzido', emoji: '⏱️', category: 'ROUND' },
  { id: 'FREEZE_TIME_0', name: 'Freeze time 0', emoji: '🧊', category: 'ROUND' },
  { id: 'AUTO_1V1_CLUTCH', name: '1x1 clutch automático', emoji: '🏆', category: 'ROUND', pluginCard: 'REMOVE_PLAYER' },
  { id: 'CLOSED_ARENA', name: 'Arena fechada (tipo retake)', emoji: '🏟️', category: 'ROUND' },
];

export const SNAPARENA_CARD_BY_ID = Object.fromEntries(
  SNAPARENA_CARDS.map((c) => [c.id, c]),
);

