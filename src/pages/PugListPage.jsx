import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { HamburgerNav } from '../components/HamburgerNav';
import { LevelUpPreview } from '../components/LevelUpPreview';
import { LevelProgressFloatingModal } from '../components/LevelProgressFloatingModal';
import { getLobbies, createLobby, joinLobby, getMyLobby, getPoolStatus, testDynamicScale, testResetPool } from '../services/pugService';
import { connectSocket, disconnectSocket } from '../services/pugSocket';
import '../index.css';
import { TrackedButton } from '../components/TrackedButton';

const STATUS_LABEL = {
  waiting: 'AGUARDANDO',
  veto: 'VETO',
  countdown: 'INICIANDO',
  full: 'COMPLETO',
  live: 'AO VIVO',
};

const STATUS_CLASS = {
  waiting: 'pug-list-status--waiting',
  veto: 'pug-list-status--waiting',
  countdown: 'pug-list-status--full',
  full: 'pug-list-status--full',
  live: 'pug-list-status--live',
};

const MAP_BACKGROUNDS_BASE = '/images/maps/backgrounds';
const MAP_POOL_BG = ['de_anubis', 'de_ancient', 'de_dust2', 'de_inferno', 'de_mirage', 'de_nuke', 'de_overpass', 'de_cache'];
function getMapBgUrl(mapId) {
  if (!mapId) return null;
  const bare = String(mapId).split('/').pop() || mapId;
  if (MAP_POOL_BG.includes(bare)) return `${MAP_BACKGROUNDS_BASE}/${bare}.png`;
  return `${MAP_BACKGROUNDS_BASE}/${bare}.png`;
}

const SLOTS = 5;

function TeamSlots({ players, playersProfile }) {
  const slots = Array.from({ length: SLOTS }, (_, i) => players[i] || null);
  const profile = playersProfile || {};
  return (
    <div className="plc-team-slots">
      {slots.map((p, i) => {
        const level = p?.steamId ? (profile[p.steamId]?.level ?? null) : null;
        const name = p ? (p.displayName || 'Jogador') : '';
        return (
          <div
            key={i}
            className={`plc-slot ${p ? (p.isBot ? 'plc-slot--bot' : 'plc-slot--filled') : 'plc-slot--empty'}`}
          >
            {p ? (
              <>
                {name}
                {level != null && <span className="plc-slot-lvl" title={`Level ${level}`}> {level}</span>}
              </>
            ) : ''}
          </div>
        );
      })}
    </div>
  );
}

function formatElapsed(startMs) {
  if (!startMs) return '';
  const sec = Math.max(0, Math.floor((Date.now() - Number(startMs)) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function LobbyCard({ lobby, onJoin, joining }) {
  const total = lobby.playerCount ?? 0;
  const max = lobby.maxPlayers ?? 10;
  const canJoin = lobby.status === 'waiting' && total < max;
  const isJoining = joining === lobby.id;
  const teamA = lobby.teamA || [];
  const teamB = lobby.teamB || [];
  const showMapBg = lobby.selectedMap && (lobby.status === 'full' || lobby.status === 'countdown' || lobby.status === 'live');
  const mapBgUrl = showMapBg ? getMapBgUrl(lobby.selectedMap) : null;
  const isLive = lobby.status === 'live' || !!lobby.liveScore || !!lobby.liveStartedAt;
  const score = lobby.liveScore;
  // Exibir "AO VIVO" e placar quando há liveScore/liveStartedAt, mesmo que o backend ainda tenha status 'full' ou 'countdown'
  const displayStatus = isLive ? 'live' : lobby.status;

  const [elapsed, setElapsed] = useState(() => formatElapsed(lobby.liveStartedAt));
  useEffect(() => {
    if (!lobby.liveStartedAt || !isLive) { setElapsed(''); return; }
    setElapsed(formatElapsed(lobby.liveStartedAt));
    const t = setInterval(() => setElapsed(formatElapsed(lobby.liveStartedAt)), 1000);
    return () => clearInterval(t);
  }, [lobby.liveStartedAt, isLive]);

  return (
    <div className={`pug-list-card ${showMapBg ? 'pug-list-card--map-bg' : ''}`}>
      {mapBgUrl && <div className="pug-list-card-bg" style={{ backgroundImage: `url(${mapBgUrl})` }} aria-hidden />}
      <div className="pug-list-card-top">
        {lobby.lobbyType === 'mix' && <span className="plc-mix-badge" title="Sala MIX (VIP)">MIX</span>}
        {lobby.lobbyType === 'squad' && <span className="plc-mix-badge plc-squad-badge" title="Partida Squad">SQUAD</span>}
        {lobby.lobbyType === 'snaphack' && <span className="plc-mix-badge plc-snaphack-badge" title="SnapHack Arena">HACK</span>}
        {lobby.lobbyType === 'snaparena' && <span className="plc-mix-badge plc-snaparena-badge" title="SnapArena — AllstarsMatchzy">ARENA</span>}
        {lobby.hasPassword && <span className="plc-lock" title="Sala com senha">&#128274;</span>}
        <span className={`pug-list-status ${STATUS_CLASS[displayStatus] || ''}`}>
          {STATUS_LABEL[displayStatus] || lobby.status?.toUpperCase()}
        </span>
      </div>

      <h3 className="pug-list-card-name">{lobby.name || `Lobby #${String(lobby.id).slice(-4)}`}</h3>
      {(lobby.lobbyType === 'squad' || lobby.lobbyType === 'mix' || lobby.lobbyType === 'pug' || lobby.lobbyType === 'snaphack' || lobby.lobbyType === 'snaparena') && (
        <p className={`pug-list-card-type ${
          lobby.lobbyType === 'squad'
            ? 'pug-list-card-type--squad'
            : lobby.lobbyType === 'snaparena'
              ? 'pug-list-card-type--snaparena'
              : lobby.lobbyType === 'snaphack'
                ? 'pug-list-card-type--snaphack'
                : 'pug-list-card-type--pug'
        }`}>
          {lobby.lobbyType === 'squad'
            ? 'Partida Squad'
            : lobby.lobbyType === 'mix'
              ? 'Lobby MIX (VIP)'
              : lobby.lobbyType === 'snaphack'
                ? 'SnapHack Arena'
                : lobby.lobbyType === 'snaparena'
                  ? 'SnapArena · plugin AllstarsMatchzy'
                  : 'Lobby PUG'}
        </p>
      )}
      {lobby.ownerName && <p className="pug-list-card-owner">{lobby.ownerName}</p>}

      {isLive && score ? (
        <div className="plc-live-score-row">
          <div className="plc-live-score-center">
            <span className="plc-live-score">{score.ct ?? 0}</span>
            <span className="plc-live-vs">x</span>
            <span className="plc-live-score">{score.tr ?? 0}</span>
          </div>
          {elapsed && <span className="plc-live-elapsed">{elapsed}</span>}
        </div>
      ) : null}

      <div className="plc-teams-row">
        <TeamSlots players={teamA} playersProfile={lobby.playersProfile} />
        <span className="plc-vs">VS</span>
        <TeamSlots players={teamB} playersProfile={lobby.playersProfile} />
      </div>

      <span className="pug-list-card-count">{total}/{max} JOGADORES</span>

      <TrackedButton
        className="pug-btn pug-list-card-join"
        onClick={() => onJoin(lobby.id, lobby.hasPassword)}
        disabled={!canJoin || isJoining}
      >
        {isJoining ? 'ENTRANDO...' : canJoin ? 'ENTRAR' : isLive ? 'AO VIVO' : 'LOTADO'}
      </TrackedButton>
    </div>
  );
}

function PasswordModal({ title, onConfirm, onCancel }) {
  const [value, setValue] = useState('');
  return (
    <div className="plc-modal-backdrop" onClick={onCancel}>
      <div className="plc-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="plc-modal-title">{title}</h3>
        <input
          className="plc-modal-input"
          type="password"
          placeholder="Digite a senha"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && value.trim() && onConfirm(value.trim())}
          autoFocus
        />
        <div className="plc-modal-actions">
          <TrackedButton className="pug-btn pug-btn-secondary" onClick={onCancel}>CANCELAR</TrackedButton>
          <TrackedButton className="pug-btn pug-btn-primary" onClick={() => onConfirm(value.trim())} disabled={!value.trim()}>
            CONFIRMAR
          </TrackedButton>
        </div>
      </div>
    </div>
  );
}

function CreateModal({ onConfirm, onCancel, isVip, lobbyType = 'pug' }) {
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [matchzyOwnerAdmin, setMatchzyOwnerAdmin] = useState(false);
  const [mode, setMode] = useState(() => (lobbyType === 'snaphack' ? 'snaphack' : (lobbyType === 'snaparena' ? 'snaparena' : lobbyType)));
  const canCreate = mode !== 'squad' || isVip;
  const handleConfirm = () => {
    if (!canCreate) return;
    onConfirm(usePassword ? password.trim() || null : null, mode, matchzyOwnerAdmin);
  };
  return (
    <div className="plc-modal-backdrop" onClick={onCancel}>
      <div className="plc-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="plc-modal-title">
          {mode === 'squad'
            ? 'CRIAR PARTIDA SQUAD'
            : mode === 'snaphack'
              ? 'CRIAR SALA SNAPHACK'
              : mode === 'snaparena'
                ? 'CRIAR SALA SNAPARENA'
                : 'CRIAR LOBBY PUG'}
        </h3>
        {lobbyType === 'snaparena' && mode === 'snaparena' && (
          <p className="plc-modal-snaparena-lead">
            Sala para o modo <strong>SnapArena</strong>: o servidor sobe com o plugin <strong>AllstarsMatchzy</strong> (GAME_MODE SnapArena).
            Fluxo no site: preencher os times → <strong>veto de mapa</strong> → conectar → durante a partida os líderes escolhem <strong>cartas</strong> para o próximo round (até 3 por half, como no MR12).
          </p>
        )}
        {lobbyType === 'snaparena' && mode !== 'snaparena' && (
          <p className="plc-modal-snaparena-warn">
            Você está na aba <strong>SnapArena</strong>, mas o modo selecionado abaixo <strong>não</strong> usa o engine SnapArena / AllstarsMatchzy. Escolha <strong>SnapArena</strong> para compatibilidade com o plugin.
          </p>
        )}
        {mode === 'squad' && !isVip && (
          <p className="plc-modal-vip-hint" style={{ marginBottom: 12 }}>Requer VIP para criar lobby. <Link to="/profile">Assinar VIP</Link></p>
        )}
        {mode === 'squad' && (
          <p className="plc-modal-hint">Você precisa estar em um squad. <Link to="/squad">Ver meu squad</Link></p>
        )}
        <div className="plc-modal-type-row">
          <span className="plc-modal-type-label">Modo:</span>
          <TrackedButton
            type="button"
            className={`pug-btn plc-modal-type-btn ${mode === 'pug' ? 'plc-modal-type-btn--active' : ''}`}
            onClick={() => setMode('pug')}
          >
            PUG
          </TrackedButton>
          <TrackedButton
            type="button"
            className={`pug-btn plc-modal-type-btn ${mode === 'snaphack' ? 'plc-modal-type-btn--active' : ''}`}
            onClick={() => setMode('snaphack')}
            title="Modo caótico com hacks aleatórios a cada round"
          >
            SnapHack Arena
          </TrackedButton>
          <TrackedButton
            type="button"
            className={`pug-btn plc-modal-type-btn ${mode === 'snaparena' ? 'plc-modal-type-btn--active' : ''}`}
            onClick={() => setMode('snaparena')}
            title="Modo arena com engine custom de 1x1"
          >
            SnapArena
          </TrackedButton>
          {lobbyType === 'squad' && (
            <TrackedButton
              type="button"
              className={`pug-btn plc-modal-type-btn ${mode === 'squad' ? 'plc-modal-type-btn--active' : ''}`}
              onClick={() => setMode('squad')}
            >
              SQUAD
            </TrackedButton>
          )}
        </div>
        {mode === 'snaphack' && (
          <div className="plc-modal-type-desc" style={{ marginTop: -8 }}>
            Modo caótico com hacks aleatórios a cada round.
          </div>
        )}
        {mode === 'snaparena' && (
          <div className="plc-modal-type-desc" style={{ marginTop: -8 }}>
            Duelos/rounds pelo motor Allstars; cartas aplicadas via fila do site; sem progressão ranked no perfil.
          </div>
        )}
        <label className="plc-modal-check">
          <input type="checkbox" checked={usePassword} onChange={(e) => setUsePassword(e.target.checked)} />
          <span>Proteger com senha</span>
        </label>
        <label
          className="plc-modal-check"
          title={mode === 'snaparena'
            ? 'Admin MatchZy no servidor; em SnapArena o host costuma precisar para fluxo de warmup/partida.'
            : 'Ser admin no servidor (MatchZy) para testar comandos'}
        >
          <input type="checkbox" checked={matchzyOwnerAdmin} onChange={(e) => setMatchzyOwnerAdmin(e.target.checked)} />
          <span>
            {mode === 'snaparena'
              ? 'Sou admin no servidor (MatchZy) — recomendado no SnapArena'
              : 'Ser admin no servidor (MatchZy)'}
          </span>
        </label>
        {usePassword && (
          <input
            className="plc-modal-input"
            type="text"
            placeholder="Senha da sala"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            autoFocus
          />
        )}
        <div className="plc-modal-actions">
          <TrackedButton className="pug-btn pug-btn-secondary" onClick={onCancel}>CANCELAR</TrackedButton>
          <TrackedButton
            className="pug-btn pug-btn-primary"
            onClick={handleConfirm}
            disabled={!canCreate}
          >
            {mode === 'snaparena'
              ? 'CRIAR SALA SNAPARENA'
              : mode === 'snaphack'
                ? 'CRIAR SALA SNAPHACK'
                : mode === 'squad'
                  ? 'CRIAR PARTIDA SQUAD'
                  : 'CRIAR LOBBY PUG'}
          </TrackedButton>
        </div>
      </div>
    </div>
  );
}

function PoolTestPanel({ onOpenLobby }) {
  const [pool, setPool] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const refreshPool = async () => {
    try { setPool(await getPoolStatus()); } catch { /* ignore */ }
  };

  useEffect(() => { refreshPool(); }, []);

  const handleTestDynamic = async () => {
    setBusy(true);
    setResult(null);
    try {
      const data = await testDynamicScale();
      setResult(data);
      await refreshPool();
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true);
    setResult(null);
    try {
      const data = await testResetPool();
      setResult(data);
      await refreshPool();
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setBusy(false);
    }
  };

  const copyConnect = () => {
    const connect = result?.lobby?.connect;
    if (connect && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(connect);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const idleCount = pool.filter(i => i.status === 'idle').length;
  const runningCount = pool.filter(i => i.status === 'running').length;
  const dynamicCount = pool.filter(i => !i.isPreWarmed).length;
  const testLobby = result?.ok && result?.lobby;

  return (
    <div className="pool-test-panel">
      <TrackedButton className="pool-test-toggle" onClick={() => setExpanded(v => !v)}>
        {expanded ? '▾' : '▸'} DEV: POOL TEST PANEL
      </TrackedButton>
      {expanded && (
        <div className="pool-test-content">
          <div className="pool-test-summary">
            <span className="pool-chip pool-chip--idle">IDLE: {idleCount}</span>
            <span className="pool-chip pool-chip--running">RUNNING: {runningCount}</span>
            <span className="pool-chip pool-chip--dynamic">DYNAMIC: {dynamicCount}</span>
            <span className="pool-chip">TOTAL: {pool.length}</span>
          </div>
          <div className="pool-test-instances">
            {pool.map(inst => (
              <div key={inst.id} className={`pool-inst pool-inst--${inst.status}`}>
                <span className="pool-inst-id">{inst.id}</span>
                <span className="pool-inst-port">:{inst.port}</span>
                <span className={`pool-inst-status pool-inst-status--${inst.status}`}>{inst.status.toUpperCase()}</span>
                {!inst.isPreWarmed && <span className="pool-inst-tag">DYNAMIC</span>}
              </div>
            ))}
          </div>
          <div className="pool-test-actions">
            <TrackedButton className="pug-btn pug-btn-primary pool-test-btn" onClick={handleTestDynamic} disabled={busy}>
              {busy ? 'WORKING...' : 'FORCE ALL BUSY + ALLOCATE DYNAMIC'}
            </TrackedButton>
            <TrackedButton className="pug-btn pug-btn-secondary pool-test-btn" onClick={handleReset} disabled={busy}>
              RESET TEST STATE
            </TrackedButton>
            <TrackedButton className="pug-btn pug-btn-secondary pool-test-btn" onClick={refreshPool} disabled={busy}>
              REFRESH
            </TrackedButton>
          </div>
          {testLobby && (
            <div className="pool-test-lobby-box">
              <div className="pool-test-lobby-title">PUG lobby (dynamic server) ready</div>
              <TrackedButton type="button" className="pug-btn pug-btn-primary pool-test-open-btn" onClick={() => onOpenLobby(testLobby.id)}>
                OPEN LOBBY
              </TrackedButton>
              {testLobby.connect && (
                <div className="pool-test-connect-row">
                  <code className="pool-test-connect-code">{testLobby.connect}</code>
                  <TrackedButton type="button" className="pug-btn pug-btn-secondary pool-test-copy-btn" onClick={copyConnect}>
                    {copied ? 'COPIED' : 'COPY'}
                  </TrackedButton>
                </div>
              )}
            </div>
          )}
          {result && !testLobby && (
            <pre className="pool-test-result">{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function PugListPage() {
  const auth = useAuth();
  const profile = useProfile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lobbyTypeFromUrl = (() => {
    const t = (searchParams.get('lobbyType') || '').toLowerCase();
    if (t === 'squad') return 'squad';
    if (t === 'snaphack' || t === 'snaphackarena' || t === 'snaphack_arena') return 'snaphack';
    if (t === 'snaparena' || t === 'snap_arena' || t === 'snaparena_arena') return 'snaparena';
    return 'pug';
  })();
  const [lobbies, setLobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(null);
  const [error, setError] = useState(null);
  const [myLobbyId, setMyLobbyId] = useState(null);
  const [myLobbyType, setMyLobbyType] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(null);

  const fetchLobbies = useCallback(async () => {
    try {
      const data = await getLobbies();
      setLobbies(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredLobbies = useMemo(() => {
    return lobbies.filter((l) =>
      lobbyTypeFromUrl === 'squad'
        ? l.lobbyType === 'squad'
        : lobbyTypeFromUrl === 'snaparena'
          ? l.lobbyType === 'snaparena'
        : lobbyTypeFromUrl === 'snaphack'
          ? l.lobbyType === 'snaphack'
          : (l.lobbyType !== 'squad' && l.lobbyType !== 'snaphack' && l.lobbyType !== 'snaparena')
    );
  }, [lobbies, lobbyTypeFromUrl]);

  useEffect(() => {
    if (auth.steamId) {
      getMyLobby()
        .then((data) => {
          setMyLobbyId(data?.lobbyId || null);
          setMyLobbyType(data?.lobbyType || null);
        })
        .catch(() => {
          setMyLobbyId(null);
          setMyLobbyType(null);
        });
    } else {
      setMyLobbyId(null);
      setMyLobbyType(null);
    }
  }, [auth.steamId]);

  useEffect(() => {
    fetchLobbies();
    const s = connectSocket();
    s.on('lobbies:updated', (data) => {
      setLobbies((prev) => {
        if (!Array.isArray(data)) return prev;
        const byId = new Map((prev || []).map((l) => [l.id, l]));
        return data.map((l) => {
          const existing = byId.get(l.id);
          if (!existing) return l;
          return {
            ...l,
            status: l.status ?? existing.status,
            liveScore: l.liveScore ?? existing.liveScore,
            liveRound: l.liveRound ?? existing.liveRound,
            liveStartedAt: l.liveStartedAt ?? existing.liveStartedAt,
            playersProfile: l.playersProfile ?? existing.playersProfile,
          };
        });
      });
    });
    const fallback = setInterval(fetchLobbies, 3000);
    return () => {
      s.off('lobbies:updated');
      clearInterval(fallback);
      disconnectSocket();
    };
  }, [fetchLobbies]);

  const handleCreateClick = () => {
    if (!auth.steamId) { auth.login('/pug'); return; }
    if (myLobbyId && myLobbyType && myLobbyType === lobbyTypeFromUrl) {
      navigate(`/pug/${myLobbyId}`);
      return;
    }
    if (myLobbyId && myLobbyType && myLobbyType !== lobbyTypeFromUrl) {
      // Ja tem uma sala de outro tipo aberta; nao permitir criar outra.
      alert('Você já tem uma sala aberta. Encerre a sala atual antes de criar outra.');
      return;
    }
    setShowCreateModal(true);
  };

  const handleCreateConfirm = async (lobbyPassword, lobbyType = 'pug', matchzyOwnerAdmin = false) => {
    setShowCreateModal(false);
    setCreating(true);
    setError(null);
    try {
      const lobby = await createLobby(null, lobbyPassword, lobbyType, matchzyOwnerAdmin);
      navigate(`/pug/${lobby.id}`);
    } catch (e) {
      setError(e.message);
      setCreating(false);
    }
  };

  const handleJoin = async (lobbyId, hasPassword) => {
    if (!auth.steamId) { auth.login('/pug'); return; }
    if (hasPassword) {
      setPasswordModal({ lobbyId });
      return;
    }
    doJoin(lobbyId, null);
  };

  const doJoin = async (lobbyId, lobbyPassword) => {
    setPasswordModal(null);
    setJoining(lobbyId);
    setError(null);
    try {
      await joinLobby(lobbyId, null, lobbyPassword);
      navigate(`/pug/${lobbyId}`);
    } catch (e) {
      setError(e.message);
      setJoining(null);
    }
  };

  return (
    <div className="app">
      <div className="scanlines" />
      <div className="grid-bg" />
      <div className="glow-orb" />

      <header className="header">
        <div className="header-left">
          <div className="logo-hex" />
          <div>
            <div className={`header-title ${lobbyTypeFromUrl === 'squad' ? 'header-title--squad' : 'header-title--pug'}`}>
              {lobbyTypeFromUrl === 'squad' ? 'SQUAD' : 'MIX'}
            </div>
            <div className="header-sub">
              {lobbyTypeFromUrl === 'squad' ? 'PARTIDAS POR TIME' : 'LOBBIES PUG'}
            </div>
          </div>
        </div>
        <HamburgerNav
          activePath="/pug"
          auth={auth}
          profile={profile}
          returnTo={
            lobbyTypeFromUrl === 'squad'
              ? '/pug?lobbyType=squad'
              : lobbyTypeFromUrl === 'snaparena'
                ? '/pug?lobbyType=snaparena'
                : lobbyTypeFromUrl === 'snaphack'
                  ? '/pug?lobbyType=snaphack'
                  : '/pug'
          }
        />
      </header>

      <main className="pug-list-main">
        <div className="pug-list-toggle-bar">
          <div className="pug-mode-tabs" role="tablist" aria-label="Tipo de lobby">
            {[
              { id: 'pug', label: 'PUG / MIX', path: '/pug', title: 'Partidas 5v5 padrão' },
              { id: 'snaphack', label: 'SnapHack', path: '/pug?lobbyType=snaphack', title: 'Hacks aleatórios por round' },
              { id: 'snaparena', label: 'SnapArena', path: '/pug?lobbyType=snaparena', title: '1x1 / engine custom e cartas' },
              { id: 'squad', label: 'Squad', path: '/pug?lobbyType=squad', title: 'Partidas por time Squad' },
            ].map((tab) => (
              <TrackedButton
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={lobbyTypeFromUrl === tab.id}
                title={tab.title}
                className={`pug-mode-tab pug-mode-tab--${tab.id} ${lobbyTypeFromUrl === tab.id ? 'pug-mode-tab--active' : ''}`}
                onClick={() => navigate(tab.path)}
              >
                {tab.label}
              </TrackedButton>
            ))}
          </div>
        </div>

        <div className={`pug-list-hero ${
          lobbyTypeFromUrl === 'squad'
            ? 'pug-list-hero--squad'
            : lobbyTypeFromUrl === 'snaphack'
              ? 'pug-list-hero--snaphack'
              : lobbyTypeFromUrl === 'snaparena'
                ? 'pug-list-hero--snaparena'
              : 'pug-list-hero--pug'
        }`}>
          <h1 className="pug-list-title">
            {lobbyTypeFromUrl === 'squad'
              ? 'PARTIDAS SQUAD'
              : lobbyTypeFromUrl === 'snaphack'
                ? 'SNAPHACK ARENA'
                : lobbyTypeFromUrl === 'snaparena'
                  ? 'SNAPARENA'
                : 'MIX PUG'}
          </h1>
          <p className="pug-list-subtitle">
            {lobbyTypeFromUrl === 'squad'
              ? 'Times 5x5 · Crie ou entre em partidas de squad'
              : lobbyTypeFromUrl === 'snaphack'
                ? 'Modo caótico 5x5 · Hacks aleatórios a cada round'
                : lobbyTypeFromUrl === 'snaparena'
                  ? 'Modo 1x1 · Engine custom com regras e cartas'
                : 'Partidas competitivas 5x5 · Crie ou entre em lobbies PUG'}
          </p>
        </div>

        {error && (
          <div className="pug-error">
            <span className="pug-error-icon">!</span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="pug-list-center pug-state-wrap">
            <div className="spinner" />
            <span>Carregando {lobbyTypeFromUrl === 'squad' ? 'partidas Squad' : 'lobbies'}...</span>
          </div>
        ) : (
          <div className="pug-list-center">
            {!auth.steamId ? (
              <div className="pug-unified-card pug-unified-login">
                <div className="pug-unified-icon">⚔</div>
                <h3 className="pug-unified-title">Entre para jogar</h3>
                <p className="pug-unified-desc">Faça login com Steam para criar lobbies, participar de partidas e subir no ranking.</p>
                <TrackedButton type="button" className="steam-login-btn" onClick={() => auth.login('/pug')}>
                  <span className="steam-login-icon" />
                  ENTRAR COM STEAM
                </TrackedButton>
              </div>
            ) : filteredLobbies.length === 0 ? (
              <div className="pug-unified-card pug-unified-empty">
                <div className="pug-unified-icon">
                  {lobbyTypeFromUrl === 'squad' ? '👥' : lobbyTypeFromUrl === 'snaphack' ? '🔥' : lobbyTypeFromUrl === 'snaparena' ? '🃏' : '🎯'}
                </div>
                <h3 className="pug-unified-title">
                  {lobbyTypeFromUrl === 'squad'
                    ? 'Nenhuma partida Squad aberta'
                    : lobbyTypeFromUrl === 'snaphack'
                      ? 'Nenhuma sala SnapHack aberta'
                      : lobbyTypeFromUrl === 'snaparena'
                        ? 'Nenhuma sala SnapArena aberta'
                        : 'Nenhum lobby PUG aberto'}
                </h3>
                <p className="pug-unified-desc">
                  {lobbyTypeFromUrl === 'squad'
                    ? 'Seja o primeiro! Crie uma partida Squad e desafie outro time.'
                    : lobbyTypeFromUrl === 'snaphack'
                      ? 'Seja o primeiro! Crie uma sala SnapHack Arena e cause o caos.'
                      : lobbyTypeFromUrl === 'snaparena'
                        ? 'Seja o primeiro! Crie uma sala SnapArena e jogue 1x1 com engine custom.'
                        : 'Seja o primeiro! Crie um lobby PUG e chame seus amigos.'}
                </p>
                {lobbyTypeFromUrl === 'squad' && profile?.profile != null && !profile.profile.isVip ? (
                  <div className="pug-vip-gate">
                    <div className="pug-vip-gate-crown" aria-hidden>👑</div>
                    <h4 className="pug-vip-gate-title">Criação de lobbies é exclusiva para VIP</h4>
                    <p className="pug-vip-gate-desc">
                      {lobbyTypeFromUrl === 'snaparena'
                        ? 'Assine o VIP para criar salas SnapArena (AllstarsMatchzy), subir de nível e aparecer no ranking.'
                        : lobbyTypeFromUrl === 'snaphack'
                          ? 'Assine o VIP para criar salas SnapHack, subir de nível e aparecer no ranking.'
                          : 'Assine o VIP para criar suas salas MIX, subir de nível e aparecer no ranking.'}
                    </p>
                    <LevelUpPreview />
                    <Link to="/profile" className="pug-btn pug-btn-vip-cta">QUERO SER VIP</Link>
                    <TrackedButton
                      type="button"
                      className="pug-btn pug-btn-create pug-btn-create--disabled"
                      disabled
                      title="Requer VIP"
                    >
                      {lobbyTypeFromUrl === 'squad'
                        ? 'CRIAR PARTIDA SQUAD (VIP)'
                        : lobbyTypeFromUrl === 'snaphack'
                          ? 'CRIAR SALA SNAPHACK (VIP)'
                          : lobbyTypeFromUrl === 'snaparena'
                            ? 'CRIAR SALA SNAPARENA (VIP)'
                            : 'CRIAR LOBBY (VIP)'}
                    </TrackedButton>
                  </div>
                ) : (
                  <TrackedButton
                    type="button"
                    className="pug-btn pug-btn-create"
                    onClick={handleCreateClick}
                    disabled={creating || (myLobbyId && myLobbyType && myLobbyType !== lobbyTypeFromUrl)}
                    title={lobbyTypeFromUrl === 'snaphack'
                      ? 'Modo caótico com hacks aleatórios a cada round'
                      : lobbyTypeFromUrl === 'snaparena'
                        ? 'Modo arena 1x1 com controle total de rounds'
                        : undefined}
                  >
                    {creating
                      ? 'CRIANDO...'
                      : (myLobbyId && myLobbyType && myLobbyType === lobbyTypeFromUrl)
                        ? 'VER MINHA SALA'
                        : (myLobbyId && myLobbyType && myLobbyType !== lobbyTypeFromUrl)
                          ? 'JÁ TEM UMA SALA ABERTA'
                          : (lobbyTypeFromUrl === 'squad'
                            ? 'CRIAR PARTIDA SQUAD'
                            : lobbyTypeFromUrl === 'snaphack'
                              ? 'CRIAR SALA SNAPHACK'
                              : lobbyTypeFromUrl === 'snaparena'
                                ? 'CRIAR SALA SNAPARENA'
                                : 'CRIAR LOBBY PUG')}
                  </TrackedButton>
                )}
              </div>
            ) : (
              <>
                {(lobbyTypeFromUrl !== 'squad' || profile?.profile?.isVip) && (
                  <div className="pug-list-create-row">
                    <TrackedButton
                      type="button"
                      className="pug-btn pug-btn-create"
                      onClick={handleCreateClick}
                      disabled={creating || (myLobbyId && myLobbyType && myLobbyType !== lobbyTypeFromUrl)}
                      title={lobbyTypeFromUrl === 'snaphack'
                        ? 'Modo caótico com hacks aleatórios a cada round'
                        : lobbyTypeFromUrl === 'snaparena'
                          ? 'Modo arena 1x1 com controle total de rounds'
                          : undefined}
                    >
                      {creating
                        ? 'CRIANDO...'
                        : (myLobbyId && myLobbyType && myLobbyType === lobbyTypeFromUrl)
                          ? 'VER MINHA SALA'
                          : (myLobbyId && myLobbyType && myLobbyType !== lobbyTypeFromUrl)
                            ? 'JÁ TEM UMA SALA ABERTA'
                            : (lobbyTypeFromUrl === 'squad'
                              ? 'CRIAR PARTIDA SQUAD'
                              : lobbyTypeFromUrl === 'snaphack'
                                ? 'CRIAR SALA SNAPHACK'
                                : lobbyTypeFromUrl === 'snaparena'
                                  ? 'CRIAR SALA SNAPARENA'
                                  : 'CRIAR LOBBY PUG')}
                    </TrackedButton>
                  </div>
                )}
                <div className="pug-list-grid">
                  {filteredLobbies.map((lobby) => (
                    <LobbyCard key={lobby.id} lobby={lobby} onJoin={handleJoin} joining={joining} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>
      {auth.steamId && (
        <LevelProgressFloatingModal
          level={profile.profile?.level ?? 1}
          points={profile.profile?.points ?? 0}
        />
      )}

      {showCreateModal && (
        <CreateModal
          onConfirm={handleCreateConfirm}
          onCancel={() => setShowCreateModal(false)}
          isVip={Boolean(profile.profile?.isVip)}
          lobbyType={lobbyTypeFromUrl}
        />
      )}
      {passwordModal && (
        <PasswordModal
          title="SALA COM SENHA"
          onConfirm={(pw) => doJoin(passwordModal.lobbyId, pw)}
          onCancel={() => setPasswordModal(null)}
        />
      )}

      <style>{`
        .pug-list-toggle-bar {
          display: flex;
          justify-content: center;
          padding: 10px 16px 0;
        }
        .pug-mode-tabs {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px;
          max-width: min(720px, 100%);
          padding: 6px;
          border-radius: 14px;
          background: rgba(15,23,42,0.92);
          border: 1px solid rgba(148,163,184,0.35);
          box-shadow: 0 8px 32px rgba(0,0,0,0.35);
        }
        .pug-mode-tab {
          flex: 1 1 auto;
          min-width: min(140px, 42vw);
          padding: 10px 12px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-family: var(--font-mono, monospace);
          border-radius: 10px;
          border: 1px solid transparent;
          background: rgba(30,41,59,0.6);
          color: rgba(148,163,184,0.95);
          cursor: pointer;
          transition: color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .pug-mode-tab:hover {
          color: #e2e8f0;
          border-color: rgba(245,166,35,0.35);
        }
        .pug-mode-tab--active {
          color: #0b1120;
          border-color: rgba(245,166,35,0.65);
          box-shadow: 0 0 20px rgba(245,166,35,0.35);
        }
        .pug-mode-tab--active.pug-mode-tab--pug {
          background: linear-gradient(135deg, #e8a020, #c4851a);
        }
        .pug-mode-tab--active.pug-mode-tab--snaphack {
          background: linear-gradient(135deg, #ef4444, #f59e0b);
          box-shadow: 0 0 20px rgba(239,68,68,0.35);
        }
        .pug-mode-tab--active.pug-mode-tab--snaparena {
          background: linear-gradient(135deg, #a855f7, #3b82f6);
          box-shadow: 0 0 20px rgba(59,130,246,0.35);
        }
        .pug-mode-tab--active.pug-mode-tab--squad {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          box-shadow: 0 0 20px rgba(34,197,94,0.35);
        }
        .pug-list-grid {
          animation: pug-grid-fade 0.25s ease;
        }
        @keyframes pug-grid-fade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 520px) {
          .pug-mode-tab { min-width: 44%; font-size: 9px; padding: 9px 8px; }
        }
      `}</style>
      <PoolTestPanel onOpenLobby={(id) => navigate(`/pug/${id}`)} />

      <style>{`
        .pug-list-main {
          flex: 1;
          padding: 0 40px 80px;
          position: relative;
          z-index: 10;
        }

        /* ── Hero ── */
        .pug-list-hero {
          text-align: center;
          padding: 60px 20px 48px;
        }
        .pug-list-hero--squad .pug-list-title {
          color: #fff;
          text-shadow: 0 0 40px rgba(34, 197, 94, 0.15);
        }
        .pug-list-hero--squad .pug-list-subtitle {
          color: rgba(34, 197, 94, 0.85);
        }
        .pug-list-hero--snaphack .pug-list-title {
          color: #fff;
          text-shadow: 0 0 40px rgba(239, 68, 68, 0.16);
        }
        .pug-list-hero--snaphack .pug-list-subtitle {
          color: rgba(245, 158, 11, 0.9);
        }
        .pug-list-hero--snaparena .pug-list-title {
          color: #fff;
          text-shadow: 0 0 40px rgba(167, 139, 250, 0.18);
        }
        .pug-list-hero--snaparena .pug-list-subtitle {
          color: rgba(59, 130, 246, 0.9);
        }
        .header-title--squad { color: var(--green); }
        .header-sub { font-size: 11px; letter-spacing: 2px; color: var(--text-dim); }
        .pug-list-title {
          font-family: var(--font-head);
          font-size: 56px;
          letter-spacing: 8px;
          color: #fff;
          line-height: 1;
          text-shadow: 0 0 40px rgba(245, 166, 35, 0.1);
          animation: pug-title-shine 4s ease-in-out infinite;
        }
        @keyframes pug-title-shine {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; text-shadow: 0 0 60px rgba(245, 166, 35, 0.2); }
        }
        .pug-list-subtitle {
          font-family: var(--font-mono);
          font-size: 13px;
          letter-spacing: 3px;
          color: var(--text-dim);
          margin-top: 12px;
        }
        .pug-btn-create {
          margin-top: 28px;
          padding: 14px 44px;
          font-size: 14px;
          letter-spacing: 3px;
          background: linear-gradient(135deg, var(--gold), var(--gold-dim));
          color: #0a0a0a;
          border: 1px solid rgba(245, 166, 35, 0.5);
          font-weight: 700;
          text-transform: uppercase;
          box-shadow: 0 0 30px rgba(245, 166, 35, 0.1);
          transition: all 0.2s;
        }
        .pug-btn-create:hover:not(:disabled) {
          filter: brightness(1.12);
          box-shadow: 0 0 40px rgba(245, 166, 35, 0.25);
          transform: translateY(-1px);
        }

        /* ── Hero unificado ── */
        .pug-hero-unified {
          margin-top: 28px;
          padding: 36px 48px;
          background: linear-gradient(135deg, rgba(245, 166, 35, 0.08) 0%, rgba(245, 166, 35, 0.02) 100%);
          border: 1px solid rgba(245, 166, 35, 0.25);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          animation: pug-hero-glow 3s ease-in-out infinite;
        }
        @keyframes pug-hero-glow {
          0%, 100% { box-shadow: 0 0 24px rgba(245, 166, 35, 0.1); }
          50% { box-shadow: 0 0 48px rgba(245, 166, 35, 0.2); }
        }
        .pug-hero-login .pug-hero-icon {
          font-size: 56px;
          animation: pug-hero-icon-float 2s ease-in-out infinite;
        }
        @keyframes pug-hero-icon-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.05); }
        }
        .pug-hero-text {
          font-family: var(--font-body);
          font-size: 16px;
          color: var(--text-dim);
          letter-spacing: 1px;
          margin: 0;
          text-align: center;
          max-width: 360px;
        }
        .pug-hero-actions {
          padding: 24px 40px;
        }

        /* ── Centro único (um componente no meio) ── */
        .pug-list-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 0 24px 80px;
          max-width: 520px;
          margin: 0 auto;
          width: 100%;
        }
        .pug-list-center .pug-list-grid {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        .pug-state-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-mono);
          font-size: 13px;
          letter-spacing: 2px;
          color: var(--text-dim);
        }
        .pug-list-create-row {
          margin-bottom: 24px;
        }
        /* ── VIP gate (só VIP cria) ── */
        .pug-vip-gate {
          margin-top: 28px;
          padding: 28px 24px;
          background: linear-gradient(135deg, rgba(245, 166, 35, 0.12) 0%, rgba(245, 166, 35, 0.04) 100%);
          border: 1px solid rgba(245, 166, 35, 0.35);
          border-radius: 12px;
          text-align: center;
          width: 100%;
          box-shadow: 0 0 40px rgba(245, 166, 35, 0.15);
        }
        .pug-vip-gate-crown {
          font-size: 52px;
          line-height: 1;
          margin-bottom: 12px;
          filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.6));
          animation: pug-crown-pulse 2s ease-in-out infinite;
        }
        @keyframes pug-crown-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.95; }
        }
        .pug-vip-gate-title {
          font-family: var(--font-head);
          font-size: 18px;
          letter-spacing: 4px;
          color: var(--gold);
          margin: 0 0 10px;
          text-transform: uppercase;
        }
        .pug-vip-gate-desc {
          font-size: 13px;
          color: var(--text-dim);
          line-height: 1.5;
          margin: 0 0 20px;
          max-width: 320px;
          margin-left: auto;
          margin-right: auto;
        }
        .pug-vip-gate-level-teaser {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
          padding: 10px 20px;
          background: rgba(0,0,0,0.25);
          border-radius: 8px;
          font-family: var(--font-mono);
        }
        .pug-vip-gate-lvl {
          font-size: 10px;
          letter-spacing: 3px;
          color: var(--text-mute);
        }
        .pug-vip-gate-lvl-num {
          font-size: 22px;
          font-weight: 700;
          color: var(--gold);
          min-width: 36px;
        }
        .pug-vip-gate-wins {
          font-size: 12px;
          color: var(--green);
          margin-left: 8px;
        }
        .pug-btn-vip-cta {
          display: inline-block;
          padding: 12px 28px;
          margin-bottom: 14px;
          font-size: 13px;
          letter-spacing: 2px;
          background: linear-gradient(135deg, var(--gold), var(--gold-dim));
          color: #0a0a0a;
          border: none;
          border-radius: 6px;
          font-weight: 700;
          text-decoration: none;
          text-transform: uppercase;
          transition: all 0.2s;
          box-shadow: 0 0 24px rgba(245, 166, 35, 0.25);
        }
        .pug-btn-vip-cta:hover {
          filter: brightness(1.1);
          box-shadow: 0 0 32px rgba(245, 166, 35, 0.35);
          transform: translateY(-1px);
        }
        .pug-btn-create--disabled {
          opacity: 0.6;
          cursor: not-allowed;
          margin-top: 8px;
        }
        /* ── Unified cards (login + empty) ── */
        .pug-list-unified {
          max-width: 480px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .pug-unified-card {
          background: linear-gradient(135deg, #10121a 0%, #151820 50%, #11131c 100%);
          border: 1px solid rgba(245, 166, 35, 0.15);
          border-radius: 10px;
          padding: 48px 36px;
          text-align: center;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
        }
        .pug-unified-icon {
          font-size: 48px;
          margin-bottom: 20px;
          opacity: 0.85;
          animation: pug-unified-pulse 2.5s ease-in-out infinite;
        }
        @keyframes pug-unified-pulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        .pug-unified-title {
          font-family: var(--font-head);
          font-size: 22px;
          letter-spacing: 3px;
          color: var(--gold);
          margin: 0 0 12px;
        }
        .pug-unified-desc {
          font-family: var(--font-body);
          font-size: 15px;
          color: var(--text-dim);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .steam-login-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, #1b2838 0%, #2a475e 50%, #1b2838 100%);
          border: 1px solid #66c0f4;
          color: #c7d5e0;
          padding: 14px 28px;
          border-radius: 6px;
          font-family: var(--font-mono);
          font-size: 13px;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .steam-login-btn:hover {
          background: linear-gradient(135deg, #2a475e 0%, #1b2838 100%);
          color: #fff;
          border-color: #8bb4d4;
          box-shadow: 0 0 20px rgba(102, 192, 244, 0.3);
          transform: translateY(-1px);
        }
        .steam-login-icon {
          display: inline-block;
          width: 22px;
          height: 22px;
          background: url('https://store.steampowered.com/favicon.ico') center/contain no-repeat;
          opacity: 0.95;
        }

        /* ── Empty state (legacy) ── */
        .pug-list-empty {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-dim);
        }
        .pug-list-empty-icon {
          font-size: 56px;
          margin-bottom: 16px;
          opacity: 0.7;
          animation: pug-empty-icon-pulse 2s ease-in-out infinite;
        }
        @keyframes pug-empty-icon-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 0.9; }
        }
        .pug-list-empty p {
          font-family: var(--font-body);
          font-size: 16px;
          letter-spacing: 1px;
        }
        .pug-list-empty-hint {
          margin-top: 8px;
          font-size: 13px !important;
          color: var(--text-mute);
        }

        /* ── Grid ── */
        .pug-list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
          max-width: 1100px;
          margin: 0 auto;
        }

        /* ── Card ── */
        .pug-list-card {
          background: linear-gradient(135deg, #10121a 0%, #151820 50%, #11131c 100%);
          border: 1px solid rgba(245, 166, 35, 0.1);
          border-left: 4px solid rgba(245, 166, 35, 0.3);
          border-radius: 6px;
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }
        .pug-list-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(245, 166, 35, 0.3), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .pug-list-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 50% at 0% 50%, rgba(245, 166, 35, 0.03), transparent 60%);
          pointer-events: none;
          z-index: 1;
        }
        .pug-list-card-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        .pug-list-card--map-bg::after {
          background: linear-gradient(135deg, rgba(6, 8, 14, 0.82) 0%, rgba(4, 6, 12, 0.88) 100%);
        }
        .pug-list-card > .pug-list-card-top,
        .pug-list-card > .pug-list-card-name,
        .pug-list-card > .pug-list-card-type,
        .pug-list-card > .pug-list-card-owner,
        .pug-list-card > .plc-live-score-row,
        .pug-list-card > .plc-teams-row,
        .pug-list-card > .pug-list-card-count,
        .pug-list-card > .pug-list-card-join {
          position: relative;
          z-index: 2;
        }
        .pug-list-card--map-bg .pug-list-card-name,
        .pug-list-card--map-bg .pug-list-card-type,
        .pug-list-card--map-bg .pug-list-card-owner,
        .pug-list-card--map-bg .pug-list-card-count,
        .pug-list-card--map-bg .plc-vs {
          text-shadow: 0 1px 4px rgba(0,0,0,0.8);
        }
        .pug-list-card--map-bg .plc-slot {
          background: rgba(0,0,0,0.35);
          border-color: rgba(255,255,255,0.15);
        }
        .pug-list-card--map-bg .pug-list-card-join {
          background: rgba(0,0,0,0.4);
          text-shadow: 0 1px 3px rgba(0,0,0,0.6);
        }
        .pug-list-card:hover {
          border-left-color: var(--gold);
          transform: translateX(4px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 30px rgba(245, 166, 35, 0.05);
        }
        .pug-list-card:hover::before { opacity: 1; }

        /* Card top row */
        .pug-list-card-top {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
        }
        .plc-mix-badge {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 1px;
          padding: 2px 6px;
          border-radius: 2px;
          background: rgba(245, 166, 35, 0.2);
          color: var(--gold);
          border: 1px solid rgba(245, 166, 35, 0.35);
        }
        .plc-squad-badge {
          background: rgba(34, 197, 94, 0.2);
          color: var(--green);
          border-color: rgba(34, 197, 94, 0.35);
        }
        .plc-snaphack-badge {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          border-color: rgba(239, 68, 68, 0.4);
        }
        .plc-snaparena-badge {
          background: rgba(59, 130, 246, 0.15);
          color: #93c5fd;
          border-color: rgba(59, 130, 246, 0.45);
        }
        .plc-lock {
          font-size: 12px;
          opacity: 0.6;
        }

        /* Status badge */
        .pug-list-status {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 2px;
          padding: 3px 10px;
          border-radius: 2px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .pug-list-status--waiting {
          color: var(--gold);
          background: rgba(245, 166, 35, 0.08);
          border: 1px solid rgba(245, 166, 35, 0.2);
        }
        .pug-list-status--full {
          color: var(--green);
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.2);
        }
        .pug-list-status--live {
          color: var(--red);
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          animation: pulse 2s ease-in-out infinite;
        }

        /* Card name / owner */
        .pug-list-card-name {
          font-family: var(--font-body);
          font-weight: 700;
          font-size: 17px;
          letter-spacing: 1px;
          color: #ddd;
          line-height: 1.2;
          transition: color 0.2s;
        }
        .pug-list-card:hover .pug-list-card-name { color: var(--gold); }
        .pug-list-card-owner {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-mute);
          letter-spacing: 1px;
          margin-top: -4px;
        }
        .pug-list-card-type {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 1.5px;
          margin: 2px 0 -4px;
        }
        .pug-list-card-type--pug { color: rgba(245, 166, 35, 0.9); }
        .pug-list-card-type--squad { color: rgba(34, 197, 94, 0.9); }
        .pug-list-card-type--snaphack { color: rgba(252, 165, 165, 0.95); }
        .pug-list-card-type--snaparena { color: rgba(147, 197, 253, 0.95); }

        /* ── Live score row ── */
        .plc-live-score-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0 4px;
        }
        .plc-live-score-center {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          justify-content: center;
        }
        .plc-live-score {
          font-family: var(--font-head);
          font-size: 28px;
          letter-spacing: 2px;
          color: #fff;
          font-weight: 700;
          text-shadow: 0 1px 4px rgba(0,0,0,0.7), 0 0 12px rgba(239, 68, 68, 0.4);
        }
        .plc-live-vs {
          font-family: var(--font-head);
          font-size: 16px;
          letter-spacing: 2px;
          color: var(--text-mute);
          text-shadow: 0 1px 3px rgba(0,0,0,0.6);
        }
        .plc-live-elapsed {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.7);
          padding: 3px 8px;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 3px;
          flex-shrink: 0;
        }

        /* ── Teams row ── */
        .plc-teams-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 0;
          position: relative;
          z-index: 1;
        }
        .plc-team-slots {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
          min-width: 0;
        }
        .plc-slot {
          height: 24px;
          border-radius: 3px;
          display: flex;
          align-items: center;
          padding: 0 8px;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: all 0.2s;
        }
        .plc-slot--filled {
          background: rgba(96, 165, 250, 0.15);
          border: 1px solid rgba(96, 165, 250, 0.35);
          color: #93bbfc;
        }
        .plc-slot--bot {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-mute);
          font-style: italic;
        }
        .plc-slot--empty {
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.06);
          min-height: 24px;
        }
        .plc-slot-lvl {
          margin-left: 4px;
          font-size: 10px;
          opacity: 0.85;
          color: var(--gold);
        }
        .plc-vs {
          font-family: var(--font-head);
          font-size: 16px;
          letter-spacing: 2px;
          color: var(--text-mute);
          padding: 0 4px;
          flex-shrink: 0;
        }

        .pug-list-card-count {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 2px;
          color: var(--text-dim);
          text-align: center;
        }

        /* Join button */
        .pug-list-card-join {
          margin-top: auto;
          padding: 10px 20px;
          font-size: 12px;
          letter-spacing: 2px;
          background: transparent;
          color: var(--gold);
          border: 1px solid rgba(245, 166, 35, 0.3);
          transition: all 0.2s;
        }
        .pug-list-card-join:hover:not(:disabled) {
          background: var(--gold-glow);
          border-color: var(--gold);
          box-shadow: 0 0 16px rgba(245, 166, 35, 0.1);
        }
        .pug-list-card-join:disabled {
          color: var(--text-mute);
          border-color: var(--border);
        }

        /* ── Modal ── */
        .plc-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }
        .plc-modal {
          background: linear-gradient(135deg, #151820 0%, #10121a 100%);
          border: 1px solid rgba(245, 166, 35, 0.18);
          border-radius: 8px;
          padding: 32px;
          min-width: 340px;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          box-shadow: 0 0 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 166, 35, 0.04);
        }
        .plc-modal-title {
          font-family: var(--font-head);
          font-size: 24px;
          letter-spacing: 4px;
          color: #fff;
          text-align: center;
        }
        .plc-modal-input {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(245, 166, 35, 0.2);
          border-radius: 4px;
          padding: 12px 14px;
          font-family: var(--font-mono);
          font-size: 14px;
          letter-spacing: 1px;
          color: var(--text);
          outline: none;
          transition: border-color 0.2s;
        }
        .plc-modal-input:focus {
          border-color: var(--gold);
        }
        .plc-modal-input::placeholder {
          color: var(--text-mute);
        }
        .plc-modal-check {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 1px;
          color: var(--text-dim);
          cursor: pointer;
        }
        .plc-modal-field { margin-bottom: 8px; }
        .plc-modal-label {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 1px;
          color: var(--text-mute);
          display: block;
          margin-bottom: 8px;
        }
        .plc-modal-type-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .plc-modal-type-label {
          font-size: 12px;
          color: var(--text-dim);
        }
        .plc-modal-type-btn {
          padding: 6px 14px;
          font-size: 12px;
        }
        .plc-modal-type-btn--active {
          background: rgba(245, 166, 35, 0.25);
          color: var(--gold);
          border-color: rgba(245, 166, 35, 0.5);
        }
        .plc-modal-hint {
          font-size: 12px;
          color: var(--text-mute);
          margin-bottom: 12px;
        }
        .plc-modal-hint a { color: var(--accent); text-decoration: underline; }
        .plc-modal-radio {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--text-dim);
          cursor: pointer;
        }
        .plc-modal-radio input { accent-color: var(--gold); }
        .plc-modal-radio:has(input:disabled) { opacity: 0.6; cursor: not-allowed; }
        .plc-modal-vip-hint {
          font-size: 12px;
          color: var(--gold);
          margin-top: 8px;
        }
        .plc-modal-vip-hint a { color: var(--gold); text-decoration: underline; }
        .plc-modal-type-desc {
          font-size: 11px;
          color: var(--text-mute);
          margin-bottom: 8px;
        }
        .plc-modal-snaparena-lead {
          font-size: 12px;
          line-height: 1.5;
          color: rgba(186, 230, 253, 0.92);
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.28);
          border-radius: 10px;
          padding: 12px 14px;
          margin: 0 0 14px;
        }
        .plc-modal-snaparena-lead strong { color: #e0f2fe; }
        .plc-modal-snaparena-warn {
          font-size: 11px;
          line-height: 1.45;
          color: rgba(254, 215, 170, 0.95);
          background: rgba(234, 88, 12, 0.12);
          border: 1px solid rgba(251, 146, 60, 0.35);
          border-radius: 10px;
          padding: 10px 12px;
          margin: 0 0 14px;
        }
        .plc-modal-snaparena-warn strong { color: #ffedd5; }
        .plc-modal-radio--disabled { opacity: 0.7; cursor: not-allowed; }
        .plc-modal-check input[type="checkbox"] {
          accent-color: var(--gold);
          width: 16px;
          height: 16px;
        }
        .plc-modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .pug-list-main { padding: 0 16px 60px; }
          .pug-list-hero { padding: 36px 12px 32px; }
          .pug-list-title { font-size: 36px; letter-spacing: 4px; }
          .pug-list-grid { grid-template-columns: 1fr; }
          .plc-slot { height: 22px; font-size: 9px; padding: 0 6px; }
        }

        /* ── Pool Test Panel ── */
        .pool-test-panel {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          background: linear-gradient(135deg, #0d0f16 0%, #141722 100%);
          border-top: 1px solid rgba(245, 166, 35, 0.25);
          font-family: var(--font-mono);
        }
        .pool-test-toggle {
          width: 100%;
          padding: 8px 20px;
          background: none;
          border: none;
          color: var(--gold);
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 2px;
          cursor: pointer;
          text-align: left;
        }
        .pool-test-toggle:hover { background: rgba(245, 166, 35, 0.05); }
        .pool-test-content {
          padding: 12px 20px 16px;
          max-height: 360px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pool-test-summary {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .pool-chip {
          padding: 3px 10px;
          border-radius: 3px;
          font-size: 10px;
          letter-spacing: 1.5px;
          background: rgba(255,255,255, 0.06);
          color: var(--text-dim);
          border: 1px solid rgba(255,255,255, 0.1);
        }
        .pool-chip--idle { color: #22c55e; border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.08); }
        .pool-chip--running { color: #ef4444; border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.08); }
        .pool-chip--dynamic { color: #a78bfa; border-color: rgba(167,139,250,0.3); background: rgba(167,139,250,0.08); }

        .pool-test-instances {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .pool-inst {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .pool-inst--idle { border-color: rgba(34,197,94,0.25); }
        .pool-inst--running { border-color: rgba(239,68,68,0.25); }
        .pool-inst--reserved { border-color: rgba(245,166,35,0.25); }
        .pool-inst-id { color: var(--text-dim); }
        .pool-inst-port { color: var(--text-mute); }
        .pool-inst-status { font-weight: 700; letter-spacing: 1px; }
        .pool-inst-status--idle { color: #22c55e; }
        .pool-inst-status--running { color: #ef4444; }
        .pool-inst-status--reserved { color: var(--gold); }
        .pool-inst-status--starting { color: #60a5fa; }
        .pool-inst-tag {
          padding: 1px 6px;
          border-radius: 2px;
          font-size: 9px;
          letter-spacing: 1px;
          color: #a78bfa;
          background: rgba(167,139,250,0.12);
          border: 1px solid rgba(167,139,250,0.25);
        }

        .pool-test-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pool-test-btn {
          padding: 8px 16px !important;
          font-size: 11px !important;
          letter-spacing: 1.5px !important;
        }
        .pool-test-result {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 4px;
          padding: 10px 14px;
          font-size: 11px;
          color: var(--text-dim);
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 180px;
          overflow-y: auto;
        }
        .pool-test-lobby-box {
          background: rgba(34, 197, 94, 0.06);
          border: 1px solid rgba(34, 197, 94, 0.25);
          border-radius: 6px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pool-test-lobby-title {
          font-size: 12px;
          letter-spacing: 1.5px;
          color: #22c55e;
          font-weight: 600;
        }
        .pool-test-open-btn {
          align-self: flex-start;
          padding: 8px 20px !important;
          font-size: 11px !important;
          letter-spacing: 2px !important;
        }
        .pool-test-connect-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pool-test-connect-code {
          flex: 1;
          min-width: 0;
          font-size: 11px;
          color: var(--text-dim);
          background: rgba(0,0,0,0.3);
          padding: 8px 10px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.06);
          word-break: break-all;
        }
        .pool-test-copy-btn {
          flex-shrink: 0;
          padding: 6px 12px !important;
          font-size: 10px !important;
        }
      `}</style>
    </div>
  );
}
