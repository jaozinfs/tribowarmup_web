import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from './Avatar';
import { getLevelStyle } from '../utils/levelStyle';
import { formatGameModeLabel } from '../utils/gameModeLabel';
import { getPlayerStats, getRecentMatches } from '../services/pugService';
import { TrackedButton } from './TrackedButton';

const MATCH_PAGE_SIZE = 5;

const POINTS_PER_LEVEL = 100;
const MAP_DISPLAY = {
  de_mirage: 'Mirage', de_dust2: 'Dust 2', de_inferno: 'Inferno', de_ancient: 'Ancient',
  de_anubis: 'Anubis', de_nuke: 'Nuke', de_overpass: 'Overpass', de_cache: 'Cache',
};
const MAP_BG_BASE = '/images/maps/backgrounds';

export function PlayerDetailsCard({ steamId, profile: profileProp, showHeader = true }) {
  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState(null);
  const [matchesHasMore, setMatchesHasMore] = useState(false);
  const [matchPage, setMatchPage] = useState(1);
  const [matchGameFilter, setMatchGameFilter] = useState('all');
  const [matchSort, setMatchSort] = useState('desc');
  const [loading, setLoading] = useState(!!steamId);
  const [matchesLoading, setMatchesLoading] = useState(!!steamId);

  useEffect(() => {
    if (!steamId) {
      setLoading(false);
      setMatchesLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getPlayerStats(steamId)
      .then((s) => {
        if (!cancelled) {
          setStats(s || null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [steamId]);

  useEffect(() => {
    setMatchPage(1);
  }, [steamId]);

  useEffect(() => {
    if (!steamId) {
      setMatches(null);
      setMatchesHasMore(false);
      setMatchesLoading(false);
      return;
    }
    let cancelled = false;
    setMatchesLoading(true);
    getRecentMatches(steamId, MATCH_PAGE_SIZE, matchPage, {
      gameMode: matchGameFilter,
      sort: matchSort,
    })
      .then((resp) => {
        if (cancelled) return;
        const matchList = Array.isArray(resp) ? resp : (resp?.matches && Array.isArray(resp.matches) ? resp.matches : []);
        setMatches(matchList);
        setMatchesHasMore(Boolean(resp?.hasMore));
        setMatchesLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setMatches([]);
          setMatchesHasMore(false);
          setMatchesLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [steamId, matchPage, matchGameFilter, matchSort]);

  if (!steamId && !profileProp) return null;
  const p = profileProp || {};
  const level = Math.max(1, Math.min(100, Number(p.level) || 1));
  const points = Math.max(0, Number(p.points) || 0);
  const progressPct = (points / POINTS_PER_LEVEL) * 100;
  const levelStyle = getLevelStyle(level);
  const nextLevel = Math.min(100, level + 1);
  const nextStyle = getLevelStyle(nextLevel);

  const kdr = stats && stats.totalDeaths > 0
    ? (stats.totalKills / stats.totalDeaths).toFixed(2)
    : (stats?.totalKills ? (stats.totalKills).toFixed(2) : '—');
  const wins = stats?.totalWins ?? 0;
  const losses = stats?.totalLosses ?? 0;
  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '—';

  return (
    <div className="player-details-card">
      {showHeader && (
        <div className="player-details-header">
          <Avatar avatarUrl={p.avatarUrl} className="player-details-avatar" loading="eager" />
          <div className="player-details-title-row">
            <h3 className="player-details-name">{p.displayName || `Jogador ${String(steamId || '').slice(-6)}`}</h3>
            {p.isVip && <span className="player-details-vip">VIP</span>}
          </div>
        </div>
      )}
      <div className="player-details-level-row">
        <span className="player-details-badge" style={{ backgroundColor: levelStyle.backgroundColor, color: levelStyle.color }}>
          {level}
        </span>
        <div className="player-details-progress-wrap">
          <div className="player-details-progress-bg">
            <div
              className="player-details-progress-fill"
              style={{ width: `${progressPct}%`, backgroundColor: levelStyle.backgroundColor }}
            />
          </div>
          <span className="player-details-progress-label">{points} / {POINTS_PER_LEVEL} pts → Level {nextLevel}</span>
        </div>
        <span className="player-details-badge player-details-badge--next" style={{ backgroundColor: nextStyle.backgroundColor, color: nextStyle.color }}>
          {nextLevel}
        </span>
      </div>

      {loading ? (
        <div className="player-details-loading">Carregando estatísticas...</div>
      ) : (
        <>
          <div className="player-details-stats-grid">
            <div className="player-details-stat">
              <span className="player-details-stat-label">KDR</span>
              <span className="player-details-stat-value">{kdr}</span>
            </div>
            <div className="player-details-stat">
              <span className="player-details-stat-label">Kills</span>
              <span className="player-details-stat-value">{stats?.totalKills ?? '—'}</span>
            </div>
            <div className="player-details-stat">
              <span className="player-details-stat-label">Mortes</span>
              <span className="player-details-stat-value">{stats?.totalDeaths ?? '—'}</span>
            </div>
            <div className="player-details-stat">
              <span className="player-details-stat-label">Assists</span>
              <span className="player-details-stat-value">{stats?.totalAssists ?? '—'}</span>
            </div>
            <div className="player-details-stat">
              <span className="player-details-stat-label">HS%</span>
              <span className="player-details-stat-value">
                {stats?.totalKills > 0 && stats?.totalHeadshots != null
                  ? `${((stats.totalHeadshots / stats.totalKills) * 100).toFixed(0)}%`
                  : '—'}
              </span>
            </div>
            <div className="player-details-stat">
              <span className="player-details-stat-label">Vitórias</span>
              <span className="player-details-stat-value player-details-stat--win">{wins}</span>
            </div>
            <div className="player-details-stat">
              <span className="player-details-stat-label">Derrotas</span>
              <span className="player-details-stat-value player-details-stat--loss">{losses}</span>
            </div>
            <div className="player-details-stat">
              <span className="player-details-stat-label">Win rate</span>
              <span className="player-details-stat-value">{winRate}{typeof winRate === 'string' && winRate !== '—' ? '%' : ''}</span>
            </div>
          </div>

          {matches && matches.length > 0 && (
            <div className="player-details-matches">
              <h4 className="player-details-matches-title">Histórico de partidas</h4>
              <div className="player-details-matches-filters">
                <label className="player-details-filter">
                  <span>Modo</span>
                  <select
                    value={matchGameFilter}
                    onChange={(e) => {
                      setMatchGameFilter(e.target.value);
                      setMatchPage(1);
                    }}
                  >
                    <option value="all">Todos</option>
                    <option value="pug">PUG</option>
                    <option value="mix">MIX</option>
                    <option value="squad">Clan</option>
                    <option value="snaparena">SnapArena</option>
                    <option value="snaphack">SnapHack</option>
                  </select>
                </label>
                <label className="player-details-filter">
                  <span>Data</span>
                  <select
                    value={matchSort}
                    onChange={(e) => {
                      setMatchSort(e.target.value);
                      setMatchPage(1);
                    }}
                  >
                    <option value="desc">Mais recentes</option>
                    <option value="asc">Mais antigas</option>
                  </select>
                </label>
              </div>
              {matchesLoading && (
                <div className="player-details-matches-loading">Atualizando lista…</div>
              )}
              <div className="player-details-matches-list">
                {matches.map((m, i) => {
                  const mapKey = (m.map || '').split('/').pop() || m.map || 'unknown';
                  const mapName = MAP_DISPLAY[mapKey] || mapKey;
                  const dateLabel = m.playedAt ? new Date(m.playedAt).toLocaleDateString('pt-BR') : '';
                  const hasMatchId = Boolean(m.matchId);
                  const content = (
                    <article
                      key={m.matchId || i}
                      className={`player-details-match ${m.won ? 'player-details-match--win' : 'player-details-match--loss'}`}
                    >
                      <div
                        className="player-details-match-bg"
                        style={{ backgroundImage: `url(${MAP_BG_BASE}/${mapKey}.png)` }}
                        aria-hidden="true"
                      />
                      <div className="player-details-match-main">
                        <div className="player-details-match-top">
                          <span className={`player-details-match-result ${m.won ? 'won' : 'lost'}`}>
                            {m.won ? 'VITÓRIA' : 'DERROTA'}
                          </span>
                          <span className="player-details-match-mode" title="Modo de jogo">
                            {formatGameModeLabel(m.gameMode)}
                          </span>
                          <span className="player-details-match-score">
                            {m.myScore != null ? `${m.myScore} x ${m.oppScore}` : `${m.scoreCt ?? 0} x ${m.scoreTr ?? 0}`}
                          </span>
                          <span className="player-details-match-map">{mapName}</span>
                        </div>
                        <div className="player-details-match-bottom">
                          <span className="player-details-match-teams">
                            {m.teamAName && m.teamBName ? `Time ${m.teamAName} vs Time ${m.teamBName}` : 'Time A vs Time B'}
                          </span>
                          <span className="player-details-match-kda-label">K/D/A</span>
                          <span className="player-details-match-kda-value">{m.kills}/{m.deaths}/{m.assists}</span>
                          {dateLabel && <span className="player-details-match-date">{dateLabel}</span>}
                        </div>
                      </div>
                    </article>
                  );
                  return (
                    hasMatchId ? (
                      <Link
                        key={m.matchId}
                        to={`/match/${encodeURIComponent(m.matchId)}`}
                        className="player-details-match-link"
                      >
                        {content}
                      </Link>
                    ) : content
                  );
                })}
              </div>
              <div className="player-details-matches-pager">
                <TrackedButton
                  type="button"
                  className="player-details-pager-btn"
                  disabled={matchPage <= 1 || matchesLoading}
                  onClick={() => setMatchPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </TrackedButton>
                <span className="player-details-pager-info">Página {matchPage}</span>
                <TrackedButton
                  type="button"
                  className="player-details-pager-btn"
                  disabled={!matchesHasMore || matchesLoading}
                  onClick={() => setMatchPage((p) => p + 1)}
                >
                  Próxima
                </TrackedButton>
              </div>
            </div>
          )}

          {(!matchesLoading && (!matches || matches.length === 0)) && (
            <div className="player-details-matches player-details-matches--empty">
              <div className="player-details-matches-empty-bg" aria-hidden="true" />
              <div className="player-details-matches-empty-main">
                <h4 className="player-details-matches-title">Histórico de partidas</h4>
                <div className="player-details-matches-filters player-details-matches-filters--empty">
                  <label className="player-details-filter">
                    <span>Modo</span>
                    <select
                      value={matchGameFilter}
                      onChange={(e) => {
                        setMatchGameFilter(e.target.value);
                        setMatchPage(1);
                      }}
                    >
                      <option value="all">Todos</option>
                      <option value="pug">PUG</option>
                      <option value="mix">MIX</option>
                      <option value="squad">Clan</option>
                      <option value="snaparena">SnapArena</option>
                      <option value="snaphack">SnapHack</option>
                    </select>
                  </label>
                  <label className="player-details-filter">
                    <span>Data</span>
                    <select
                      value={matchSort}
                      onChange={(e) => {
                        setMatchSort(e.target.value);
                        setMatchPage(1);
                      }}
                    >
                      <option value="desc">Mais recentes</option>
                      <option value="asc">Mais antigas</option>
                    </select>
                  </label>
                </div>
                <p className="player-details-empty-text">
                  Nenhuma partida encontrada{matchGameFilter !== 'all' ? ' com este filtro' : ''}.
                </p>
                <p className="player-details-empty-sub">
                  Jogue partidas (PUG, MIX, Clan, SnapArena…) para ver mapa, placar, modo e K/D/A aqui.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .player-details-card {
          background: linear-gradient(180deg, rgba(18,22,35,0.97) 0%, rgba(12,16,28,0.99) 100%);
          border: 1px solid rgba(245,166,35,0.2);
          border-radius: 16px;
          padding: 24px;
          max-width: 560px;
          width: 100%;
          box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04) inset;
        }
        .player-details-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .player-details-avatar { width: 56px; height: 56px; border-radius: 12px; }
        .player-details-title-row { display: flex; align-items: center; gap: 10px; }
        .player-details-name { font-family: var(--font-head); font-size: 1.35rem; letter-spacing: 1px; color: #fff; margin: 0; }
        .player-details-vip { font-size: 0.7rem; padding: 2px 8px; background: linear-gradient(135deg, #f5a623, #c4851a); color: #0b1120; border-radius: 6px; font-weight: 700; }
        .player-details-level-row { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .player-details-badge {
          width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 1rem; font-weight: 700; font-family: var(--font-mono); flex-shrink: 0;
        }
        .player-details-progress-wrap { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
        .player-details-progress-bg { height: 14px; background: rgba(255,255,255,0.08); border-radius: 7px; overflow: hidden; }
        .player-details-progress-fill { height: 100%; border-radius: 7px; transition: width 0.3s ease; }
        .player-details-progress-label { font-size: 11px; color: var(--text-dim); font-family: var(--font-mono); }
        .player-details-stats-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;
        }
        .player-details-stat {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 12px; text-align: center;
        }
        .player-details-stat-label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dim); margin-bottom: 4px; }
        .player-details-stat-value { font-size: 1.1rem; font-weight: 700; color: #fff; font-family: var(--font-mono); }
        .player-details-stat--win { color: #86efac; }
        .player-details-stat--loss { color: #fca5a5; }
        .player-details-loading { color: var(--text-dim); padding: 20px; text-align: center; }
        .player-details-matches-title { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-dim); margin: 0 0 12px; }
        .player-details-matches-filters {
          display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; align-items: flex-end;
        }
        .player-details-matches-filters--empty { margin-bottom: 14px; }
        .player-details-filter {
          display: flex; flex-direction: column; gap: 4px; font-size: 0.65rem; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--text-dim);
        }
        .player-details-filter select {
          min-width: 130px; padding: 6px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12);
          background: rgba(0,0,0,0.35); color: #e5e7eb; font-size: 0.8rem;
        }
        .player-details-matches-loading {
          font-size: 0.75rem; color: var(--text-dim); margin: -4px 0 10px;
        }
        .player-details-matches-list { display: flex; flex-direction: column; gap: 10px; }
        .player-details-matches-pager {
          display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 14px;
        }
        .player-details-pager-btn {
          padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(245,166,35,0.35);
          background: rgba(245,166,35,0.12); color: #fde68a; font-size: 0.75rem; font-weight: 700;
          cursor: pointer; font-family: var(--font-mono);
        }
        .player-details-pager-btn:disabled {
          opacity: 0.35; cursor: not-allowed;
        }
        .player-details-pager-info { font-size: 0.75rem; color: var(--text-dim); font-family: var(--font-mono); }
        .player-details-matches--empty {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          border: 1px solid rgba(148,163,184,0.4);
          background: radial-gradient(circle at 0 0, rgba(15,23,42,0.98), rgba(15,23,42,0.99));
          min-height: 120px;
        }
        .player-details-matches-empty-bg {
          position: absolute;
          inset: -40%;
          background:
            radial-gradient(circle at 10% 0%, rgba(59,130,246,0.3), transparent 55%),
            radial-gradient(circle at 90% 20%, rgba(16,185,129,0.28), transparent 55%),
            radial-gradient(circle at 50% 120%, rgba(248,250,252,0.1), transparent 60%);
          opacity: 0.8;
          filter: saturate(1.2);
          animation: player-details-no-matches 18s linear infinite;
        }
        .player-details-matches-empty-main {
          position: relative;
          padding: 16px 18px 18px;
        }
        .player-details-empty-text {
          margin: 0 0 6px;
          color: #e5e7eb;
          font-weight: 500;
        }
        .player-details-empty-sub {
          margin: 0;
          font-size: 0.8rem;
          color: var(--text-dim);
          max-width: 420px;
        }
        .player-details-match {
          position: relative;
          overflow: hidden;
          border-radius: 10px;
          border: 1px solid rgba(15,23,42,0.9);
          background: radial-gradient(circle at 0 0, rgba(15,23,42,0.95), rgba(15,23,42,0.98));
        }
        .player-details-match--win { box-shadow: 0 0 0 1px rgba(34,197,94,0.35); }
        .player-details-match--loss { box-shadow: 0 0 0 1px rgba(239,68,68,0.35); }
        .player-details-match-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0.25;
          filter: saturate(1.1);
        }
        .player-details-match-main {
          position: relative;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .player-details-match-top {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 10px;
          font-size: 0.85rem;
        }
        .player-details-match-mode {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(245, 166, 35, 0.2);
          color: #fcd34d;
          border: 1px solid rgba(245, 166, 35, 0.35);
        }
        .player-details-match-result {
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          font-family: var(--font-mono);
        }
        .player-details-match-result.won { background: rgba(22,163,74,0.8); color: #e4ffe9; }
        .player-details-match-result.lost { background: rgba(220,38,38,0.8); color: #fee2e2; }
        .player-details-match-score { font-family: var(--font-mono); color: #fff; min-width: 52px; }
        .player-details-match-map { color: var(--text-dim); flex: 1; }
        .player-details-match-bottom {
          display: grid;
          grid-template-columns: minmax(0,1.2fr) auto auto auto;
          gap: 8px;
          align-items: center;
          font-size: 0.8rem;
          color: var(--text-dim);
        }
        .player-details-match-teams { font-family: var(--font-mono); }
        .player-details-match-kda-label { text-align: right; opacity: 0.7; }
        .player-details-match-kda-value { font-family: var(--font-mono); color: #e5e7eb; }
        .player-details-match-date { text-align: right; font-size: 0.75rem; opacity: 0.8; }
        @keyframes player-details-no-matches {
          0% { transform: translate3d(-5%, 0, 0); }
          50% { transform: translate3d(5%, -4%, 0); }
          100% { transform: translate3d(-5%, 0, 0); }
        }
      `}</style>
    </div>
  );
}
