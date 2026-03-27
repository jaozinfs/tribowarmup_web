import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useServerInfo } from '../hooks/useServerInfo';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { HamburgerNav } from '../components/HamburgerNav';
import { createVipWarmup, pingVipWarmup } from '../services/warmupVipService';
import '../index.css';
import { TrackedButton } from '../components/TrackedButton';

function PlayerBar({ players, maxPlayers }) {
  if (players === null) return (
    <div className="playerbar-track">
      <div className="playerbar-unknown" />
    </div>
  );
  const pct = Math.min((players / maxPlayers) * 100, 100);
  const cls = pct > 80 ? 'red' : pct > 50 ? 'yellow' : 'green';
  return (
    <div className="playerbar-track">
      <div className={`playerbar-fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function PingBadge({ ping }) {
  if (ping === null) return <span className="ping unknown">—</span>;
  const cls = ping < 20 ? 'green' : ping < 60 ? 'yellow' : 'red';
  return (
    <span className={`ping ${cls}`}>
      <span className="ping-dot" />
      {ping}ms
    </span>
  );
}

function Tag({ label }) {
  return <span className="tag">{label}</span>;
}

function getMapImageSlug(mapName) {
  if (!mapName || typeof mapName !== 'string') return null;
  // workshop/3437809122/de_cache -> de_cache para ícone/background
  const base = mapName.includes('/') ? mapName.split('/').pop() : mapName;
  return base
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/\.(jpg|jpeg|png|webp)$/i, '');
}

function ServerRow({ server, onCopy, onConnect, copied }) {
  const [expanded, setExpanded] = useState(false);
  const [privatePassword, setPrivatePassword] = useState('');
  const [privateUnlocked, setPrivateUnlocked] = useState(false);
  const isPrivate = Boolean(server.hasPassword);
  const connectStr = isPrivate && privateUnlocked && privatePassword
    ? `connect ${server.ip}:${server.port}; password ${privatePassword}`
    : `connect ${server.ip}:${server.port}`;
  const steamConnectUrl = isPrivate && privateUnlocked && privatePassword
    ? `steam://connect/${server.ip}:${server.port}/${privatePassword}`
    : `steam://connect/${server.ip}:${server.port}`;
  const canConnect = !isPrivate || (privateUnlocked && privatePassword);
  const isCopied = copied === server.id;
  const top3 = server.top3 ?? [];
  const mapSlug = getMapImageSlug(server.map);
  const mapBg = mapSlug ? `url(/images/maps/backgrounds/${mapSlug}.png)` : 'none';

  return (
    <div
      className={`server-row ${expanded ? 'expanded' : ''} ${mapSlug ? 'server-row--has-map' : ''}`}
      style={{ '--map-bg': mapBg }}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="server-grid">
        <div className="col-name">
          <div className="server-name">{server.name}</div>
          <div className="server-addr">{server.ip}:{server.port}</div>
        </div>
        <div className="col-map">
          <span className="server-map-name">{server.map}</span>
          {server.gameMode && (
            <span className="server-game-mode">{server.gameMode}</span>
          )}
        </div>
        <div className="col-players">
          <div className="player-count">
            <span className="players-now">{server.players ?? '?'}</span>
            <span className="players-sep">/</span>
            <span className="players-max">{server.maxPlayers}</span>
          </div>
          <PlayerBar players={server.players} maxPlayers={server.maxPlayers} />
        </div>
        <div className="col-ping">
          <PingBadge ping={server.ping} />
        </div>
        <div className="col-tags">
          {server.tags.map(t => <Tag key={t} label={t} />)}
        </div>
        <div className="col-action" onClick={e => e.stopPropagation()}>
          {isPrivate && !canConnect ? (
            <div className="server-row-private-wrap">
              <span className="server-row-private-label">Lobby privada</span>
              <input
                type="text"
                className="server-row-private-input"
                placeholder="Senha"
                value={privatePassword}
                onChange={e => setPrivatePassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setPrivateUnlocked(true)}
              />
              <TrackedButton
                type="button"
                className="btn-unlock-connect"
                onClick={() => setPrivateUnlocked(true)}
              >
                Obter connect
              </TrackedButton>
            </div>
          ) : (
            <>
              <TrackedButton
                className="btn-connect"
                onClick={() => onConnect(server, connectStr)}
                title="Abrir no CS2"
              >
                CONECTAR
              </TrackedButton>
              <TrackedButton
                className={`btn-copy ${isCopied ? 'copied' : ''}`}
                onClick={() => onCopy(server, connectStr)}
              >
                {isCopied ? '✓ COPIADO' : '⎘ COPIAR'}
              </TrackedButton>
            </>
          )}
        </div>
      </div>

      {top3.length > 0 && (
        <div className="server-top3" onClick={e => e.stopPropagation()}>
          <span className="server-top3-label">TOP 3 KILLS</span>
          <ol className="server-top3-list">
            {top3.map((entry, i) => (
              <li key={i} className={`server-top3-item server-top3-item--${i + 1}`}>
                <span className="server-top3-rank">
                  {i === 0 ? (
                    <span className="server-top3-trophy" title="1º lugar">🏆</span>
                  ) : (
                    `#${i + 1}`
                  )}
                </span>
                <span className="server-top3-name">{entry.name ?? '—'}</span>
                <span className="server-top3-kills">{entry.kills ?? 0} kills</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {expanded && (
        <div className="server-detail" onClick={e => e.stopPropagation()}>
          {isPrivate && !canConnect ? (
            <div className="server-detail-private">
              <div className="detail-label">LOBBY PRIVADA</div>
              <p className="server-detail-private-hint">Informe a senha para ver o comando de conexão.</p>
              <input
                type="text"
                className="servers-warmup-input"
                placeholder="Senha da sala"
                value={privatePassword}
                onChange={e => setPrivatePassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setPrivateUnlocked(true)}
              />
              <TrackedButton type="button" className="btn-connect" onClick={() => setPrivateUnlocked(true)}>
                DESBLOQUEAR CONNECT
              </TrackedButton>
            </div>
          ) : (
            <>
              <div>
                <div className="detail-label">COMANDO DE CONEXÃO</div>
                <div className="connect-cmd">{connectStr}</div>
              </div>
              <div className="detail-actions">
                <a
                  href={steamConnectUrl}
                  className="btn-connect"
                  onClick={e => e.stopPropagation()}
                >
                  ABRIR NO CS2
                </a>
                <TrackedButton
                  className={`btn-copy ${isCopied ? 'copied' : ''}`}
                  onClick={() => onCopy(server, connectStr)}
                >
                  {isCopied ? '✓ COPIADO' : '⎘ COPIAR'}
                </TrackedButton>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ServerListPage() {
  const { servers, vmInfo, loading, error, refresh, lastUpdate } = useServerInfo();
  const auth = useAuth();
  const profile = useProfile();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const [copied, setCopied] = useState(null);
  const [showWarmupModal, setShowWarmupModal] = useState(false);
  const [warmupName, setWarmupName] = useState('');
  const [warmupMap, setWarmupMap] = useState('de_mirage');
  const [warmupDuration, setWarmupDuration] = useState(20);
  const [warmupHasPassword, setWarmupHasPassword] = useState(false);
  const [warmupPassword, setWarmupPassword] = useState('');
  const [warmupHasBots, setWarmupHasBots] = useState(true);
  const [creatingWarmup, setCreatingWarmup] = useState(false);
  const [createdWarmup, setCreatedWarmup] = useState(null);
  const warmupPingRef = useRef(null);
  const [warmupCountdown, setWarmupCountdown] = useState(0);

  useEffect(() => {
    if (!createdWarmup || warmupCountdown <= 0) return;
    const id = setInterval(() => {
      setWarmupCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [createdWarmup, warmupCountdown]);

  const handleCopy = (server, connectStrOverride) => {
    const text = connectStrOverride ?? `connect ${server.ip}:${server.port}`;
    navigator.clipboard.writeText(text);
    setCopied(server.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleConnect = (server, connectStrOverride) => {
    const hasPassword = connectStrOverride && connectStrOverride.includes('password ');
    navigator.clipboard.writeText(connectStrOverride ?? `connect ${server.ip}:${server.port}`);
    window.location.href = `steam://connect/${server.ip}:${server.port}`;
    if (hasPassword) setTimeout(() => setCopied(server.id), 100);
  };

  const handleCreateWarmupVip = async () => {
    if (!auth.steamId) {
      auth.login('/servers');
      return;
    }
    setCreatingWarmup(true);
    try {
      const data = await createVipWarmup({
        name: warmupName,
        map: warmupMap,
        durationMinutes: warmupDuration,
        password: warmupPassword,
        hasPassword: warmupHasPassword,
        hasBots: warmupHasBots,
      });
      setCreatedWarmup(data);
      // Aguarda alguns segundos para o servidor subir antes de destacar o connect
      setWarmupCountdown(10);
      // Começa a fazer ping para manter ativo enquanto a página estiver aberta
      if (warmupPingRef.current) clearInterval(warmupPingRef.current);
      warmupPingRef.current = setInterval(() => {
        pingVipWarmup(data.id).catch(() => {});
      }, 60_000);
    } catch (e) {
      alert(e.message);
    } finally {
      setCreatingWarmup(false);
    }
  };

  const filtered = servers.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase()) ||
    s.map.toLowerCase().includes(filter.toLowerCase())
  );

  const totalPlayers = servers.reduce((a, s) => a + (s.players ?? 0), 0);
  const isVip = Boolean(profile.profile?.isVip);
  const showWarmupBtn = Boolean(auth.steamId);

  const onWarmupBtnClick = () => {
    if (!isVip) {
      navigate('/vip');
      return;
    }
    setShowWarmupModal(true);
    setCreatedWarmup(null);
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
            <div className="header-title">SERVER BROWSER</div>
            <div className="header-sub">CS2 TRAINING SERVERS</div>
          </div>
        </div>

        <HamburgerNav activePath="/servers" auth={auth} profile={profile} returnTo="/servers">
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input
              className="search-input"
              placeholder="FILTRAR SERVIDORES..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
          <TrackedButton className="btn-refresh" onClick={refresh} disabled={loading}>
            {loading ? '↻' : '↺'} REFRESH
          </TrackedButton>
        </HamburgerNav>
      </header>

      <div className="servers-toolbar">
        <span className="servers-toolbar-spacer" />
        {showWarmupBtn && (
          <TrackedButton
            type="button"
            className="servers-add-warmup-btn"
            onClick={onWarmupBtnClick}
            title={isVip ? 'Criar warmup VIP' : 'Requer VIP — clique para assinar'}
          >
            <span className="servers-add-warmup-icon">+</span>
            <span className="servers-add-warmup-label">Warmup VIP</span>
          </TrackedButton>
        )}
      </div>

      <div className="col-headers">
        {['SERVIDOR', 'MAPA', 'JOGADORES', 'PING', 'TAGS', 'AÇÃO'].map(h => (
          <div key={h} className="col-header">{h}</div>
        ))}
      </div>

      <main className="main">
        {loading && servers.length === 0 && (
          <div className="state-msg">
            <div className="spinner" />
            <span>BUSCANDO SERVIDORES...</span>
          </div>
        )}

        {error && (
          <div className="state-error">
            <div className="error-icon">⚠</div>
            <div>
              <div className="error-title">ERRO AO BUSCAR DADOS</div>
              <div className="error-msg">{error}</div>
              <div className="error-hint">Verifique as variáveis no arquivo .env</div>
            </div>
            <TrackedButton className="btn-refresh" onClick={refresh}>TENTAR NOVAMENTE</TrackedButton>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="state-msg state-msg--empty">
            <span className="state-msg-title">NENHUM SERVIDOR NA LISTA</span>
            <span className="state-msg-hint">Quando um servidor CS2 conectar e reportar status ao backend, ele aparecerá aqui automaticamente.</span>
          </div>
        )}

        {filtered.map(server => (
          <ServerRow
            key={server.id}
            server={server}
            onCopy={handleCopy}
            onConnect={handleConnect}
            copied={copied}
          />
        ))}
      </main>

      <footer className="footer">
        <span>{filtered.length} SERVIDOR{filtered.length !== 1 ? 'ES' : ''} · {totalPlayers} JOGADORES ONLINE</span>
        {lastUpdate && (
          <span>ATUALIZADO {lastUpdate.toLocaleTimeString('pt-BR')}</span>
        )}
      </footer>

      {showWarmupModal && (
        <div className="servers-warmup-modal-backdrop" onClick={() => setShowWarmupModal(false)}>
          <div className="servers-warmup-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="servers-warmup-modal-glow" aria-hidden />
            <div className="servers-warmup-modal-header">
              <span className="servers-warmup-modal-icon" aria-hidden>🔥</span>
              <h3 className="servers-warmup-modal-title">WARMUP VIP</h3>
              <p className="servers-warmup-modal-desc">Crie um servidor de aim/warmup exclusivo para você e seus amigos.</p>
            </div>
            <div className="servers-warmup-modal-body">
              <label className="servers-warmup-label" htmlFor="warmup-name">Nome da sala</label>
              <input
                id="warmup-name"
                className="servers-warmup-input"
                type="text"
                placeholder="Ex: Warmup do Clan, Aim Mirage..."
                value={warmupName}
                onChange={(e) => setWarmupName(e.target.value)}
                maxLength={64}
              />
              <span className="servers-warmup-char">{warmupName.length}/64</span>

              <label className="servers-warmup-label" htmlFor="warmup-map" style={{ marginTop: '16px' }}>Mapa</label>
              <select
                id="warmup-map"
                className="servers-warmup-input"
                value={warmupMap}
                onChange={(e) => setWarmupMap(e.target.value)}
              >
                <option value="de_mirage">de_mirage</option>
                <option value="de_inferno">de_inferno</option>
                <option value="de_dust2">de_dust2</option>
                <option value="de_anubis">de_anubis</option>
                <option value="de_ancient">de_ancient</option>
                <option value="de_nuke">de_nuke</option>
                <option value="de_overpass">de_overpass</option>
                <option value="de_cache">de_cache</option>
              </select>

              <label className="servers-warmup-label" htmlFor="warmup-duration" style={{ marginTop: '16px' }}>Tempo de jogo</label>
              <select
                id="warmup-duration"
                className="servers-warmup-input"
                value={warmupDuration}
                onChange={(e) => setWarmupDuration(Number(e.target.value) || 20)}
              >
                <option value={10}>10 minutos</option>
                <option value={20}>20 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
              </select>

              <label className="servers-warmup-label" style={{ marginTop: '16px' }}>
                <input
                  type="checkbox"
                  checked={warmupHasPassword}
                  onChange={(e) => setWarmupHasPassword(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Proteger com senha
              </label>
              {warmupHasPassword && (
                <input
                  className="servers-warmup-input"
                  type="text"
                  placeholder="Senha da sala"
                  value={warmupPassword}
                  onChange={(e) => setWarmupPassword(e.target.value)}
                  maxLength={32}
                />
              )}

              <label className="servers-warmup-label" style={{ marginTop: '16px' }}>
                <input
                  type="checkbox"
                  checked={warmupHasBots}
                  onChange={(e) => setWarmupHasBots(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Iniciar com bots
              </label>

              {createdWarmup && (
                <div style={{ marginTop: '16px' }}>
                  {warmupCountdown > 0 ? (
                    <>
                      <div className="servers-warmup-label">Servidor iniciando...</div>
                      <div className="servers-warmup-countdown">
                        Aguarde <span>{warmupCountdown}</span> segundo{warmupCountdown !== 1 ? 's' : ''} para conectar.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="servers-warmup-label">Comando de conexão</div>
                      <code className="servers-warmup-connect">{createdWarmup.connect}</code>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="servers-warmup-actions">
              <TrackedButton
                type="button"
                className="pug-btn pug-btn-secondary servers-warmup-btn-cancel"
                onClick={() => setShowWarmupModal(false)}
              >
                FECHAR
              </TrackedButton>
              {!createdWarmup && (
                <TrackedButton
                  type="button"
                  className="pug-btn pug-btn-primary servers-warmup-btn-submit"
                  onClick={handleCreateWarmupVip}
                  disabled={creatingWarmup}
                >
                  {creatingWarmup ? 'CRIANDO...' : 'CRIAR WARMUP'}
                </TrackedButton>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`
        .servers-toolbar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 12px 24px 8px;
          gap: 12px;
        }
        .servers-toolbar-spacer { flex: 1; }
        .servers-add-warmup-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          font-size: 12px;
          letter-spacing: 1.5px;
          color: #0a0a0a;
          background: linear-gradient(135deg, var(--green), #1a9e4a);
          border: 1px solid rgba(74,222,128,0.5);
          border-radius: 10px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.25s, transform 0.25s;
        }
        .servers-add-warmup-btn::before {
          content: '';
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 80px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(74, 222, 128, 0.25) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        .servers-add-warmup-btn:hover {
          box-shadow: 0 4px 24px rgba(74,222,128,0.35);
          transform: translateY(-2px);
        }
        .servers-add-warmup-btn:hover::before {
          opacity: 1;
        }
        .servers-add-warmup-icon {
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
        }
        .servers-add-warmup-label {
          font-family: var(--font-mono, monospace);
        }
        .servers-warmup-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          backdrop-filter: blur(5px);
        }
        .servers-warmup-modal-card {
          position: relative;
          width: 100%;
          max-width: 440px;
          background: linear-gradient(180deg, rgba(15,23,42,0.98), rgba(8,12,24,0.99));
          border-radius: 18px;
          border: 1px solid rgba(248,113,113,0.4);
          padding: 30px 26px 24px;
          box-shadow: 0 0 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset;
          overflow: hidden;
        }
        .servers-warmup-modal-glow {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 220px;
          height: 130px;
          background: radial-gradient(circle, rgba(248,113,113,0.3), transparent 70%);
          pointer-events: none;
        }
        .servers-warmup-modal-header {
          text-align: left;
          margin-bottom: 22px;
          position: relative;
        }
        .servers-warmup-modal-icon {
          display: inline-block;
          font-size: 34px;
          margin-bottom: 8px;
          filter: drop-shadow(0 0 14px rgba(248,113,113,0.7));
        }
        .servers-warmup-modal-title {
          margin: 0 0 4px;
          font-family: var(--font-head);
          font-size: 1.3rem;
          letter-spacing: 4px;
          color: #fff;
        }
        .servers-warmup-modal-desc {
          margin: 0;
          font-size: 0.9rem;
          color: rgba(255,255,255,0.75);
        }
        .servers-warmup-modal-body {
          margin-bottom: 20px;
        }
        .servers-warmup-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.75);
          margin-bottom: 8px;
        }
        .servers-warmup-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 14px;
          font-size: 0.95rem;
          color: #fff;
          background: rgba(15,23,42,0.9);
          border-radius: 10px;
          border: 1px solid rgba(148,163,184,0.6);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .servers-warmup-input::placeholder {
          color: rgba(148,163,184,0.8);
        }
        .servers-warmup-input:focus {
          border-color: rgba(248,113,113,0.8);
          box-shadow: 0 0 0 3px rgba(248,113,113,0.35);
          background: rgba(15,23,42,0.98);
        }
        .servers-warmup-char {
          display: block;
          font-size: 0.75rem;
          color: rgba(148,163,184,0.9);
          margin-top: 4px;
          text-align: right;
        }
        .servers-warmup-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .servers-warmup-connect {
          display: block;
          font-size: 11px;
          word-break: break-all;
          color: var(--text-dim);
          padding: 10px 12px;
          background: rgba(15,23,42,0.95);
          border-radius: 8px;
          border: 1px solid rgba(148,163,184,0.6);
        }
        .servers-warmup-countdown { font-size: 0.9rem; color: rgba(255,255,255,0.85); }
        .servers-warmup-countdown span { font-weight: 700; color: var(--gold); }
        .server-row-private-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .server-row-private-label {
          font-size: 11px;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.6);
        }
        .server-row-private-input {
          width: 90px;
          padding: 6px 8px;
          font-size: 12px;
          color: #fff;
          background: rgba(15,23,42,0.95);
          border: 1px solid rgba(148,163,184,0.5);
          border-radius: 6px;
        }
        .btn-unlock-connect {
          padding: 6px 10px;
          font-size: 11px;
          letter-spacing: 1px;
          background: rgba(74,222,128,0.15);
          border: 1px solid rgba(74,222,128,0.5);
          color: var(--green);
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-unlock-connect:hover {
          background: rgba(74,222,128,0.25);
        }
        .server-detail-private { padding: 8px 0; }
        .server-detail-private-hint {
          margin: 0 0 10px;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.7);
        }
        .server-detail-private .servers-warmup-input { max-width: 240px; margin-bottom: 10px; }
      `}</style>
    </div>
  );
}
