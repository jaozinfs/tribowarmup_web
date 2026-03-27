import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { HamburgerNav } from '../components/HamburgerNav';
import { getLobby, leaveLobby, resetLobby, addBots, getConnectInfo, getLobbyMessages, sendChatMessage, beginVeto, vetoMap, vetoAuto, startMatchAfterCountdown, updateLobbySettings, requestAiStrategy, selectSnapArenaCard, joinLobby } from '../services/pugService';
import { enqueueAllstarsCommand, pollAllstarsCommands } from '../services/allstarsQueueApi';
import { SNAPARENA_CARD_CATEGORIES, SNAPARENA_CARD_BY_ID, SNAPARENA_CARDS } from '../data/snapArenaCards';
import { ALLSTARS_DUEL_CARD_TYPES } from '../data/allstarsBackendCommands';
import { connectSocket, disconnectSocket, getSocket, joinLobbyRoom, leaveLobbyRoom } from '../services/pugSocket';
import { getLevelStyle } from '../utils/levelStyle';
import { getApiBaseUrl } from '../utils/apiBase';
import { Avatar } from '../components/Avatar';
import '../index.css';
import { TrackedButton } from '../components/TrackedButton';

const SLOTS_PER_TEAM = 5;
const MAX_LOBBY_PLAYERS = 10;
const SERVER_PREP_SECONDS = 12;
const MAP_VETO_COUNTDOWN_SECONDS = 12;
const SNAPHACK_ONBOARDING_STORAGE_KEY = 'snaphack_lobby_onboarding_v1';
const SNAPARENA_ONBOARDING_STORAGE_KEY = 'snaparena_lobby_onboarding_v1';
/** Alinhado ao backend SNAPARENA_MAX_CARDS_PER_ROUND / HALF */
const SNAPARENA_MAX_CARDS_PER_ROUND = 3;
const SNAPARENA_MAX_CARDS_PER_HALF = 3;

/** Lista de lobbies do mesmo tipo (voltar / sair da sala). */
function lobbyListPathForType(lobbyType) {
  const t = String(lobbyType || 'pug').toLowerCase();
  if (t === 'snaparena') return '/pug?lobbyType=snaparena';
  if (t === 'snaphack') return '/pug?lobbyType=snaphack';
  if (t === 'squad') return '/pug?lobbyType=squad';
  return '/pug';
}

const SNAPHACK_PLAYER_HACKS = [
  { key: 'NO_HEADSHOT', name: 'Sem headshot', description: 'Voce nao recebe dano na cabeca' },
  { key: 'DOUBLE_DAMAGE', name: 'Dano dobrado', description: 'Seu dano e dobrado' },
  { key: 'INFINITE_GRENADES', name: 'Granadas infinitas', description: 'Granadas sao repostas automaticamente' },
  { key: 'INVISIBLE_WHEN_STOPPED', name: 'Invisivel parado', description: 'Fica dificil de ser visto parado' },
  { key: 'INVISIBLE_ALWAYS', name: 'Invisivel sempre', description: 'Voce fica invisivel o round inteiro (apenas o mundo te ignora)' },
  { key: 'WALLHACK', name: 'Wallhack (temp)', description: 'Enxerga inimigos por um tempo ao redor' },
  { key: 'FAST_RELOAD', name: 'Recarga rapida', description: 'Recarga de arma mais rapida (clip reabastecido)' },
  { key: 'SPEED_BOOST', name: 'Velocidade', description: 'Movimento muito mais rapido' },
  { key: 'LOW_GRAVITY_JUMP', name: 'Pulo leve', description: 'Pulo fica mais leve (gravidade reduzida)' },
];

const SNAPHACK_ROUND_MODIFIERS = [
  { key: 'LOW_GRAVITY', name: 'Low Gravity', description: 'Gravidade reduzida no round' },
  { key: 'ONLY_PISTOL', name: 'Somente pistola', description: 'Restrito apenas a faca + pistola' },
  { key: 'INFINITE_AMMO', name: 'Municao infinita', description: 'Reabastecimento/clips infinitos durante o round' },
  { key: 'ONE_HP', name: '1 HP', description: 'Vida fixa em 1 HP' },
];

const SNAPHACK_DEFAULT_CONFIG = {
  enabled: true,
  enabledHacks: SNAPHACK_PLAYER_HACKS.map((h) => h.key),
  enabledRounds: SNAPHACK_ROUND_MODIFIERS.map((r) => r.key),
};

/** Ícones pequenos (veto, performance, thumbnail connect). */
const MAP_ICONS_BASE = '/images/maps';
/** Fundos grandes (só para fundo da arena após veto). */
const MAP_BACKGROUNDS_BASE = '/images/maps/backgrounds';
const CT_VETO_IMG = '/images/pug_ct.png';
const TR_VETO_IMG = '/images/pug_tr.png';

/** Extracts the bare map name from a full path (e.g. 'workshop/3437809122/de_cache' → 'de_cache') */
function bareMapName(mapId) {
  if (!mapId) return mapId;
  const parts = mapId.split('/');
  return parts[parts.length - 1];
}

const MAP_POOL_INFO = {
  de_anubis: { name: 'Anubis', img: `${MAP_ICONS_BASE}/de_anubis.png`, bg: `${MAP_BACKGROUNDS_BASE}/de_anubis.png` },
  de_ancient: { name: 'Ancient', img: `${MAP_ICONS_BASE}/de_ancient.png`, bg: `${MAP_BACKGROUNDS_BASE}/de_ancient.png` },
  de_dust2: { name: 'Dust 2', img: `${MAP_ICONS_BASE}/de_dust2.png`, bg: `${MAP_BACKGROUNDS_BASE}/de_dust2.png` },
  de_inferno: { name: 'Inferno', img: `${MAP_ICONS_BASE}/de_inferno.png`, bg: `${MAP_BACKGROUNDS_BASE}/de_inferno.png` },
  de_mirage: { name: 'Mirage', img: `${MAP_ICONS_BASE}/de_mirage.png`, bg: `${MAP_BACKGROUNDS_BASE}/de_mirage.png` },
  de_nuke: { name: 'Nuke', img: `${MAP_ICONS_BASE}/de_nuke.png`, bg: `${MAP_BACKGROUNDS_BASE}/de_nuke.png` },
  de_overpass: { name: 'Overpass', img: `${MAP_ICONS_BASE}/de_overpass.png`, bg: `${MAP_BACKGROUNDS_BASE}/de_overpass.png` },
  de_cache: { name: 'Cache', img: `${MAP_ICONS_BASE}/de_cache.png`, bg: `${MAP_BACKGROUNDS_BASE}/de_cache.png` },
};

function getMapInfo(mapId) {
  return MAP_POOL_INFO[mapId] || MAP_POOL_INFO[bareMapName(mapId)] || { name: bareMapName(mapId)?.replace('de_', '') || mapId, img: '', bg: '' };
}

function PlayerSlot({ player, index, isYou, playersProfile }) {
  const isBot = player && (player.isBot === true || (player.steamId && String(player.steamId).startsWith('bot-')));
  const profile = player && !isBot && playersProfile && player.steamId ? playersProfile[player.steamId] : null;
  const level = profile?.level ?? 1;
  const isVip = Boolean(profile?.isVip);
  const levelStyle = getLevelStyle(level);
  return (
    <div className={`pug-slot ${player ? 'filled' : 'empty'} ${isBot ? 'bot' : ''}`}>
      <span className="pug-slot-index">{index + 1}</span>
      {player ? (
        <>
          {!isBot && <Avatar avatarUrl={profile?.avatarUrl} className="pug-slot-avatar" loading="eager" />}
          <span className={`pug-slot-name ${isYou ? 'you' : ''} ${isVip ? 'pug-slot-name--vip' : ''}`}>
            {!isBot && (
              <span className="pug-slot-lvl pug-slot-lvl-circle" style={{ backgroundColor: levelStyle.backgroundColor, color: levelStyle.color }} title={`Level ${level}`}>
                {level}
              </span>
            )}
            {player.displayName || `Jogador ${String(player.steamId).slice(-6)}`}
            {isVip && <span className="pug-slot-vip-badge" title="VIP">VIP</span>}
            {isYou && <span className="pug-slot-you-badge">VOCE</span>}
            {isBot && <span className="pug-slot-bot-badge">BOT</span>}
          </span>
        </>
      ) : (
        <span className="pug-slot-empty">Aguardando...</span>
      )}
    </div>
  );
}

const PlayerSlotMemo = memo(PlayerSlot);

function TeamPanel({ side, players, mySteamId, playersProfile }) {
  const label = side === 'A' ? 'TIME A (CT)' : 'TIME B (TR)';
  const slots = Array.from({ length: SLOTS_PER_TEAM }, (_, i) => players[i] || null);
  return (
    <div className={`pug-team-panel pug-team-${side.toLowerCase()}`}>
      <div className="pug-team-header">
        <span className="pug-team-label">{label}</span>
        <span className="pug-team-count">{players.length}/{SLOTS_PER_TEAM}</span>
      </div>
      <div className="pug-team-slots">
        {slots.map((player, i) => (
          <PlayerSlotMemo
            key={player?.steamId ?? `empty-${i}`}
            player={player}
            index={i}
            isYou={player && mySteamId && player.steamId != null && String(player.steamId) === String(mySteamId)}
            playersProfile={playersProfile}
          />
        ))}
      </div>
    </div>
  );
}

const TeamPanelMemo = memo(TeamPanel);

function LobbyChat({ lobbyId, steamId, playersProfile, isVip }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const listRef = useRef(null);
  const socket = getSocket();
  const profileMap = playersProfile || {};

  const loadMessages = useCallback(() => {
    getLobbyMessages(lobbyId).then(setMessages).catch(() => {});
  }, [lobbyId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!socket) return;
    const onConnect = () => {
      socket.emit('join:lobby', lobbyId);
    };
    if (socket.connected) onConnect();
    socket.on('connect', onConnect);
    return () => {
      socket.off('connect', onConnect);
    };
  }, [socket, lobbyId]);

  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg) => {
      if (msg && String(msg.lobbyId) === String(lobbyId)) setMessages((prev) => [...prev, msg]);
    };
    socket.on('chat:message', onMsg);
    return () => socket.off('chat:message', onMsg);
  }, [lobbyId, socket]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !steamId || sending) return;
    setSending(true);
    try {
      await sendChatMessage(lobbyId, text);
      setInput('');
      loadMessages();
    } catch (_) {}
    setSending(false);
  };

  const handleAskStrategy = async () => {
    if (!steamId || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      await requestAiStrategy(lobbyId, {});
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="pug-chat">
      <div className="pug-chat-title">CHAT</div>
      <div className="pug-chat-list" ref={listRef}>
        {messages.length === 0 && <div className="pug-chat-empty">Nenhuma mensagem.</div>}
        {messages.map((m) => {
          const isVip = Boolean(m.steamId && profileMap[m.steamId]?.isVip);
          return (
          <div key={m.id} className="pug-chat-msg">
            <Avatar avatarUrl={m.avatarUrl} className="pug-chat-msg-avatar" />
            <div className="pug-chat-msg-body">
              <span className={`pug-chat-msg-name ${isVip ? 'pug-chat-msg-name--vip' : ''}`}>
                {m.displayName || 'Jogador'}
                {isVip && <span className="pug-chat-vip-badge" title="VIP">VIP</span>}
              </span>
              <span className="pug-chat-msg-text">{m.body}</span>
              <span className="pug-chat-msg-time">{m.createdAt ? new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>
          </div>
          );
        })}
      </div>
      {aiError && (
        <div className="pug-chat-ai-error">
          <span>{aiError}</span>
        </div>
      )}
      {steamId && (
        <div className="pug-chat-input-row">
          <input
            type="text"
            className="pug-chat-input"
            placeholder="Mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            maxLength={500}
          />
          <TrackedButton type="button" className="pug-btn pug-btn-primary pug-chat-send" onClick={handleSend} disabled={sending || !input.trim()}>
            ENVIAR
          </TrackedButton>
          {isVip && (
            <TrackedButton
              type="button"
              className="pug-btn pug-btn-secondary pug-chat-strat-btn"
              onClick={handleAskStrategy}
              disabled={aiLoading}
            >
              {aiLoading ? '...' : 'PEDIR ESTRATÉGIA'}
            </TrackedButton>
          )}
        </div>
      )}
    </div>
  );
}

const LobbyChatMemo = memo(LobbyChat);

const VETO_TURN_SECONDS = 30;
/** Teste: quando o líder da vez é bot, ban instantâneo (sem esperar 30s). */
const VETO_TURN_SECONDS_BOT = 0;

const VetoMapCard = memo(function VetoMapCard({
  mapId,
  info,
  isBanned,
  animateBanned,
  canBan,
  actionLoading,
  onBan,
  gridIndex = 0,
  highlightBanTurn = false,
  isFinalPick = false,
}) {
  const showEnter = !isBanned;
  const yourTurn = highlightBanTurn && canBan && !isBanned;
  return (
    <TrackedButton
      type="button"
      className={`pug-veto-map-card ${isBanned ? 'pug-veto-map-card--banned' : ''} ${animateBanned ? 'pug-veto-map-card--banned-animate' : ''} ${showEnter ? 'pug-veto-map-card--enter' : ''} ${yourTurn ? 'pug-veto-map-card--your-turn' : ''} ${isFinalPick ? 'pug-veto-map-card--final-pick' : ''}`}
      style={showEnter ? { animationDelay: `${Math.min(gridIndex, 12) * 42}ms` } : undefined}
      onClick={() => onBan(mapId)}
      disabled={!canBan || actionLoading || isBanned}
      title={canBan && !isBanned ? `Banir ${info.name}` : isFinalPick ? `Mapa escolhido: ${info.name}` : ''}
    >
      <div className="pug-veto-map-img-wrap">
        {info.img ? (
          <img
            key={mapId}
            src={info.img}
            alt={info.name}
            onError={(e) => {
              const el = e.target;
              el.style.display = 'none';
              el.parentElement?.classList.add('pug-veto-map-img-failed');
            }}
          />
        ) : null}
        <span className="pug-veto-map-placeholder">{info.name.slice(0, 2)}</span>
      </div>
      {isBanned ? <div className="pug-veto-map-banned-x" aria-hidden>✕</div> : null}
      <span className="pug-veto-map-name">{info.name}</span>
    </TrackedButton>
  );
});

function isBotSteamId(steamId) {
  return String(steamId).startsWith('bot-');
}

function VetoHeader({ lobby }) {
  const leaderA = lobby?.teamA?.[0];
  const leaderB = lobby?.teamB?.[0];
  const nameA = leaderA?.displayName || (leaderA?.steamId && !isBotSteamId(leaderA.steamId) ? 'Jogador' : 'CT');
  const nameB = leaderB?.displayName || (leaderB?.steamId && !isBotSteamId(leaderB.steamId) ? 'Jogador' : 'TR');
  return (
    <div className="pug-veto-header">
      <span className="pug-veto-header-team-name pug-veto-header-team-name--ct">Time de: {nameA}</span>
      <span className="pug-veto-header-vs">VS</span>
      <span className="pug-veto-header-team-name pug-veto-header-team-name--tr">Time de: {nameB}</span>
    </div>
  );
}

function VetoSidePanel({ side, players, playersProfile }) {
  const imgSrc = side === 'ct' ? CT_VETO_IMG : TR_VETO_IMG;
  const alt = side === 'ct' ? 'Counter-Terrorista' : 'Terrorista';
  return (
    <div className={`pug-veto-side pug-veto-side--${side}`}>
      <img src={imgSrc} alt={alt} />
      <div className="pug-veto-side-players">
        {players.map((p, i) => {
          const isBot = p && (p.isBot || String(p.steamId).startsWith('bot-'));
          const profile = !isBot && p?.steamId ? playersProfile?.[p.steamId] : null;
          return (
            <div key={p?.steamId ?? i} className="pug-veto-side-player">
              {!isBot && <Avatar avatarUrl={profile?.avatarUrl} className="pug-veto-side-avatar" loading="eager" />}
              {isBot && <span className="pug-veto-side-bot-icon">BOT</span>}
              <span className="pug-veto-side-player-name">
                {p?.displayName?.slice(0, 14) || (isBot ? 'BOT' : '\u2014')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MapVetoSection({ lobbyId, lobby, authSteamId, onLobbyUpdate, actionLoading, setActionLoading, setError }) {
  const vetoState = lobby?.vetoState || { banned: [], turn: 'ct' };
  const banned = vetoState.banned || [];
  const turn = vetoState.turn || 'ct';
  const ctLeader = lobby?.teamA?.[0]?.steamId ?? lobby?.teamA?.[0];
  const trLeader = lobby?.teamB?.[0]?.steamId ?? lobby?.teamB?.[0];
  const ctLeaderSteamId = typeof ctLeader === 'string' ? ctLeader : ctLeader?.steamId;
  const trLeaderSteamId = typeof trLeader === 'string' ? trLeader : trLeader?.steamId;
  const isCtTurn = turn === 'ct';
  const canBan = isCtTurn ? String(authSteamId) === String(ctLeaderSteamId) : String(authSteamId) === String(trLeaderSteamId);
  const firstCt = lobby?.teamA?.[0];
  const firstTr = lobby?.teamB?.[0];
  const leaderIsBot = isCtTurn ? Boolean(firstCt?.isBot ?? (firstCt?.steamId && isBotSteamId(firstCt.steamId))) : Boolean(firstTr?.isBot ?? (firstTr?.steamId && isBotSteamId(firstTr.steamId)));
  const isInLobby = authSteamId && (
    (lobby?.teamA || []).some((p) => p && (p.steamId != null && String(p.steamId) === String(authSteamId))) ||
    (lobby?.teamB || []).some((p) => p && (p.steamId != null && String(p.steamId) === String(authSteamId)))
  );
  const canRunAutoBanTimer = canBan || (leaderIsBot && isInLobby);
  const mapPool = lobby?.mapPool || ['de_anubis', 'de_ancient', 'de_dust2', 'de_inferno', 'de_mirage', 'de_nuke', 'de_overpass', 'de_cache'];
  const effectiveTurnSeconds = leaderIsBot ? VETO_TURN_SECONDS_BOT : VETO_TURN_SECONDS;

  const [turnSecondsLeft, setTurnSecondsLeft] = useState(() => {
    if (vetoState.turnSecondsRemaining != null) return Math.max(0, Math.ceil(Number(vetoState.turnSecondsRemaining)));
    const ts = vetoState.turnStartedAt != null ? Number(vetoState.turnStartedAt) : null;
    const sec = leaderIsBot ? VETO_TURN_SECONDS_BOT : VETO_TURN_SECONDS;
    return ts != null ? Math.max(0, Math.ceil(sec - (Date.now() - ts) / 1000)) : sec;
  });
  const autoBanTriggeredRef = useRef(false);
  const runAutoBanRef = useRef(null);
  const stateRef = useRef({ canBan, banned, actionLoading });
  stateRef.current = { canBan, banned, actionLoading };

  const handleBan = useCallback(async (mapId) => {
    const { canBan: c, banned: b, actionLoading: loading } = stateRef.current;
    if (!c || b.includes(mapId) || loading || autoBanTriggeredRef.current) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await vetoMap(lobbyId, mapId);
      onLobbyUpdate(updated);
    } catch (e) {
      setError(e?.message || 'Erro ao banir mapa');
    } finally {
      setActionLoading(false);
    }
  }, [lobbyId, onLobbyUpdate]);

  const runAutoBan = useCallback(async () => {
    setActionLoading(true);
    setError(null);
    try {
      const updated = await vetoAuto(lobbyId);
      onLobbyUpdate(updated);
    } catch (e) {
      setError(e?.message || 'Erro no auto-ban');
    } finally {
      setActionLoading(false);
    }
  }, [lobbyId, onLobbyUpdate]);
  runAutoBanRef.current = runAutoBan;

  // Single timer effect per turn: resets on turn/banned change, counts from server timestamp
  // Quando o líder da vez é bot (leaderIsBot), usa VETO_TURN_SECONDS_BOT (0s) = ban instantâneo para teste
  useEffect(() => {
    autoBanTriggeredRef.current = false;
    const remainingMaps = mapPool.length - banned.length;
    if (remainingMaps <= 1 || !canRunAutoBanTimer) return;

    const sec = effectiveTurnSeconds;
    let initial;
    if (leaderIsBot && sec <= 0) {
      initial = 0;
    } else if (vetoState.turnSecondsRemaining != null) {
      initial = Math.max(0, Math.ceil(Number(vetoState.turnSecondsRemaining)));
    } else {
      const ts = vetoState.turnStartedAt != null ? Number(vetoState.turnStartedAt) : null;
      initial = ts != null ? Math.max(0, Math.ceil(sec - (Date.now() - ts) / 1000)) : sec;
    }
    setTurnSecondsLeft(initial);

    if (initial <= 0) {
      autoBanTriggeredRef.current = true;
      runAutoBanRef.current?.();
      return;
    }

    const t = setInterval(() => {
      setTurnSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          if (!autoBanTriggeredRef.current) {
            autoBanTriggeredRef.current = true;
            runAutoBanRef.current?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [turn, banned.length, canRunAutoBanTimer, effectiveTurnSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  const remaining = mapPool.filter((id) => !banned.includes(id));
  const finalPickId = remaining.length === 1 ? remaining[0] : null;
  const highlightBanTurn = canBan && remaining.length > 1;

  // Capture initial banned maps on first render; these skip animation on F5
  const initialBannedRef = useRef(null);
  if (initialBannedRef.current === null) {
    initialBannedRef.current = new Set(banned);
  }

  const timerUrgent = turnSecondsLeft <= 5 && turnSecondsLeft > 0 && remaining.length > 1;

  return (
    <div className="pug-veto-box">
      <div className="pug-veto-title">VETO DE MAPAS</div>
      <p className="pug-veto-turn-msg">
        {canBan && remaining.length > 1 ? (
          <>Sua vez de banir um mapa — <span className={`pug-veto-timer${timerUrgent ? ' pug-veto-timer--urgent' : ''}`}>{turnSecondsLeft}s</span></>
        ) : leaderIsBot && canRunAutoBanTimer && remaining.length > 1 ? (
          <>Tempo do bot — <span className={`pug-veto-timer${timerUrgent ? ' pug-veto-timer--urgent' : ''}`}>{turnSecondsLeft}s</span> (ban automático)</>
        ) : finalPickId ? (
          <>Mapa da partida: <span className="pug-veto-final-map-name">{getMapInfo(finalPickId).name}</span></>
        ) : (
          isCtTurn ? 'Aguardando líder CT banir um mapa' : 'Aguardando líder TR banir um mapa'
        )}
      </p>
      <div className="pug-veto-grid">
        {mapPool.map((mapId, idx) => (
          <VetoMapCard
            key={mapId}
            mapId={mapId}
            info={getMapInfo(mapId)}
            isBanned={banned.includes(mapId)}
            animateBanned={banned.includes(mapId) && !initialBannedRef.current.has(mapId)}
            canBan={canBan}
            actionLoading={actionLoading}
            onBan={handleBan}
            gridIndex={idx}
            highlightBanTurn={highlightBanTurn}
            isFinalPick={finalPickId === mapId}
          />
        ))}
      </div>
    </div>
  );
}

/** Baralho + cemitério estilo TCG: restantes viradas / usadas no half. */
function SnapArenaHalfDeckVisual({ used, max, side }) {
  const remaining = Math.max(0, max - used);
  const deckN = Math.min(remaining, 6);
  const graveN = Math.min(used, 6);
  return (
    <div className={`snaparena-deck-visual snaparena-deck-visual--${side}`} title={`Half MR12: ${used}/${max} cartas usadas · ${remaining} restantes`}>
      <div className="snaparena-deck-visual-col">
        <span className="snaparena-deck-visual-label">Deck</span>
        <div className="snaparena-deck-stack snaparena-deck-stack--deck">
          {Array.from({ length: deckN }).map((_, i) => (
            <div key={`d-${i}`} className="snaparena-deck-card snaparena-deck-card--back" style={{ '--stack-i': i }} />
          ))}
        </div>
        <span className="snaparena-deck-visual-count">{remaining}</span>
      </div>
      <div className="snaparena-deck-visual-col snaparena-deck-visual-col--grave">
        <span className="snaparena-deck-visual-label">Usadas</span>
        <div className="snaparena-deck-stack snaparena-deck-stack--grave">
          {Array.from({ length: graveN }).map((_, i) => (
            <div key={`g-${i}`} className="snaparena-deck-card snaparena-deck-card--grave" style={{ '--stack-i': i }} />
          ))}
        </div>
        <span className="snaparena-deck-visual-count">{used}</span>
      </div>
    </div>
  );
}

function SnapArenaCardsPanel({ lobby, authSteamId, onSelectCard, actionLoading }) {
  const snapState = lobby?.snapArenaCardVetoState;
  const liveRoundReady = typeof lobby?.liveRound === 'number';
  const targetRound = snapState?.targetRound ?? (liveRoundReady ? lobby.liveRound + 1 : null);
  const locked = !!snapState?.locked;
  const ctCommitted = !!snapState?.ctCommitted;
  const trCommitted = !!snapState?.trCommitted;
  const ctSelected = Array.isArray(snapState?.ctSelected) ? snapState.ctSelected : [];
  const trSelected = Array.isArray(snapState?.trSelected) ? snapState.trSelected : [];

  const halfU = lobby?.snapArenaHalfUsage;
  const ctUsedHalf = Math.min(SNAPARENA_MAX_CARDS_PER_HALF, Number(halfU?.ct) || 0);
  const trUsedHalf = Math.min(SNAPARENA_MAX_CARDS_PER_HALF, Number(halfU?.tr) || 0);
  const halfIdx = halfU?.halfIndex ?? 1;

  const leaderA = lobby?.teamA?.[0];
  const leaderB = lobby?.teamB?.[0];
  const ctLeaderSteamId = leaderA?.isBot ? null : (leaderA?.steamId ?? null);
  const trLeaderSteamId = leaderB?.isBot ? null : (leaderB?.steamId ?? null);

  const canPickCt = ctLeaderSteamId != null && String(authSteamId) === String(ctLeaderSteamId);
  const canPickTr = trLeaderSteamId != null && String(authSteamId) === String(trLeaderSteamId);
  const mySide = canPickCt ? 'ct' : canPickTr ? 'tr' : null;

  const remainingCtHalf = Math.max(0, SNAPARENA_MAX_CARDS_PER_HALF - ctUsedHalf);
  const remainingTrHalf = Math.max(0, SNAPARENA_MAX_CARDS_PER_HALF - trUsedHalf);
  const maxCtThisRound = Math.min(SNAPARENA_MAX_CARDS_PER_ROUND, remainingCtHalf);
  const maxTrThisRound = Math.min(SNAPARENA_MAX_CARDS_PER_ROUND, remainingTrHalf);

  const ctLeaderName = leaderA?.displayName || (ctLeaderSteamId ? 'Jogador' : 'Time A');
  const trLeaderName = leaderB?.displayName || (trLeaderSteamId ? 'Jogador' : 'Time B');

  /** API: ct = time A, tr = time B (fixo). Mapa: CT/TR trocam no half — espelhamos colunas. */
  const teamAOnCtFromServer = lobby?.snapArenaTeamAOnCtSide;
  const teamAOnCtFallback = Number(halfIdx) % 2 === 1;
  const teamAPlaysCtOnMap =
    teamAOnCtFromServer === true || teamAOnCtFromServer === false
      ? teamAOnCtFromServer
      : teamAOnCtFallback;
  const apiSideForInGameCt = teamAPlaysCtOnMap ? 'ct' : 'tr';
  const apiSideForInGameTr = teamAPlaysCtOnMap ? 'tr' : 'ct';

  const packCol = (apiSide) => {
    const isCt = apiSide === 'ct';
    return {
      apiSide,
      selected: isCt ? ctSelected : trSelected,
      committed: isCt ? ctCommitted : trCommitted,
      usedHalf: isCt ? ctUsedHalf : trUsedHalf,
      maxThisRound: isCt ? maxCtThisRound : maxTrThisRound,
      remainingHalf: isCt ? remainingCtHalf : remainingTrHalf,
      leaderName: isCt ? ctLeaderName : trLeaderName,
      canPick: isCt ? canPickCt : canPickTr,
    };
  };
  const colInGameCt = packCol(apiSideForInGameCt);
  const colInGameTr = packCol(apiSideForInGameTr);

  /** Rótulo para escolha no centro: mesmo time A/B da API, lado no mapa após swap. */
  const sideLabel = (api) => {
    const isTeamA = api === 'ct';
    const ingame = isTeamA === teamAPlaysCtOnMap ? 'CT no mapa' : 'TR no mapa';
    const team = isTeamA ? 'Time A' : 'Time B';
    return `${ingame} (${team})`;
  };

  const inGameShortLabelForApiPick = (api) => (api === 'ct') === teamAPlaysCtOnMap ? 'CT' : 'TR';

  const myCommitted = mySide === 'ct' ? ctCommitted : mySide === 'tr' ? trCommitted : true;
  const mySelected = mySide === 'ct' ? ctSelected : mySide === 'tr' ? trSelected : [];
  const myMaxThisRound = mySide === 'ct' ? maxCtThisRound : mySide === 'tr' ? maxTrThisRound : 0;
  const myRemainingHalf = mySide === 'ct' ? remainingCtHalf : mySide === 'tr' ? remainingTrHalf : 0;

  const handleCardClick = async (cardId) => {
    if (!liveRoundReady || !mySide || locked || actionLoading || myCommitted || myRemainingHalf <= 0) return;
    await onSelectCard({ cardId });
  };

  const handleConfirm = async () => {
    if (!liveRoundReady || !mySide || locked || actionLoading || myCommitted || mySelected.length < 1) return;
    await onSelectCard({ confirm: true });
  };

  const activeForRound = lobby?.snapArenaActiveForRound;
  const showActiveBanner = liveRoundReady && activeForRound && Number(activeForRound.round) === Number(lobby.liveRound);

  const ctIdsLive = Array.isArray(activeForRound?.ctCardIds) && activeForRound.ctCardIds.length
    ? activeForRound.ctCardIds
    : (activeForRound?.ctCardId ? [activeForRound.ctCardId] : []);
  const trIdsLive = Array.isArray(activeForRound?.trCardIds) && activeForRound.trCardIds.length
    ? activeForRound.trCardIds
    : (activeForRound?.trCardId ? [activeForRound.trCardId] : []);

  const formatCardLine = (ids) =>
    ids.length ? ids.map((id) => SNAPARENA_CARD_BY_ID[id]?.name || id).join(' · ') : '—';

  const ctMapCardIds = teamAPlaysCtOnMap ? ctIdsLive : trIdsLive;
  const trMapCardIds = teamAPlaysCtOnMap ? trIdsLive : ctIdsLive;

  const renderPickColumn = (col, visualSide) => {
    const pillClass =
      visualSide === 'ct' ? 'snaparena-side-pill snaparena-side-pill--ct' : 'snaparena-side-pill snaparena-side-pill--tr';
    const sideWrapClass =
      visualSide === 'ct' ? 'snaparena-cards-side snaparena-cards-side--ct' : 'snaparena-cards-side snaparena-cards-side--tr';
    const mapLabel = visualSide === 'ct' ? 'CT no mapa' : 'TR no mapa';
    const teamHint = col.apiSide === 'ct' ? 'Time A' : 'Time B';
    const confirmExtra = visualSide === 'tr' ? ' snaparena-cards-confirm-btn--tr' : '';

    return (
      <div key={`col-${visualSide}`} className={sideWrapClass}>
        <div className="snaparena-cards-side-title">
          <span className={pillClass}>{mapLabel}</span>
          <span>
            {col.leaderName}
            <span className="snaparena-cards-team-tag"> ({teamHint})</span>
          </span>
        </div>
        <SnapArenaHalfDeckVisual used={col.usedHalf} max={SNAPARENA_MAX_CARDS_PER_HALF} side={visualSide} />
        <div className="snaparena-cards-side-meta">
          <span>
            Escolha: {col.selected.length}/{col.maxThisRound}
          </span>
          <span>
            Half: {col.usedHalf}/{SNAPARENA_MAX_CARDS_PER_HALF}
          </span>
          <span>{col.committed ? 'Confirmada' : 'Pendente'}</span>
        </div>
        <div className="snaparena-cards-selected-list">
          {col.selected.length === 0 && (
            <div className="snaparena-cards-selected-empty">
              {col.remainingHalf <= 0 ? 'Sem cartas neste half.' : 'Toque nas cartas no centro (até 3) e confirme.'}
            </div>
          )}
          {col.selected.map((id) => {
            const c = SNAPARENA_CARD_BY_ID[id];
            return (
              <div key={id} className="snaparena-cards-selected-pill">
                <span className="snaparena-cards-selected-emoji">{c?.emoji || '🃏'}</span>
                <span className="snaparena-cards-selected-name">{c?.name || id}</span>
              </div>
            );
          })}
        </div>
        {col.canPick && !col.committed && !locked && liveRoundReady && col.remainingHalf > 0 && (
          <TrackedButton
            type="button"
            className={`snaparena-cards-confirm-btn${confirmExtra}`}
            disabled={actionLoading || col.selected.length < 1}
            onClick={handleConfirm}
          >
            CONFIRMAR {col.selected.length > 0 ? `(${col.selected.length})` : ''}
          </TrackedButton>
        )}
      </div>
    );
  };

  return (
    <div className="snaparena-cards-panel" aria-hidden="false">
      <div className="snaparena-cards-panel-inner">
        <div className="snaparena-cards-header">
          <span className="snaparena-cards-title">CARTAS DO PRÓXIMO ROUND</span>
          <span className="snaparena-cards-sub">
            {liveRoundReady
              ? `Ao vivo: round ${lobby.liveRound} (half ${halfIdx}) · alvo round ${targetRound ?? lobby.liveRound + 1}`
              : (targetRound != null ? `Round alvo ${targetRound}` : 'Sincronizando round com o servidor…')}
            {locked ? ' · CT e TR confirmaram' : ''}
            {' · Até 3 cartas por commit · 3 por time por half (reseta no 13º round)'}
          </span>
        </div>
        {showActiveBanner && (
          <div className="snaparena-cards-active-round" role="status">
            <div className="snaparena-cards-active-round-title">Cartas neste round</div>
            <div className="snaparena-cards-active-round-row">
              <span className="snaparena-side-pill snaparena-side-pill--ct">CT no mapa</span>
              <span className="snaparena-cards-active-name">{formatCardLine(ctMapCardIds)}</span>
            </div>
            <div className="snaparena-cards-active-round-row">
              <span className="snaparena-side-pill snaparena-side-pill--tr">TR no mapa</span>
              <span className="snaparena-cards-active-name">{formatCardLine(trMapCardIds)}</span>
            </div>
          </div>
        )}
        {!liveRoundReady && (
          <div className="snaparena-cards-wait-round" role="status">
            Aguardando o número do round ao vivo (plugin/site). O painel já aparece; a escolha libera quando o round sincronizar.
          </div>
        )}

        <div className="snaparena-cards-panel-content">
          {renderPickColumn(colInGameCt, 'ct')}

          <div className="snaparena-cards-center">
            {SNAPARENA_CARD_CATEGORIES.map((cat) => {
              const cards = SNAPARENA_CARDS.filter((c) => c.category === cat.key);
              return (
                <div key={cat.key} className="snaparena-cards-category">
                  <div className="snaparena-cards-category-title">{cat.label}</div>
                  <div className="snaparena-cards-grid">
                    {cards.map((card) => {
                      const isSelectedCt = ctSelected.includes(card.id);
                      const isSelectedTr = trSelected.includes(card.id);
                      const mappedOk = !!card.pluginCard;
                      const canSelectThis =
                        liveRoundReady &&
                        mySide != null &&
                        !locked &&
                        !myCommitted &&
                        myRemainingHalf > 0 &&
                        (mySelected.includes(card.id) || mySelected.length < myMaxThisRound);

                      return (
                        <TrackedButton
                          key={card.id}
                          type="button"
                          className={[
                            'snaparena-card-btn',
                            isSelectedCt ? 'snaparena-card-btn--selected-ct' : '',
                            isSelectedTr ? 'snaparena-card-btn--selected-tr' : '',
                            mappedOk ? '' : 'snaparena-card-btn--dev',
                          ].filter(Boolean).join(' ')}
                          disabled={!canSelectThis || actionLoading}
                          onClick={() => handleCardClick(card.id)}
                          title={
                            mappedOk
                              ? `Escolher para ${sideLabel(mySide)}`
                              : 'Sem efeito no engine ainda (só visual / fila futura)'
                          }
                        >
                          <span className="snaparena-card-emoji">{card.emoji || '🃏'}</span>
                          <span className="snaparena-card-name">{card.name}</span>
                          {mappedOk && <span className="snaparena-card-badge">OK</span>}
                          {!mappedOk && <span className="snaparena-card-badge snaparena-card-badge--dev">DEV</span>}
                          {(isSelectedCt || isSelectedTr) && (
                            <span className="snaparena-card-picked-indicator">
                              {isSelectedCt ? inGameShortLabelForApiPick('ct') : ''}
                              {isSelectedCt && isSelectedTr ? '+' : ''}
                              {isSelectedTr ? inGameShortLabelForApiPick('tr') : ''}
                            </span>
                          )}
                        </TrackedButton>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {renderPickColumn(colInGameTr, 'tr')}
        </div>

        {(!canPickCt && !canPickTr) && (
          <div className="snaparena-cards-hint">
            Apenas o líder (1º slot) de cada time na lobby (Time A / Time B) pode selecionar; o painel mostra CT/TR conforme o lado no mapa após o swap.
          </div>
        )}
      </div>
    </div>
  );
}

function SnapArenaBackendControl({ lobby, isOwner, actionLoading, setActionLoading, setError, onLobbyUpdate }) {
  const [matchId, setMatchId] = useState('');
  const [ok, setOk] = useState('');
  const [pollOut, setPollOut] = useState(null);
  const [duelId, setDuelId] = useState('');
  const [ctSteamId, setCtSteamId] = useState('');
  const [trSteamId, setTrSteamId] = useState('');
  const [roundDurationSeconds, setRoundDurationSeconds] = useState('');
  const [startMoney, setStartMoney] = useState('');
  const [card, setCard] = useState('DOUBLE_DAMAGE');
  const [side, setSide] = useState('ct');
  const [count, setCount] = useState(1);

  useEffect(() => {
    const fallbackMatch = String(lobby?.matchId || lobby?.id || '');
    if (fallbackMatch && !matchId) setMatchId(fallbackMatch);
    const ct = lobby?.teamA?.[0]?.steamId;
    const tr = lobby?.teamB?.[0]?.steamId;
    if (ct && !ctSteamId) setCtSteamId(String(ct));
    if (tr && !trSteamId) setTrSteamId(String(tr));
    if (!duelId && fallbackMatch) setDuelId(`duel-${fallbackMatch}-${Date.now()}`);
  }, [lobby, matchId, ctSteamId, trSteamId, duelId]);

  const enqueue = async (type, payload = {}) => {
    const mid = String(matchId || '').trim();
    if (!mid) {
      setError('Informe o Match ID da sala SnapArena.');
      return;
    }
    setActionLoading(true);
    setError(null);
    setOk('');
    try {
      await enqueueAllstarsCommand(mid, type, payload);
      setOk(`Comando ${type} enfileirado.`);
      onLobbyUpdate?.(lobby);
    } catch (e) {
      setError(e?.message || `Erro ao enfileirar ${type}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePoll = async () => {
    const mid = String(matchId || '').trim();
    if (!mid) {
      setError('Informe o Match ID da sala SnapArena.');
      return;
    }
    setActionLoading(true);
    setError(null);
    setOk('');
    try {
      const res = await pollAllstarsCommands(mid, '0', 20);
      setPollOut(res);
      setOk(`Poll OK: ${res?.commands?.length || 0} comando(s).`);
    } catch (e) {
      setError(e?.message || 'Erro ao consultar fila');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="snaparena-backend-panel">
      <div className="snaparena-backend-panel-head">
        <div>
          <div className="snaparena-backend-panel-title">Controle Engine SnapArena</div>
          <div className="snaparena-backend-panel-sub">Comandos da fila do HandleBackendCommand, direto nesta sala.</div>
        </div>
        <span className="snaparena-backend-panel-badge">{isOwner ? 'HOST' : 'VIEW'}</span>
      </div>

      <div className="snaparena-backend-row">
        <input
          className="snaparena-backend-input"
          value={matchId}
          onChange={(e) => setMatchId(e.target.value)}
          placeholder="Match ID"
          disabled={actionLoading || !isOwner}
        />
        <TrackedButton className="snaparena-backend-btn snaparena-backend-btn--ghost" type="button" disabled={actionLoading || !isOwner} onClick={handlePoll}>
          {actionLoading ? '...' : 'Ver fila'}
        </TrackedButton>
      </div>

      <div className="snaparena-backend-grid">
        <TrackedButton className="snaparena-backend-btn" type="button" disabled={actionLoading || !isOwner} onClick={() => enqueue('start_match', {})}>start_match</TrackedButton>
        <TrackedButton className="snaparena-backend-btn" type="button" disabled={actionLoading || !isOwner} onClick={() => enqueue('match_end', {})}>match_end</TrackedButton>

        <div className="snaparena-backend-card">
          <div className="snaparena-backend-card-title">start_duel</div>
          <input className="snaparena-backend-input" value={duelId} onChange={(e) => setDuelId(e.target.value)} placeholder="duelId" disabled={actionLoading || !isOwner} />
          <input className="snaparena-backend-input" value={ctSteamId} onChange={(e) => setCtSteamId(e.target.value)} placeholder="ctSteamId" disabled={actionLoading || !isOwner} />
          <input className="snaparena-backend-input" value={trSteamId} onChange={(e) => setTrSteamId(e.target.value)} placeholder="trSteamId" disabled={actionLoading || !isOwner} />
          <TrackedButton className="snaparena-backend-btn" type="button" disabled={actionLoading || !isOwner} onClick={() => enqueue('start_duel', { duelId, ctSteamId: String(ctSteamId).trim(), trSteamId: String(trSteamId).trim() })}>
            Enfileirar
          </TrackedButton>
        </div>

        <div className="snaparena-backend-card">
          <div className="snaparena-backend-card-title">round_start</div>
          <input className="snaparena-backend-input" type="number" value={roundDurationSeconds} onChange={(e) => setRoundDurationSeconds(e.target.value)} placeholder="roundDurationSeconds (opcional)" disabled={actionLoading || !isOwner} />
          <input className="snaparena-backend-input" type="number" value={startMoney} onChange={(e) => setStartMoney(e.target.value)} placeholder="startMoney (opcional)" disabled={actionLoading || !isOwner} />
          <TrackedButton
            className="snaparena-backend-btn"
            type="button"
            disabled={actionLoading || !isOwner}
            onClick={() => enqueue('round_start', {
              ...(roundDurationSeconds ? { roundDurationSeconds: Number(roundDurationSeconds) } : {}),
              ...(startMoney ? { startMoney: Number(startMoney) } : {}),
            })}
          >
            Enfileirar
          </TrackedButton>
        </div>

        <div className="snaparena-backend-card">
          <div className="snaparena-backend-card-title">play_card</div>
          <select className="snaparena-backend-input" value={card} onChange={(e) => setCard(e.target.value)} disabled={actionLoading || !isOwner}>
            {ALLSTARS_DUEL_CARD_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="snaparena-backend-row">
            <select className="snaparena-backend-input" value={side} onChange={(e) => setSide(e.target.value)} disabled={actionLoading || !isOwner}>
              <option value="ct">ct</option>
              <option value="tr">tr</option>
            </select>
            <input className="snaparena-backend-input" type="number" min="1" max="3" value={count} onChange={(e) => setCount(e.target.value)} disabled={actionLoading || !isOwner} />
          </div>
          <TrackedButton className="snaparena-backend-btn snaparena-backend-btn--accent" type="button" disabled={actionLoading || !isOwner} onClick={() => enqueue('play_card', { card, side, count: Math.max(1, Math.min(3, Number(count) || 1)) })}>
            Enfileirar
          </TrackedButton>
        </div>
      </div>

      {ok && <div className="snaparena-backend-ok">{ok}</div>}
      {!!pollOut && <pre className="snaparena-backend-pre">{JSON.stringify(pollOut, null, 2)}</pre>}
    </div>
  );
}

export default function PugLobbyPage() {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const profile = useProfile();
  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectInfo, setConnectInfo] = useState(null);
  const [serverInfoIp, setServerInfoIp] = useState(null);
  const [serverReady, setServerReady] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [mapCountdown, setMapCountdown] = useState(-1);
  const [startingMatch, setStartingMatch] = useState(false);
  const [matchElapsed, setMatchElapsed] = useState('');
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [showSnapHackOnboarding, setShowSnapHackOnboarding] = useState(false);
  const [showSnaphackConfigModal, setShowSnaphackConfigModal] = useState(false);
  const [snaphackConfigDraft, setSnaphackConfigDraft] = useState(SNAPHACK_DEFAULT_CONFIG);
  const [snaphackPulseKey, setSnaphackPulseKey] = useState(null);
  const snaphackPulseTimeoutRef = useRef(null);
  // Evita que o socket sobrescreva o rascunho enquanto o usuário está clicando no drawer.
  const snaphackDraftDirtyRef = useRef(false);
  const mapCountdownStarted = useRef(false);
  const inviteJoinAttemptedRef = useRef(false);

  const isSnapHackLobby = lobby?.lobbyType === 'snaphack';
  const isSnapArenaLobby = lobby?.lobbyType === 'snaparena';
  const isArenaLobby = isSnapHackLobby || isSnapArenaLobby;

  useEffect(() => {
    if (!isSnapHackLobby) return;
    if (!lobby?.id) return;

    // Se o drawer está aberto e o usuário já fez mudanças, não sobrescrever.
    if (showSnaphackConfigModal && snaphackDraftDirtyRef.current) return;

    const cfg = lobby?.snaphackConfig;
    if (!cfg || typeof cfg !== 'object') {
      setSnaphackConfigDraft(SNAPHACK_DEFAULT_CONFIG);
      return;
    }
    const enabled = typeof cfg.enabled === 'boolean' ? cfg.enabled : true;
    const enabledHacks = Array.isArray(cfg.enabledHacks) ? cfg.enabledHacks : SNAPHACK_DEFAULT_CONFIG.enabledHacks;
    const enabledRounds = Array.isArray(cfg.enabledRounds) ? cfg.enabledRounds : SNAPHACK_DEFAULT_CONFIG.enabledRounds;

    const allowedHacks = new Set(SNAPHACK_PLAYER_HACKS.map((h) => h.key));
    const allowedRounds = new Set(SNAPHACK_ROUND_MODIFIERS.map((r) => r.key));

    setSnaphackConfigDraft({
      enabled,
      enabledHacks: enabledHacks.filter((k) => allowedHacks.has(k)),
      enabledRounds: enabledRounds.filter((k) => allowedRounds.has(k)),
    });
  }, [isSnapHackLobby, lobby?.id, lobby?.snaphackConfig, showSnaphackConfigModal]);

  useEffect(() => {
    if (!lobby || !isArenaLobby || loading) return;
    // Requirement: show modal whenever creating a lobby (i.e., per-lobby id).
    const isHost =
      !!(lobby?.ownerSteamId != null && auth?.steamId != null && String(lobby.ownerSteamId) === String(auth.steamId));
    if (!isHost) return;
    const storageKeyPrefix = isSnapArenaLobby ? SNAPARENA_ONBOARDING_STORAGE_KEY : SNAPHACK_ONBOARDING_STORAGE_KEY;
    const key = `${storageKeyPrefix}_${lobby.id}`;
    try {
      if (!localStorage.getItem(key)) setShowSnapHackOnboarding(true);
    } catch {
      setShowSnapHackOnboarding(true);
    }
  }, [lobby?.lobbyType, lobby?.id, loading, auth?.steamId]);

  const dismissSnapHackOnboarding = useCallback(() => {
    try {
      const lobbyId = lobby?.id;
      const isArena = lobby?.lobbyType === 'snaphack' || lobby?.lobbyType === 'snaparena';
      const storageKeyPrefix = lobby?.lobbyType === 'snaparena' ? SNAPARENA_ONBOARDING_STORAGE_KEY : SNAPHACK_ONBOARDING_STORAGE_KEY;
      if (isArena) {
        if (lobbyId) localStorage.setItem(`${storageKeyPrefix}_${lobbyId}`, '1');
        else localStorage.setItem(storageKeyPrefix, '1');
      }
    } catch { /* ignore */ }
    setShowSnapHackOnboarding(false);
  }, [lobby?.id, lobby?.lobbyType]);

  useEffect(() => {
    if (!showSnapHackOnboarding) return;
    const onKey = (e) => {
      if (e.key === 'Escape') dismissSnapHackOnboarding();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSnapHackOnboarding, dismissSnapHackOnboarding]);

  const fetchLobby = useCallback(async () => {
    try {
      const data = await getLobby(lobbyId);
      setLobby(data);
      if (!initialLoadDone) setInitialLoadDone(true);
      setError(null);
    } catch {
      setLobby(null);
      setError('Lobby não encontrado ou foi removido.');
    } finally {
      setLoading(false);
    }
  }, [lobbyId, initialLoadDone]);

  const mergeLobbyUpdate = useCallback((prev, next) => {
    if (!next) return next;
    if (!prev) return next;
    const sameTeam = (a, b) => {
      if (!a || !b || a.length !== b.length) return false;
      return a.every((p, i) => String(p?.steamId ?? p) === String(b[i]?.steamId ?? b[i]));
    };
    const sameProfiles = (a, b) => {
      if (!a || !b) return a === b;
      const ka = Object.keys(a), kb = Object.keys(b);
      if (ka.length !== kb.length) return false;
      return ka.every(k => b[k] && a[k].avatarUrl === b[k].avatarUrl && a[k].isVip === b[k].isVip && a[k].level === b[k].level);
    };
    // Preservar playersProfile quando o payload (ex.: socket lobby:updated) não traz — evita avatar sumir no veto.
    const mergedProfile = (next.playersProfile != null)
      ? (sameProfiles(prev.playersProfile, next.playersProfile) ? prev.playersProfile : next.playersProfile)
      : (prev.playersProfile || next.playersProfile);
    return {
      ...next,
      teamA: sameTeam(prev.teamA, next.teamA) ? prev.teamA : next.teamA,
      teamB: sameTeam(prev.teamB, next.teamB) ? prev.teamB : next.teamB,
      playersProfile: mergedProfile,
      snapArenaCardVetoState: next.snapArenaCardVetoState ?? prev.snapArenaCardVetoState,
      snapArenaActiveForRound: next.snapArenaActiveForRound ?? prev.snapArenaActiveForRound,
      // IMPORTANTE: socket/lobby:updated nem sempre traz snaphackConfig.
      // Preserva o valor anterior para não resetar o drawer para o default.
      snaphackConfig: next.snaphackConfig ?? prev.snaphackConfig,
      // Garantir liveScore/liveRound/liveStartedAt do servidor quando vierem no payload (atualização ao vivo).
      liveScore: next.liveScore ?? prev.liveScore,
      liveRound: next.liveRound ?? prev.liveRound,
      liveStartedAt: next.liveStartedAt ?? prev.liveStartedAt,
    };
  }, []);

  const handleLobbyUpdate = useCallback((updated) => {
    setLobby((prev) => mergeLobbyUpdate(prev, updated));
  }, [mergeLobbyUpdate]);

  useEffect(() => {
    fetchLobby();
    const s = connectSocket();
    joinLobbyRoom(lobbyId);
    s.on('lobby:updated', (data) => {
      if (data.id === lobbyId) {
        setLobby((prev) => {
          if (data.status === 'finished' && prev?.status !== 'finished') {
            setTimeout(() => window.dispatchEvent(new Event('pug:match-finished')), 1500);
          }
          return mergeLobbyUpdate(prev, data);
        });
      }
    });
    s.on('progress:available', () => {
      setTimeout(() => window.dispatchEvent(new Event('pug:match-finished')), 500);
    });
    const fallback = setInterval(fetchLobby, 5000);
    return () => {
      s.off('lobby:updated');
      s.off('progress:available');
      leaveLobbyRoom(lobbyId);
      clearInterval(fallback);
      disconnectSocket();
    };
  }, [lobbyId, fetchLobby, mergeLobbyUpdate]);

  useEffect(() => {
    getConnectInfo().then(setConnectInfo).catch(() => setConnectInfo(null));
  }, []);

  useEffect(() => {
    if (lobby?.status !== 'full' || connectInfo?.host) return;
    fetch(`${getApiBaseUrl()}/api/server-info`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.ip && setServerInfoIp(d.ip))
      .catch(() => {});
  }, [lobby?.status, connectInfo?.host]);

  // Sincroniza só o segundo countdown (prep) com o servidor a cada 2s. Não sobrescreve o primeiro (evita “pular de 2 em 2”).
  useEffect(() => {
    if (lobby?.status !== 'full' && lobby?.status !== 'live' && !lobby?.liveScore) return;
    const sync = async () => {
      try {
        const data = await getLobby(lobbyId);
        if (!data) return;
        if (data.status === 'full' && typeof data.prepRemainingSeconds === 'number' && !serverReady)
          setCountdown((c) => (typeof data.prepRemainingSeconds === 'number' ? Math.max(0, data.prepRemainingSeconds) : c));
        setLobby((prev) => mergeLobbyUpdate(prev, data));
      } catch (_) { /* ignore */ }
    };
    sync();
    const t = setInterval(sync, 2000);
    return () => clearInterval(t);
  }, [lobbyId, lobby?.status, lobby?.liveScore, serverReady, mergeLobbyUpdate]);

  // Segundo countdown (Preparando servidor): usa valor do servidor (evita diferença de relógio no Oracle)
  useEffect(() => {
    if (lobby?.status === 'live' || lobby?.liveScore || lobby?.liveStartedAt) {
      setServerReady(true);
      return;
    }
    if (lobby?.status !== 'full') {
      setServerReady(false);
      setCountdown(0);
      return;
    }
    if (serverReady) return;
    const prepRemaining = typeof lobby.prepRemainingSeconds === 'number'
      ? Math.max(0, lobby.prepRemainingSeconds)
      : (lobby.fullAt != null ? Math.max(0, Math.ceil(SERVER_PREP_SECONDS - (Date.now() - Number(lobby.fullAt)) / 1000)) : SERVER_PREP_SECONDS);
    setCountdown(prepRemaining);
    if (prepRemaining <= 0) {
      setServerReady(true);
      return;
    }
    const t = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          setServerReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [lobby?.status, lobby?.fullAt, lobby?.prepRemainingSeconds, serverReady]);

  // Primeiro countdown (Partida iniciando): ref-based para não reiniciar com updates do lobby
  const countdownMapRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const firingRef = useRef(false);
  useEffect(() => {
    if (lobby?.status !== 'countdown' || !lobby?.selectedMap) {
      mapCountdownStarted.current = false;
      firingRef.current = false;
      setMapCountdown(-1);
      setStartingMatch(false);
      if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
      return;
    }
    if (mapCountdownStarted.current) return;
    mapCountdownStarted.current = true;
    countdownMapRef.current = lobby.selectedMap;
    const remaining = typeof lobby.countdownRemainingSeconds === 'number'
      ? Math.max(0, lobby.countdownRemainingSeconds)
      : (lobby.countdownStartedAt != null
          ? Math.max(0, Math.ceil(MAP_VETO_COUNTDOWN_SECONDS - (Date.now() - Number(lobby.countdownStartedAt)) / 1000))
          : MAP_VETO_COUNTDOWN_SECONDS);
    setMapCountdown(remaining);

    const fireStart = () => {
      if (firingRef.current) return;
      firingRef.current = true;
      if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
      const mapToStart = countdownMapRef.current || lobby?.selectedMap;
      if (mapToStart) {
        setStartingMatch(true);
        startMatchAfterCountdown(lobbyId, mapToStart)
          .then(() => { fetchLobby(); })
          .catch((e) => { setError(e?.message || 'Erro ao iniciar servidor'); setMapCountdown(-1); })
          .finally(() => { setStartingMatch(false); firingRef.current = false; mapCountdownStarted.current = false; });
      }
    };

    if (remaining <= 0) { fireStart(); return; }
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setMapCountdown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setTimeout(fireStart, 0);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => { if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobby?.status, lobby?.selectedMap, lobbyId]);

  useEffect(() => {
    const ts = lobby?.liveStartedAt;
    if (!ts) { setMatchElapsed(''); return; }
    const fmt = () => {
      const sec = Math.max(0, Math.floor((Date.now() - Number(ts)) / 1000));
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };
    setMatchElapsed(fmt());
    const t = setInterval(() => setMatchElapsed(fmt()), 1000);
    return () => clearInterval(t);
  }, [lobby?.liveStartedAt]);

  const handleLeave = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await leaveLobby(lobbyId);
      navigate(lobbyListPathForType(lobby?.lobbyType));
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const data = await resetLobby(lobbyId);
      setLobby(data.lobby || data);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddBots = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const data = await addBots(lobbyId);
      setLobby(data);
      if (data && ((data.teamA?.length || 0) + (data.teamB?.length || 0)) >= MAX_LOBBY_PLAYERS) {
        fetchLobby();
      }
    } catch (e) {
      setError(e?.message || 'Erro ao adicionar bots');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBeginVeto = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const data = await beginVeto(lobbyId);
      setLobby(data);
    } catch (e) {
      setError(e?.message || 'Erro ao iniciar veto');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectSnapArenaCard = async (payload) => {
    setActionLoading(true);
    setError(null);
    try {
      const body = typeof payload === 'string' ? { cardId: payload } : payload;
      const data = await selectSnapArenaCard(lobbyId, body);
      setLobby((prev) => mergeLobbyUpdate(prev, data));
    } catch (e) {
      setError(e?.message || 'Erro ao selecionar carta');
    } finally {
      setActionLoading(false);
    }
  };

  const inLobby = lobby && auth.steamId &&
    [...(lobby.teamA || []), ...(lobby.teamB || [])].some((p) => p && p.steamId != null && String(p.steamId) === String(auth.steamId));
  const mySide = useMemo(() => {
    if (!lobby || !auth?.steamId) return null;
    const inA = (lobby.teamA || []).some((p) => p && p.steamId != null && String(p.steamId) === String(auth.steamId));
    if (inA) return 'A';
    const inB = (lobby.teamB || []).some((p) => p && p.steamId != null && String(p.steamId) === String(auth.steamId));
    if (inB) return 'B';
    return null;
  }, [lobby, auth?.steamId]);
  const isOwner = lobby && auth.steamId && lobby.ownerSteamId === auth.steamId;
  const isFull = lobby?.status === 'full';
  const total = lobby ? (lobby.teamA?.length || 0) + (lobby.teamB?.length || 0) : 0;
  const maxTotal = lobby?.maxTotal ?? MAX_LOBBY_PLAYERS;

  const connectHost = lobby?.connectHost || connectInfo?.host || serverInfoIp || '';
  const connectPort = lobby?.connectPort || connectInfo?.port || '27017';
  const connectStr = lobby?.connect
    || (lobby?.password && connectHost ? `connect ${connectHost}:${connectPort}; password ${lobby.password}` : null);

  const handleCopyConnect = () => {
    if (connectStr) navigator.clipboard.writeText(connectStr);
  };

  const handleCopyInvite = useCallback(() => {
    if (!lobby?.id || !mySide) return;
    const origin = window.location.origin;
    const params = new URLSearchParams();
    params.set('invite', '1');
    params.set('side', mySide);
    if (lobby?.hasPassword && lobby?.lobbyPassword) params.set('lp', String(lobby.lobbyPassword));
    const url = `${origin}/pug/${lobby.id}?${params.toString()}`;
    navigator.clipboard.writeText(url);
  }, [lobby?.id, lobby?.hasPassword, lobby?.lobbyPassword, mySide]);

  useEffect(() => {
    if (!lobby || !auth?.steamId) return;
    if (inviteJoinAttemptedRef.current) return;
    if (inLobby) return;
    if (lobby.status !== 'waiting') return;

    const qs = new URLSearchParams(location.search || '');
    const isInvite = qs.get('invite') === '1';
    if (!isInvite) return;

    const sideRaw = (qs.get('side') || '').trim().toUpperCase();
    const preferredSide = sideRaw === 'A' || sideRaw === 'B' ? sideRaw : null;
    const lobbyPassword = (qs.get('lp') || '').trim() || null;

    inviteJoinAttemptedRef.current = true;
    joinLobby(lobbyId, null, lobbyPassword, { preferredSide })
      .then((data) => setLobby((prev) => mergeLobbyUpdate(prev, data)))
      .catch((e) => setError(e?.message || 'Erro ao entrar no lobby via convite'));
  }, [lobby, inLobby, auth?.steamId, location.search, lobbyId, mergeLobbyUpdate]);

  const handleMatchzyAdminToggle = async () => {
    if (!lobbyId || !isOwner) return;
    const next = !lobby?.matchzyOwnerAdmin;
    setActionLoading(true);
    setError(null);
    try {
      const data = await updateLobbySettings(lobbyId, { matchzyOwnerAdmin: next });
      setLobby((prev) => (prev ? { ...prev, ...data } : data));
    } catch (e) {
      setError(e?.message || 'Erro ao atualizar.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenSnaphackConfig = () => {
    if (!isSnapHackLobby || !isOwner) return;
    const cfg = lobby?.snaphackConfig;
    if (cfg && typeof cfg === 'object') {
      const enabled = typeof cfg.enabled === 'boolean' ? cfg.enabled : SNAPHACK_DEFAULT_CONFIG.enabled;
      const enabledHacks = Array.isArray(cfg.enabledHacks) ? cfg.enabledHacks : SNAPHACK_DEFAULT_CONFIG.enabledHacks;
      const enabledRounds = Array.isArray(cfg.enabledRounds) ? cfg.enabledRounds : SNAPHACK_DEFAULT_CONFIG.enabledRounds;
      const allowedHacks = new Set(SNAPHACK_PLAYER_HACKS.map((h) => h.key));
      const allowedRounds = new Set(SNAPHACK_ROUND_MODIFIERS.map((r) => r.key));
      setSnaphackConfigDraft({
        enabled,
        enabledHacks: enabledHacks.filter((k) => allowedHacks.has(k)),
        enabledRounds: enabledRounds.filter((k) => allowedRounds.has(k)),
      });
    } else {
      setSnaphackConfigDraft(SNAPHACK_DEFAULT_CONFIG);
    }
    snaphackDraftDirtyRef.current = false;
    setShowSnaphackConfigModal(true);
  };

  const isArraySetEqual = (a, b) => {
    const sa = new Set(Array.isArray(a) ? a : []);
    const sb = new Set(Array.isArray(b) ? b : []);
    if (sa.size !== sb.size) return false;
    for (const x of sa) if (!sb.has(x)) return false;
    return true;
  };

  const isSnaphackConfigDirty = () => {
    const saved = lobby?.snaphackConfig;
    const normalizedSaved = saved && typeof saved === 'object' ? saved : SNAPHACK_DEFAULT_CONFIG;
    const draft = snaphackConfigDraft ?? SNAPHACK_DEFAULT_CONFIG;
    return !(
      normalizedSaved.enabled === !!draft.enabled &&
      isArraySetEqual(normalizedSaved.enabledHacks, draft.enabledHacks) &&
      isArraySetEqual(normalizedSaved.enabledRounds, draft.enabledRounds)
    );
  };

  const handleCloseSnaphackConfig = async () => {
    if (!isSnapHackLobby || !isOwner) {
      setShowSnaphackConfigModal(false);
      return;
    }
    // Always persist when closing (avoid “saved but not reflected” issues).
    await handleSaveSnaphackConfig();
  };

  const handleToggleSnaphackEnabled = () => {
    snaphackDraftDirtyRef.current = true;
    setSnaphackConfigDraft((prev) => ({
      ...prev,
      enabled: !prev?.enabled,
    }));
  };

  const handleToggleSnaphackHack = (hackKey) => {
    snaphackDraftDirtyRef.current = true;
    setSnaphackConfigDraft((prev) => {
      const set = new Set(prev?.enabledHacks || []);
      if (set.has(hackKey)) set.delete(hackKey);
      else set.add(hackKey);
      return { ...prev, enabledHacks: Array.from(set) };
    });
    setSnaphackPulseKey(hackKey);
    if (snaphackPulseTimeoutRef.current) clearTimeout(snaphackPulseTimeoutRef.current);
    snaphackPulseTimeoutRef.current = setTimeout(() => setSnaphackPulseKey(null), 380);
  };

  const handleToggleSnaphackRound = (roundKey) => {
    snaphackDraftDirtyRef.current = true;
    setSnaphackConfigDraft((prev) => {
      const set = new Set(prev?.enabledRounds || []);
      if (set.has(roundKey)) set.delete(roundKey);
      else set.add(roundKey);
      return { ...prev, enabledRounds: Array.from(set) };
    });
    setSnaphackPulseKey(roundKey);
    if (snaphackPulseTimeoutRef.current) clearTimeout(snaphackPulseTimeoutRef.current);
    snaphackPulseTimeoutRef.current = setTimeout(() => setSnaphackPulseKey(null), 380);
  };

  const handleSaveSnaphackConfig = async () => {
    if (!lobbyId || !isOwner) return;
    setActionLoading(true);
    setError(null);
    try {
      const data = await updateLobbySettings(lobbyId, {
        snaphackEnabled: !!snaphackConfigDraft?.enabled,
        snaphackEnabledHacks: Array.isArray(snaphackConfigDraft?.enabledHacks) ? snaphackConfigDraft.enabledHacks : [],
        snaphackEnabledRounds: Array.isArray(snaphackConfigDraft?.enabledRounds) ? snaphackConfigDraft.enabledRounds : [],
      });
      setLobby((prev) => (prev ? { ...prev, ...data } : data));
      const cfg = data?.snaphackConfig;
      const enabled = typeof cfg?.enabled === 'boolean' ? cfg.enabled : !!snaphackConfigDraft?.enabled;
      const allowedHacks = new Set(SNAPHACK_PLAYER_HACKS.map((h) => h.key));
      const allowedRounds = new Set(SNAPHACK_ROUND_MODIFIERS.map((r) => r.key));
      const enabledHacks = Array.isArray(cfg?.enabledHacks) ? cfg.enabledHacks : snaphackConfigDraft?.enabledHacks;
      const enabledRounds = Array.isArray(cfg?.enabledRounds) ? cfg.enabledRounds : snaphackConfigDraft?.enabledRounds;
      setSnaphackConfigDraft({
        enabled,
        enabledHacks: enabledHacks.filter((k) => allowedHacks.has(k)),
        enabledRounds: enabledRounds.filter((k) => allowedRounds.has(k)),
      });
      snaphackDraftDirtyRef.current = false;
      setShowSnaphackConfigModal(false);
    } catch (e) {
      setError(e?.message || 'Erro ao salvar configurações SnapHack.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenInCs2 = () => {
    if (!connectStr || !connectHost) return;
    window.location.href = `steam://connect/${connectHost}:${connectPort}`;
  };

  const statusLabel = useMemo(() => {
    const base = {
      waiting: total < maxTotal ? 'AGUARDANDO JOGADORES' : 'PRONTO PARA INICIAR',
      veto: 'VETO DE MAPAS',
      countdown: 'PARTIDA INICIANDO',
      full: 'LOBBY COMPLETO — PRONTO PARA CONECTAR',
      live: 'PARTIDA EM ANDAMENTO',
      finished: 'PARTIDA FINALIZADA',
    };
    if (isSnapArenaLobby) {
      return {
        ...base,
        waiting: total < maxTotal ? 'SNAPARENA · AGUARDANDO TIMES' : 'SNAPARENA · SALA PRONTA PARA INICIAR',
        veto: 'SNAPARENA · FASE TÁTICA (VETO)',
        countdown: 'SNAPARENA · PREPARANDO MATCH',
        full: 'SNAPARENA · SERVIDOR PRONTO',
        live: 'SNAPARENA · PARTIDA AO VIVO',
        finished: 'SNAPARENA · MATCH FINALIZADA',
      };
    }
    if (isSnapHackLobby) {
      return {
        ...base,
        waiting: total < maxTotal ? 'AGUARDANDO JOGADORES (SNAPHACK)' : 'SALA CHEIA — INICIAR SNAPHACK',
        veto: 'VETO DE MAPAS · SNAPHACK',
        full: 'SNAPHACK — SERVIDOR PRONTO · CONECTE',
        live: 'SNAPHACK AO VIVO',
      };
    }
    return base;
  }, [isSnapArenaLobby, isSnapHackLobby, total, maxTotal]);

  const isLiveLobby = lobby?.status === 'live' || !!lobby?.liveScore || !!lobby?.liveStartedAt;
  const displayStatus = isLiveLobby ? 'live' : lobby?.status;

  /**
   * Painel de cartas junto do connect/placar:
   * - partida já “ao vivo” (status live ou já recebeu score/tempo), ou
   * - lobby completo com servidor pronto (pós-veto), para não sumir antes do plugin mandar liveRound.
   */
  const showSnapArenaCardPanel = isSnapArenaLobby && (
    isLiveLobby ||
    (lobby?.status === 'full' && serverReady)
  );

  const readyToStart = lobby?.status === 'waiting' && total >= MAX_LOBBY_PLAYERS;
  const canLeave = lobby?.status === 'waiting' && total < MAX_LOBBY_PLAYERS;

  return (
    <div className="app">
      <div className="scanlines" />
      <div className="grid-bg" />
      <div className="glow-orb" />

      <header className="header">
        <div className="header-left">
          <div className="logo-hex" />
          <div>
            <div className="header-title">
              {lobby?.name || (isSnapArenaLobby ? 'SnapArena' : isSnapHackLobby ? 'SnapHack Arena' : 'PUG')}
            </div>
            <div className="header-sub">
              {isSnapArenaLobby
                ? 'ALLSTARS SNAPARENA · CARTAS & ROUNDS'
                : isSnapHackLobby
                  ? 'SNAPHACK ARENA · HACKS POR ROUND'
                  : 'COMPETITIVO 5x5'}
            </div>
          </div>
        </div>
        <HamburgerNav activePath="/pug" auth={auth} profile={profile} returnTo={lobby ? lobbyListPathForType(lobby.lobbyType) : '/pug'} />
      </header>

      <main className="pug-main">
        <div className="pug-lobby-topbar">
          <Link to={lobbyListPathForType(lobby?.lobbyType)} className="pug-back-btn">&larr; VOLTAR</Link>
          {lobby && (
            <span className="pug-lobby-owner">
              Criado por <strong>{lobby.ownerName}</strong>
              {isOwner && <span className="pug-owner-badge">HOST</span>}
            </span>
          )}
          {inLobby && mySide && (
            <TrackedButton
              type="button"
              className="pug-btn pug-btn-copy"
              onClick={handleCopyInvite}
              title={`Copiar invite (lado ${mySide})`}
            >
              COPIAR INVITE
            </TrackedButton>
          )}
        </div>

        {loading && !lobby && (
          <div className="pug-state">
            <div className="spinner" />
            <span>
              {lobby?.lobbyType === 'snaparena'
                ? 'Carregando sala SnapArena...'
                : lobby?.lobbyType === 'snaphack'
                  ? 'Carregando sala SnapHack...'
                  : 'Carregando lobby...'}
            </span>
          </div>
        )}

        {error && (
          <div className="pug-error">
            <span className="pug-error-icon">!</span>
            <span>{error}</span>
          </div>
        )}

        {isArenaLobby && showSnapHackOnboarding && lobby && (
          <div
            className="snaphack-onboarding-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="snaphack-onboarding-title"
          >
            <div className="snaphack-onboarding-modal">
              <div className="snaphack-onboarding-glow" aria-hidden />
              <h2 id="snaphack-onboarding-title" className="snaphack-onboarding-title">
                {isSnapArenaLobby ? 'SnapArena (AllstarsMatchzy)' : 'SnapHack Arena'}
              </h2>
              <p className="snaphack-onboarding-lead">
                {isSnapArenaLobby
                  ? 'Modo oficial SnapArena (Allstars): fluxo competitivo com picks táticos por round.'
                  : 'Modo casual com regras especiais — leia antes de jogar:'}
              </p>
              <ul className="snaphack-onboarding-list">
                {isSnapArenaLobby ? (
                  <>
                    <li>
                      <strong>Engine SnapArena</strong> — a partida é conduzida pelo <strong>AllstarsMatchzy</strong> em formato competitivo por rounds.
                    </li>
                    <li>
                      <strong>Picks táticos</strong> — os líderes escolhem cartas <em>neste site</em> para o próximo round (até 3 por time por half em MR12).
                    </li>
                    <li>
                      <strong>Veto de mapas</strong> — fluxo profissional: líderes banem até restar o mapa oficial da partida.
                    </li>
                    <li>
                      <strong>Partida de evento</strong> — esta partida <em>não</em> altera pontos nem level do perfil.
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <><strong>Hacks aleatórios</strong> a cada round (efeitos variados por jogador).</>
                    </li>
                    <li>
                      <strong>Sem progressão ranked</strong> — esta partida <em>não</em> altera pontos nem level do site.
                    </li>
                    <li>
                      <strong>Veto de mapas</strong> no mesmo estilo competitivo: líderes CT/TR banem até restar o mapa.
                    </li>
                    <li>
                      Depois do warmup há o round valendo; o servidor roda o modo SnapHack.
                    </li>
                  </>
                )}
              </ul>
              <div className="snaphack-onboarding-actions">
                <TrackedButton type="button" className="pug-btn pug-btn-primary snaphack-onboarding-btn" onClick={dismissSnapHackOnboarding}>
                  Entendi, vamos lá
                </TrackedButton>
              </div>
            </div>
          </div>
        )}

        {/* SnapHack Arena config is rendered under the chat (inline), not as a modal. */}

        {!loading && !lobby && !error && (
          <div className="pug-state">
            <span>Lobby nao encontrado.</span>
            <a href="/pug" className="pug-btn pug-btn-primary" style={{ marginTop: '1rem' }}>VOLTAR</a>
          </div>
        )}

        {lobby && (
          <>
            <div className="pug-status-bar">
              <span className={`pug-status pug-status-${displayStatus}`}>
                {statusLabel[displayStatus] || lobby.status?.toUpperCase()}
                {isArenaLobby && (
                  <span
                    className={isSnapHackLobby ? 'pug-status-snaphack-badge' : 'pug-status-snaparena-badge'}
                    title="Partidas SnapArena/SnapHack não alteram pontos nem level"
                  >
                    SEM RANKED
                  </span>
                )}
              </span>
              <span className="pug-count">
                {total}/{maxTotal} JOGADORES
              </span>
            </div>

            <div
              className={`pug-arena ${isSnapArenaLobby ? 'pug-arena--snaparena' : ''} ${(lobby.status === 'full' || lobby.status === 'countdown' || lobby.status === 'live') && lobby.selectedMap ? 'pug-arena--map-bg' : ''}`}
              style={(lobby.status === 'full' || lobby.status === 'countdown' || lobby.status === 'live') && (getMapInfo(lobby.selectedMap)?.bg || getMapInfo(lobby.selectedMap)?.img)
                ? { '--pug-map-bg': `url(${getMapInfo(lobby.selectedMap).bg || getMapInfo(lobby.selectedMap).img})` }
                : undefined}
            >
              <TeamPanelMemo side="A" players={lobby.teamA || []} mySteamId={auth.steamId} playersProfile={lobby.playersProfile} />
              <div className="pug-center">
                <div className={`pug-vs ${isSnapArenaLobby ? 'pug-vs--snaparena' : ''}`}>{isSnapArenaLobby ? 'SNAPARENA' : 'VS'}</div>

                {lobby.status === 'waiting' && (
                  <div className="pug-actions">
                    {readyToStart ? (
                      <>
                        {isOwner ? (
                          <>
                            <label className="pug-matchzy-admin-check" title="Ser admin no servidor (MatchZy) para testar comandos">
                              <input
                                type="checkbox"
                                checked={!!lobby.matchzyOwnerAdmin}
                                onChange={handleMatchzyAdminToggle}
                                disabled={actionLoading}
                              />
                              <span className="pug-switch-track" aria-hidden="true">
                                <span className="pug-switch-knob" />
                              </span>
                              <span className="pug-toggle-text">Ser admin no servidor (MatchZy)</span>
                            </label>
                            <TrackedButton
                              className="pug-btn pug-btn-primary pug-btn-start-match"
                              onClick={handleBeginVeto}
                              disabled={actionLoading}
                            >
                              {actionLoading ? '...' : 'INICIAR PARTIDA'}
                            </TrackedButton>

                            {isSnapHackLobby && (
                              <TrackedButton
                                type="button"
                                className="pug-btn pug-btn-secondary pug-btn-snaphack-config"
                                onClick={handleOpenSnaphackConfig}
                                disabled={actionLoading}
                                style={{ marginTop: '0.5rem' }}
                              >
                                CONFIGURAR SNAPHACK
                              </TrackedButton>
                            )}
                          </>
                        ) : (
                          <p className="pug-waiting-owner">Aguardando o dono da sala iniciar a partida...</p>
                        )}
                        {isOwner && (
                          <TrackedButton
                            className="pug-btn pug-btn-danger"
                            onClick={handleReset}
                            disabled={actionLoading}
                            style={{ marginTop: '0.5rem' }}
                          >
                            CANCELAR
                          </TrackedButton>
                        )}
                      </>
                    ) : (
                      <>
                        {inLobby && canLeave && (
                          <TrackedButton
                            className="pug-btn pug-btn-secondary"
                            onClick={handleLeave}
                            disabled={actionLoading}
                          >
                            SAIR DO LOBBY
                          </TrackedButton>
                        )}
                        {isOwner && (
                          <label className="pug-matchzy-admin-check" title="Ser admin no servidor (MatchZy) para testar comandos">
                            <input
                              type="checkbox"
                              checked={!!lobby.matchzyOwnerAdmin}
                              onChange={handleMatchzyAdminToggle}
                              disabled={actionLoading}
                            />
                            <span className="pug-switch-track" aria-hidden="true">
                              <span className="pug-switch-knob" />
                            </span>
                            <span className="pug-toggle-text">Ser admin no servidor (MatchZy)</span>
                          </label>
                        )}

                        {isSnapHackLobby && isOwner && (
                          <TrackedButton
                            type="button"
                            className="pug-btn pug-btn-secondary pug-btn-snaphack-config"
                            onClick={handleOpenSnaphackConfig}
                            disabled={actionLoading}
                            style={{ marginTop: '0.5rem' }}
                          >
                            CONFIGURAR SNAPHACK
                          </TrackedButton>
                        )}
                        {isOwner && total < maxTotal && (
                          <TrackedButton
                            className="pug-btn pug-btn-primary"
                            onClick={handleAddBots}
                            disabled={actionLoading}
                          >
                            {actionLoading ? '...' : 'ADICIONAR BOTS'}
                          </TrackedButton>
                        )}
                        {isOwner && total > 1 && (
                          <TrackedButton
                            className="pug-btn pug-btn-danger"
                            onClick={handleReset}
                            disabled={actionLoading}
                          >
                            LIMPAR LOBBY
                          </TrackedButton>
                        )}
                        {!auth.steamId && (
                          <p className="pug-login-hint">Faca login com Steam para interagir.</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {lobby.status === 'veto' && (
                  <>
                    <div className="pug-veto-overlay" aria-hidden="false">
                      <div className="pug-veto-overlay-blur" />
                      <div className="pug-veto-overlay-inner">
                        <VetoHeader lobby={lobby} />
                        <div className="pug-veto-overlay-content">
                          <VetoSidePanel side="ct" players={lobby.teamA || []} playersProfile={lobby.playersProfile} />
                          <div className="pug-veto-center">
                            <MapVetoSection
                              lobbyId={lobbyId}
                              lobby={lobby}
                              authSteamId={auth.steamId}
                              onLobbyUpdate={handleLobbyUpdate}
                              actionLoading={actionLoading}
                              setActionLoading={setActionLoading}
                              setError={setError}
                            />
                            {isOwner && (
                              <TrackedButton
                                className="pug-btn pug-btn-danger"
                                onClick={handleReset}
                                disabled={actionLoading}
                                style={{ marginTop: '1rem' }}
                              >
                                CANCELAR E RESETAR
                              </TrackedButton>
                            )}
                          </div>
                          <VetoSidePanel side="tr" players={lobby.teamB || []} playersProfile={lobby.playersProfile} />
                        </div>
                        <div className="pug-veto-chat-wrap">
                          <LobbyChatMemo lobbyId={lobbyId} steamId={auth.steamId} playersProfile={lobby.playersProfile} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {lobby.status === 'countdown' && (
                  <div className="pug-countdown-box">
                    {startingMatch ? (
                      <>
                        <div className="pug-countdown-label">Iniciando partida</div>
                        <div className="pug-countdown-map">
                          {(getMapInfo(lobby.selectedMap)?.name || lobby.selectedMap || '').toUpperCase()}
                        </div>
                        <div className="pug-countdown-num pug-countdown-num--loading">
                          <span className="spinner" />
                          <span>Alocando servidor...</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="pug-countdown-label">Partida iniciando em</div>
                        <div className="pug-countdown-map">
                          {(getMapInfo(lobby.selectedMap)?.name || lobby.selectedMap || '').toUpperCase()}
                        </div>
                        <div className="pug-countdown-num">
                          {mapCountdown >= 0 ? mapCountdown : MAP_VETO_COUNTDOWN_SECONDS}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {(lobby.status === 'full' || lobby.status === 'live') && (
                  <div className="pug-connect-box">
                    {lobby.selectedMap && getMapInfo(lobby.selectedMap)?.img && (
                      <div className="pug-connect-map-info">
                        <div className="pug-connect-map-img-wrap">
                          <img
                            src={getMapInfo(lobby.selectedMap).img}
                            alt=""
                            className="pug-connect-map-img"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                        <span className="pug-connect-map-name">{getMapInfo(lobby.selectedMap).name}</span>
                      </div>
                    )}
                    <div className="pug-connect-live-score">
                      <span className="pug-connect-score-ct">{lobby.liveScore?.ct ?? 0}</span>
                      <span className="pug-connect-score-sep">x</span>
                      <span className="pug-connect-score-tr">{lobby.liveScore?.tr ?? 0}</span>
                    </div>
                    {matchElapsed && (
                      <div className="pug-connect-elapsed">{matchElapsed}</div>
                    )}
                    <div className="pug-connect-title">ACESSAR PARTIDA</div>
                    {!serverReady ? (
                      <div className="pug-preparing">
                        <div className="spinner" />
                        <span>Preparando servidor... {countdown}s</span>
                      </div>
                    ) : connectStr ? (
                      <>
                        <div className="pug-connect-cmd">{connectStr}</div>
                        <div className="pug-connect-buttons">
                          <TrackedButton type="button" className="pug-btn pug-btn-primary" onClick={handleOpenInCs2}>
                            ABRIR NO CS2
                          </TrackedButton>
                          <TrackedButton type="button" className="pug-btn pug-btn-copy" onClick={handleCopyConnect}>
                            COPIAR COMANDO
                          </TrackedButton>
                        </div>
                      </>
                    ) : (
                      <p className="pug-connect-fallback">
                        Configure PUG_SERVER_IP no backend. Senha: <strong>{lobby.password}</strong>
                      </p>
                    )}
                    {isOwner && (
                      <TrackedButton
                        className="pug-btn pug-btn-danger"
                        onClick={handleReset}
                        disabled={actionLoading}
                        style={{ marginTop: '1rem' }}
                      >
                        LIMPAR LOBBY
                      </TrackedButton>
                    )}
                  </div>
                )}
              </div>
              <TeamPanelMemo side="B" players={lobby.teamB || []} mySteamId={auth.steamId} playersProfile={lobby.playersProfile} />
            </div>

            {showSnapArenaCardPanel && (lobby.status === 'full' || lobby.status === 'live') && (
              <div className="snaparena-live-stack snaparena-live-stack--fullwidth">
                <SnapArenaCardsPanel
                  lobby={lobby}
                  authSteamId={auth.steamId}
                  onSelectCard={handleSelectSnapArenaCard}
                  actionLoading={actionLoading}
                />
                {isOwner && (
                  <details className="snaparena-debug-details">
                    <summary className="snaparena-debug-summary">Controle técnico do engine (host)</summary>
                    <SnapArenaBackendControl
                      lobby={lobby}
                      isOwner={isOwner}
                      actionLoading={actionLoading}
                      setActionLoading={setActionLoading}
                      setError={setError}
                      onLobbyUpdate={handleLobbyUpdate}
                    />
                  </details>
                )}
              </div>
            )}

            {lobby.status !== 'veto' && (
              <>
                <div className="pug-lobby-chat-wrap">
                  <LobbyChatMemo
                    lobbyId={lobbyId}
                    steamId={auth.steamId}
                    playersProfile={lobby.playersProfile}
                    isVip={Boolean(profile.profile?.isVip)}
                  />
                </div>
              </>
            )}

            {/* drawer is rendered via portal below */}
          </>
        )}

        {isSnapHackLobby && showSnaphackConfigModal && lobby?.status === 'waiting' && createPortal(
          <div
            className="snaphack-config-drawer-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="snaphack-config-drawer-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseSnaphackConfig();
            }}
          >
            <div className="snaphack-config-drawer">
              <div className="snaphack-config-drawer-header">
                <div className="snaphack-config-drawer-header-left">
                  <div className="snaphack-config-eyebrow">SnapHack Arena</div>
                  <h2 id="snaphack-config-drawer-title" className="snaphack-config-title">Configurar hacks</h2>
                  <p className="snaphack-config-subtitle">
                    O lider escolhe quais hacks e modificadores podem aparecer. Se desligar, o servidor volta ao comportamento normal.
                  </p>
                </div>
                <TrackedButton
                  type="button"
                  className="snaphack-config-close"
                  onClick={handleCloseSnaphackConfig}
                  disabled={actionLoading}
                  aria-label="Fechar"
                >
                  ×
                </TrackedButton>
              </div>

              <div className="snaphack-config-drawer-body">
                <div className="snaphack-config-section">
                  <div className="snaphack-config-master-row">
                    <label className="snaphack-master-switch" title="Quando desligado, o SnapHackPlugin nao aplica hacks nem modificadores.">
                      <input
                        type="checkbox"
                        checked={!!snaphackConfigDraft?.enabled}
                        onChange={handleToggleSnaphackEnabled}
                        disabled={actionLoading}
                      />
                      <span className="snaphack-master-track" aria-hidden="true">
                        <span className="snaphack-master-knob" />
                      </span>
                      <span className="snaphack-master-label">SnapHack Arena habilitado</span>
                    </label>
                  </div>
                </div>

                <div className="snaphack-config-section">
                  <div className="snaphack-config-section-title">Hacks individuais (por jogador)</div>
                  <div className="snaphack-options-grid">
                    {SNAPHACK_PLAYER_HACKS.map((h) => {
                      const enabled = Array.isArray(snaphackConfigDraft?.enabledHacks) && snaphackConfigDraft.enabledHacks.includes(h.key);
                      const pulse = snaphackPulseKey === h.key;
                      return (
                        <TrackedButton
                          key={h.key}
                          type="button"
                          className={`snaphack-opt ${enabled ? 'snaphack-opt--on' : 'snaphack-opt--off'} ${pulse ? 'snaphack-opt--pulse' : ''}`}
                          onClick={() => handleToggleSnaphackHack(h.key)}
                          disabled={actionLoading}
                          aria-pressed={enabled}
                        >
                          <div className="snaphack-opt-top">
                            <div className="snaphack-opt-name">{h.name}</div>
                            <div className="snaphack-opt-badge">{enabled ? 'ATIVO' : 'DESL.'}</div>
                          </div>
                          <div className="snaphack-opt-desc">{h.description}</div>
                        </TrackedButton>
                      );
                    })}
                  </div>
                </div>

                <div className="snaphack-config-section">
                  <div className="snaphack-config-section-title">Modificadores do round (globais)</div>
                  <div className="snaphack-options-grid snaphack-options-grid--round">
                    {SNAPHACK_ROUND_MODIFIERS.map((m) => {
                      const enabled = Array.isArray(snaphackConfigDraft?.enabledRounds) && snaphackConfigDraft.enabledRounds.includes(m.key);
                      const pulse = snaphackPulseKey === m.key;
                      return (
                        <TrackedButton
                          key={m.key}
                          type="button"
                          className={`snaphack-opt ${enabled ? 'snaphack-opt--on' : 'snaphack-opt--off'} ${pulse ? 'snaphack-opt--pulse' : ''}`}
                          onClick={() => handleToggleSnaphackRound(m.key)}
                          disabled={actionLoading}
                          aria-pressed={enabled}
                        >
                          <div className="snaphack-opt-top">
                            <div className="snaphack-opt-name">{m.name}</div>
                            <div className="snaphack-opt-badge">{enabled ? 'ATIVO' : 'DESL.'}</div>
                          </div>
                          <div className="snaphack-opt-desc">{m.description}</div>
                        </TrackedButton>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="snaphack-config-drawer-footer">
                <TrackedButton
                  type="button"
                  className="pug-btn pug-btn-primary"
                  onClick={handleSaveSnaphackConfig}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'SALVANDO...' : 'FECHAR E SALVAR'}
                </TrackedButton>
              </div>
            </div>
          </div>, document.body
        )}
      </main>
    </div>
  );
}
