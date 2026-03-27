import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { HamburgerNav } from '../components/HamburgerNav';
import { getLobby, joinLobby, leaveLobby, resetLobby, getConnectInfo } from '../services/pugService';
import { getApiBaseUrl } from '../utils/apiBase';
import '../index.css';
import { TrackedButton } from '../components/TrackedButton';

const POLL_MS = 2000;
const SLOTS_PER_TEAM = 5;

function PlayerSlot({ player, index, isYou }) {
  return (
    <div className={`pug-slot ${player ? 'filled' : 'empty'}`}>
      <span className="pug-slot-index">{index + 1}</span>
      {player ? (
        <span className={`pug-slot-name ${isYou ? 'you' : ''}`}>
          {player.displayName || `Jogador ${String(player.steamId).slice(-6)}`}
          {isYou && <span className="pug-slot-you-badge">VOCÊ</span>}
        </span>
      ) : (
        <span className="pug-slot-empty">Aguardando...</span>
      )}
    </div>
  );
}

function TeamPanel({ side, players, mySteamId }) {
  const label = side === 'A' ? 'TIME A' : 'TIME B';
  const slots = Array.from({ length: SLOTS_PER_TEAM }, (_, i) => players[i] || null);
  return (
    <div className={`pug-team-panel pug-team-${side.toLowerCase()}`}>
      <div className="pug-team-header">
        <span className="pug-team-label">{label}</span>
        <span className="pug-team-count">{players.length}/{SLOTS_PER_TEAM}</span>
      </div>
      <div className="pug-team-slots">
        {slots.map((player, i) => (
          <PlayerSlot
            key={i}
            player={player}
            index={i}
            isYou={player && mySteamId && String(player.steamId) === String(mySteamId)}
          />
        ))}
      </div>
    </div>
  );
}

export default function PugPage() {
  const auth = useAuth();
  const profile = useProfile();
  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectInfo, setConnectInfo] = useState(null);
  const [serverInfoIp, setServerInfoIp] = useState(null);
  const [fillWithBots, setFillWithBots] = useState(true);
  const [serverReady, setServerReady] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const fetchLobby = useCallback(async () => {
    try {
      const data = await getLobby();
      setLobby(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLobby();
    const t = setInterval(fetchLobby, POLL_MS);
    return () => clearInterval(t);
  }, [fetchLobby]);

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

  const SERVER_PREP_SECONDS = 8;
  useEffect(() => {
    if (lobby?.status !== 'full') {
      setServerReady(false);
      setCountdown(0);
      return;
    }
    if (serverReady) return;
    setCountdown(SERVER_PREP_SECONDS);
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
  }, [lobby?.status]);

  const handleJoin = async () => {
    if (!auth.steamId) {
      auth.login('/pug');
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const data = await joinLobby(null, fillWithBots);
      setLobby(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const data = await leaveLobby();
      setLobby(data);
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
      const data = await resetLobby();
      setLobby(data.lobby || data);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const inLobby = lobby && auth.steamId && [...(lobby.teamA || []), ...(lobby.teamB || [])].some((p) => String(p.steamId) === String(auth.steamId));
  const isFull = lobby?.status === 'full';
  const total = lobby ? (lobby.teamA?.length || 0) + (lobby.teamB?.length || 0) : 0;
  const maxTotal = lobby?.maxTotal ?? 10;

  const connectHost = connectInfo?.host || serverInfoIp || '';
  const connectPort = connectInfo?.port || '27017';
  const connectStr = lobby?.password && connectHost
    ? `connect ${connectHost}:${connectPort}; password ${lobby.password}`
    : lobby?.connect || null;

  const handleCopyConnect = () => {
    if (connectStr) navigator.clipboard.writeText(connectStr);
  };

  const handleOpenInCs2 = () => {
    if (!connectHost || !lobby?.password) return;
    window.location.href = `steam://connect/${connectHost}:${connectPort}`;
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
            <div className="header-title">PUG</div>
            <div className="header-sub">COMPETITIVO 5×5</div>
          </div>
        </div>
        <HamburgerNav activePath="/pug" auth={auth} profile={profile} returnTo="/pug" />
      </header>

      <main className="pug-main">
        {loading && !lobby && (
          <div className="pug-state">
            <div className="spinner" />
            <span>Carregando lobby...</span>
          </div>
        )}

        {error && (
          <div className="pug-error">
            <span className="pug-error-icon">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {lobby && (
          <>
            <div className="pug-status-bar">
              <span className={`pug-status pug-status-${lobby.status}`}>
                {lobby.status === 'waiting' && (total < maxTotal ? 'AGUARDANDO JOGADORES' : 'PRONTO')}
                {lobby.status === 'full' && 'LOBBY COMPLETO — PRONTO PARA CONECTAR'}
              </span>
              <span className="pug-count">
                {total}/{maxTotal} JOGADORES
              </span>
            </div>

            <div className="pug-arena">
              <TeamPanel side="A" players={lobby.teamA || []} mySteamId={auth.steamId} />
              <div className="pug-center">
                <div className="pug-vs">VS</div>
                {lobby.status === 'waiting' && (
                  <div className="pug-actions">
                    {!inLobby && (
                      <label className="pug-fill-bots">
                        <input
                          type="checkbox"
                          checked={fillWithBots}
                          onChange={(e) => setFillWithBots(e.target.checked)}
                        />
                        <span>Preencher com 9 bots (teste)</span>
                      </label>
                    )}
                    {!inLobby ? (
                      <TrackedButton
                        className="pug-btn pug-btn-primary"
                        onClick={handleJoin}
                        disabled={actionLoading || total >= maxTotal}
                      >
                        {actionLoading ? '...' : 'ENTRAR NO LOBBY'}
                      </TrackedButton>
                    ) : (
                      <TrackedButton
                        className="pug-btn pug-btn-secondary"
                        onClick={handleLeave}
                        disabled={actionLoading}
                      >
                        SAIR DO LOBBY
                      </TrackedButton>
                    )}
                    {total > 0 && (
                      <TrackedButton
                        className="pug-btn pug-btn-danger"
                        onClick={handleReset}
                        disabled={actionLoading}
                      >
                        LIMPAR LOBBY
                      </TrackedButton>
                    )}
                    {!auth.steamId && (
                      <p className="pug-login-hint">Faça login com Steam para entrar no lobby.</p>
                    )}
                  </div>
                )}
                {lobby.status === 'full' && (
                  <div className="pug-connect-box">
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
                        Configure PUG_SERVER_IP no backend (ou use o IP do servidor) e a senha: <strong>{lobby.password}</strong>
                      </p>
                    )}
                    <TrackedButton
                      className="pug-btn pug-btn-danger"
                      onClick={handleReset}
                      disabled={actionLoading}
                      style={{ marginTop: '1rem' }}
                    >
                      LIMPAR LOBBY
                    </TrackedButton>
                  </div>
                )}
              </div>
              <TeamPanel side="B" players={lobby.teamB || []} mySteamId={auth.steamId} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
