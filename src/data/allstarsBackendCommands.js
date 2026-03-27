/**
 * Alinhado ao enum BackendCommandType + switch HandleBackendCommand no AllstarsMatchzyPlugin.
 * Tipos extras existem no enum C# mas podem não ter handler no switch (documentado em handled).
 */

export const ALLSTARS_DUEL_CARD_TYPES = [
  'DOUBLE_ROUND',
  'DOUBLE_DAMAGE',
  'FORCE_ECO',
  'NO_UTILITY',
  'REMOVE_PLAYER',
  'MID_PISTOL',
  'EXTRA_MONEY',
  'HEADSHOT_ONLY',
  'SPEED_BOOST',
  'LOW_GRAVITY',
  'WALLHACK',
  'INCREASED_HEALTH',
  'INFINITE_GRENADES',
  'INFINITE_MOLOTOV',
  'INFINITE_FLASH',
  'INFINITE_SMOKE',
  'LOW_COOLDOWN_GRENADE',
];

/** Comandos com tratamento em HandleBackendCommand */
export const ALLSTARS_HANDLED_COMMANDS = [
  {
    type: 'start_match',
    emoji: '🏁',
    title: 'start_match',
    label: 'Iniciar partida (reset)',
    description:
      'Zera placar de partida/duelo, limpa cartas pendentes e jogadores ativos; fase STARTING e state machine OnMatchStart.',
    payloadHint: 'Payload vazio {}.',
    handled: true,
  },
  {
    type: 'start_duel',
    emoji: '⚔️',
    title: 'start_duel',
    label: 'Iniciar duelo 1v1',
    description:
      'Incrementa duelo, reseta round, configura CT/TR do duelo e coloca espectadores. Requer SteamIDs válidos.',
    payloadHint: '{ duelId, ctSteamId, trSteamId }',
    handled: true,
    fields: ['duelId', 'ctSteamId', 'trSteamId'],
  },
  {
    type: 'round_start',
    emoji: '🔔',
    title: 'round_start',
    label: 'Iniciar round (driver completo)',
    description:
      'Se não estiver em warmup: aplica economia/cartas pendentes e executa Setup → Regras → Spawn → Live na state machine.',
    payloadHint: 'Opcional: roundDurationSeconds, startMoney',
    handled: true,
    fields: ['roundDurationSeconds', 'startMoney'],
  },
  {
    type: 'play_card',
    emoji: '🃏',
    title: 'play_card',
    label: 'Enfileirar carta',
    description:
      'Adiciona efeito à fila _pendingCards; aplicado no próximo round_start junto com o payload do round.',
    payloadHint: '{ card, side: "ct"|"tr", count: 1..3 }',
    handled: true,
    cardForm: true,
  },
  {
    type: 'match_end',
    emoji: '🏆',
    title: 'match_end',
    label: 'Encerrar partida (plugin)',
    description: 'Define fase FINISHED no plugin (estado interno).',
    payloadHint: 'Payload vazio {} (registro extra pode usar outras rotas).',
    handled: true,
  },
];

/** Presentes no enum C# — enfileiram na mesma tabela; o switch pode ignorar. */
export const ALLSTARS_EXTRA_QUEUE_TYPES = [
  {
    type: 'round_end',
    emoji: '⏹️',
    title: 'round_end',
    label: 'round_end (fila)',
    description: 'Tipo existe no enum; HandleBackendCommand não processa — útil só se o plugin passar a tratar.',
    handled: false,
  },
  {
    type: 'duel_start',
    emoji: '🎬',
    title: 'duel_start',
    label: 'duel_start (fila)',
    description: 'Idem — enfileiramento / integrações futuras.',
    handled: false,
  },
  {
    type: 'duel_end',
    emoji: '📤',
    title: 'duel_end',
    label: 'duel_end (fila)',
    description: 'Idem — enfileiramento / integrações futuras.',
    handled: false,
  },
];
