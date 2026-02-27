import { useState } from 'react';
import { useServerInfo } from './hooks/useServerInfo';
import './index.css';

// ── Sub-components ────────────────────────────────────────────────────────────

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

function VMStatusBadge({ status }) {
  if (!status) return null;
  const running = status.toLowerCase().includes('running');
  return (
    <span className={`vm-status ${running ? 'running' : 'stopped'}`}>
      <span className="vm-status-dot" />
      {status.toUpperCase()}
    </span>
  );
}

function ServerRow({ server, onCopy, copied }) {
  const [expanded, setExpanded] = useState(false);
  const connectStr = `connect ${server.ip}:${server.port}`;
  const isCopied = copied === server.id;

  return (
    <div className={`server-row ${expanded ? 'expanded' : ''}`} onClick={() => setExpanded(e => !e)}>
      <div className="server-grid">
        {/* Name */}
        <div className="col-name">
          <div className="server-name">{server.name}</div>
          <div className="server-addr">{server.ip}:{server.port}</div>
        </div>

        {/* Map */}
        <div className="col-map">{server.map}</div>

        {/* Players */}
        <div className="col-players">
          <div className="player-count">
            <span className="players-now">{server.players ?? '?'}</span>
            <span className="players-sep">/</span>
            <span className="players-max">{server.maxPlayers}</span>
          </div>
          <PlayerBar players={server.players} maxPlayers={server.maxPlayers} />
        </div>

        {/* Ping */}
        <div className="col-ping">
          <PingBadge ping={server.ping} />
        </div>

        {/* Tags */}
        <div className="col-tags">
          {server.tags.map(t => <Tag key={t} label={t} />)}
        </div>

        {/* Action */}
        <div className="col-action" onClick={e => e.stopPropagation()}>
          <button
            className={`btn-copy ${isCopied ? 'copied' : ''}`}
            onClick={() => onCopy(server)}
          >
            {isCopied ? '✓ COPIADO' : '⎘ COPIAR'}
          </button>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="server-detail" onClick={e => e.stopPropagation()}>
          <div>
            <div className="detail-label">COMANDO DE CONEXÃO</div>
            <div className="connect-cmd">{connectStr}</div>
          </div>
          <div className="detail-actions">
            <button
              className={`btn-copy ${isCopied ? 'copied' : ''}`}
              onClick={() => onCopy(server)}
            >
              {isCopied ? '✓ COPIADO' : '⎘ COPIAR IP'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const { servers, vmInfo, loading, error, refresh, lastUpdate } = useServerInfo();
  const [filter, setFilter] = useState('');
  const [copied, setCopied] = useState(null);

  const handleCopy = (server) => {
    navigator.clipboard.writeText(`connect ${server.ip}:${server.port}`);
    setCopied(server.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = servers.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase()) ||
    s.map.toLowerCase().includes(filter.toLowerCase())
  );

  const totalPlayers = servers.reduce((a, s) => a + (s.players ?? 0), 0);

  return (
    <div className="app">
      <div className="scanlines" />
      <div className="grid-bg" />
      <div className="glow-orb" />

      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <div className="logo-hex" />
          <div>
            <div className="header-title">SERVER BROWSER</div>
            <div className="header-sub">CS2 TRAINING SERVERS</div>
          </div>
          {vmInfo && <VMStatusBadge status={vmInfo.vmStatus} />}
        </div>

        <div className="header-right">
          {vmInfo && (
            <div className="vm-info">
              <span className="vm-info-label">VM</span>
              <span className="vm-info-value">{vmInfo.vmName}</span>
              <span className="vm-info-sep">·</span>
              <span className="vm-info-label">IP</span>
              <span className="vm-info-value">{vmInfo.ip || '—'}</span>
              <span className="vm-info-sep">·</span>
              <span className="vm-info-value">{vmInfo.vmSize}</span>
            </div>
          )}
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input
              className="search-input"
              placeholder="FILTRAR SERVIDORES..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
          <button className="btn-refresh" onClick={refresh} disabled={loading}>
            {loading ? '↻' : '↺'} REFRESH
          </button>
        </div>
      </header>

      {/* ── Column headers ── */}
      <div className="col-headers">
        {['SERVIDOR', 'MAPA', 'JOGADORES', 'PING', 'TAGS', 'AÇÃO'].map(h => (
          <div key={h} className="col-header">{h}</div>
        ))}
      </div>

      {/* ── Content ── */}
      <main className="main">
        {loading && servers.length === 0 && (
          <div className="state-msg">
            <div className="spinner" />
            <span>CONECTANDO À AZURE...</span>
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
            <button className="btn-refresh" onClick={refresh}>TENTAR NOVAMENTE</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="state-msg">NENHUM SERVIDOR ENCONTRADO</div>
        )}

        {filtered.map(server => (
          <ServerRow
            key={server.id}
            server={server}
            onCopy={handleCopy}
            copied={copied}
          />
        ))}
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <span>{filtered.length} SERVIDOR{filtered.length !== 1 ? 'ES' : ''} · {totalPlayers} JOGADORES ONLINE</span>
        {lastUpdate && (
          <span>ATUALIZADO {lastUpdate.toLocaleTimeString('pt-BR')}</span>
        )}
      </footer>
    </div>
  );
}
