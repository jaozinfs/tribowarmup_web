import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HamburgerNav } from '../components/HamburgerNav';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { Avatar } from '../components/Avatar';
import { formatGameModeLabel } from '../utils/gameModeLabel';
import '../index.css';
import { TrackedButton } from '../components/TrackedButton';

const MAP_BG_BASE = '/images/maps/backgrounds';
const MAP_NAMES = {
  de_mirage: 'Mirage',
  de_dust2: 'Dust 2',
  de_inferno: 'Inferno',
  de_ancient: 'Ancient',
  de_anubis: 'Anubis',
  de_nuke: 'Nuke',
  de_overpass: 'Overpass',
  de_cache: 'Cache',
};

function getBareMapKey(map) {
  if (!map) return 'unknown';
  const parts = String(map).split('/');
  return parts[parts.length - 1] || map;
}

export default function MatchDetailsPage() {
  const { matchId } = useParams();
  const auth = useAuth();
  const profile = useProfile();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/match/${matchId || ''}` : '';
  const copyMatchLink = () => {
    if (!shareUrl) return;
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    if (!matchId) {
      setError('Partida não encontrada.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/pug/matches/${encodeURIComponent(matchId)}`)
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((e) => {
        setError(e?.error || 'Erro ao carregar detalhes da partida.');
        setLoading(false);
      });
  }, [matchId]);

  const mapKey = getBareMapKey(data?.map);
  const mapName = MAP_NAMES[mapKey] || mapKey;
  const bgUrl = `${MAP_BG_BASE}/${mapKey}.png`;
  const playedAt = data?.playedAt ? new Date(data.playedAt).toLocaleString('pt-BR') : '';
  const durationSeconds = Number(data?.durationSeconds) || 0;
  const durationMinutes = durationSeconds > 0 ? Math.max(1, Math.round(durationSeconds / 60)) : 0;
  const players = Array.isArray(data?.players) ? data.players : [];
  const winner = data?.winner;
  const byTeamSlot = winner === 'A' || winner === 'B';
  const sortByKills = (a, b) => (b.kills || 0) - (a.kills || 0);
  const teamA = (byTeamSlot ? players.filter((p) => p.teamSlot === 'A') : players.filter((p) => p.team === 'ct')).sort(sortByKills);
  const teamB = (byTeamSlot ? players.filter((p) => p.teamSlot === 'B') : players.filter((p) => p.team === 'tr')).sort(sortByKills);
  const winnerLabelA = byTeamSlot ? (winner === 'A') : (winner === 'ct');
  const winnerLabelB = byTeamSlot ? (winner === 'B') : (winner === 'tr');
  const rawNameA = data?.teamAName;
  const rawNameB = data?.teamBName;
  const teamNameA = byTeamSlot ? `Time ${rawNameA || 'A'}` : 'COUNTER-TERRORIST';
  const teamNameB = byTeamSlot ? `Time ${rawNameB || 'B'}` : 'TERRORIST';
  const scoreA = byTeamSlot ? (data?.scoreA ?? data?.scoreCt ?? 0) : (data?.scoreCt ?? 0);
  const scoreB = byTeamSlot ? (data?.scoreB ?? data?.scoreTr ?? 0) : (data?.scoreTr ?? 0);

  return (
    <div className="app">
      <div className="scanlines" />
      <div className="grid-bg" />
      <header className="header">
        <div className="header-left">
          <Link to="/" className="logo-hex" aria-label="Início" />
          <div>
            <div className="header-title">PARTIDA</div>
            <div className="header-sub">DETALHES</div>
          </div>
        </div>
        <HamburgerNav activePath="/match" auth={auth} profile={profile} returnTo="/" />
      </header>
      <main className="match-main">
        {loading && (
          <div className="match-loading">
            <div className="spinner" />
            <span>Carregando partida...</span>
          </div>
        )}
        {!loading && error && (
          <div className="match-error">
            <span className="match-error-icon">!</span>
            <span>{error}</span>
          </div>
        )}
        {!loading && !error && data && (
          <>
            <section className="match-hero">
              <div
                className="match-hero-bg"
                style={{ backgroundImage: `url(${bgUrl})` }}
                aria-hidden="true"
              />
              <div className="match-hero-overlay" />
              <div className="match-hero-content">
                <div className="match-hero-left">
                  <div className="match-hero-title-row">
                    <h1 className="match-map-name">{mapName}</h1>
                    {data?.gameMode != null && (
                      <span className="match-game-mode-badge">{formatGameModeLabel(data.gameMode)}</span>
                    )}
                  </div>
                  {playedAt && <p className="match-date">{playedAt}</p>}
                  {durationMinutes > 0 && (
                    <p className="match-duration">
                      Duração: {durationMinutes} min
                    </p>
                  )}
                  <p className="match-id-label">Match ID: {data.id}</p>
                  <TrackedButton type="button" className="match-share-btn" onClick={copyMatchLink} title="Copiar link da partida">
                    {copied ? 'Link copiado!' : 'Compartilhar link'}
                  </TrackedButton>
                </div>
                <div className="match-hero-score">
                  <span className="match-score-ct">{scoreA}</span>
                  <span className="match-score-sep">x</span>
                  <span className="match-score-tr">{scoreB}</span>
                </div>
              </div>
            </section>

            <section className="match-teams">
              <div className={`match-team ${byTeamSlot ? 'match-team--a' : 'match-team--ct'}`}>
                <div className="match-team-header">
                  <span className="match-team-name">
                    {teamNameA} {winnerLabelA && <span className="match-winner-badge">VENCEDOR</span>}
                  </span>
                  <span className="match-team-score">{scoreA}</span>
                </div>
                <table className="match-team-table">
                  <thead>
                    <tr>
                      <th>Jogador</th>
                      <th>K</th>
                      <th>D</th>
                      <th>A</th>
                      <th>HS</th>
                      <th>ADR</th>
                      <th>Pontos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamA.map((p) => (
                      <tr key={p.steamId}>
                        <td className="match-player-cell">
                          <Avatar avatarUrl={p.avatarUrl ?? profile?.profilesBySteam?.[p.steamId]?.avatarUrl} className="match-player-avatar" />
                          <span className="match-player-name">
                            {p.displayName ?? profile?.profilesBySteam?.[p.steamId]?.displayName ?? p.steamId}
                          </span>
                        </td>
                        <td>{p.kills}</td>
                        <td>{p.deaths}</td>
                        <td>{p.assists}</td>
                        <td>{p.headshots}</td>
                        <td>{p.adr != null ? Number(p.adr).toFixed(1) : '—'}</td>
                        <td>
                          {typeof p.pointsDelta === 'number' ? (
                            <span className={`match-points-delta ${p.pointsDelta >= 0 ? 'pos' : 'neg'}`}>
                              {p.pointsDelta >= 0 ? `+${p.pointsDelta}` : String(p.pointsDelta)}
                            </span>
                          ) : (
                            <span style={{ color: 'rgba(148,163,184,0.7)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={`match-team ${byTeamSlot ? 'match-team--b' : 'match-team--tr'}`}>
                <div className="match-team-header">
                  <span className="match-team-name">
                    {teamNameB} {winnerLabelB && <span className="match-winner-badge">VENCEDOR</span>}
                  </span>
                  <span className="match-team-score">{scoreB}</span>
                </div>
                <table className="match-team-table">
                  <thead>
                    <tr>
                      <th>Jogador</th>
                      <th>K</th>
                      <th>D</th>
                      <th>A</th>
                      <th>HS</th>
                      <th>ADR</th>
                      <th>Pontos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamB.map((p) => (
                      <tr key={p.steamId}>
                        <td className="match-player-cell">
                          <Avatar avatarUrl={p.avatarUrl ?? profile?.profilesBySteam?.[p.steamId]?.avatarUrl} className="match-player-avatar" />
                          <span className="match-player-name">
                            {p.displayName ?? profile?.profilesBySteam?.[p.steamId]?.displayName ?? p.steamId}
                          </span>
                        </td>
                        <td>{p.kills}</td>
                        <td>{p.deaths}</td>
                        <td>{p.assists}</td>
                        <td>{p.headshots}</td>
                        <td>{p.adr != null ? Number(p.adr).toFixed(1) : '—'}</td>
                        <td>
                          {typeof p.pointsDelta === 'number' ? (
                            <span className={`match-points-delta ${p.pointsDelta >= 0 ? 'pos' : 'neg'}`}>
                              {p.pointsDelta >= 0 ? `+${p.pointsDelta}` : String(p.pointsDelta)}
                            </span>
                          ) : (
                            <span style={{ color: 'rgba(148,163,184,0.7)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
      <style>{`
        .match-main {
          flex: 1;
          padding: 24px 16px 40px;
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .match-loading, .match-error {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: var(--text);
          padding: 40px 0;
        }
        .match-error {
          color: #fecaca;
        }
        .match-error-icon {
          font-weight: bold;
          font-size: 18px;
        }
        .match-hero {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          min-height: 160px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.55);
        }
        .match-hero-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transform: scale(1.1);
          filter: saturate(1.2) brightness(0.7);
        }
        .match-hero-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 0 0, rgba(56,189,248,0.35), transparent 55%), radial-gradient(circle at 100% 0, rgba(234,179,8,0.4), transparent 55%), linear-gradient(180deg, rgba(15,23,42,0.95), rgba(15,23,42,0.96));
        }
        .match-hero-content {
          position: relative;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .match-hero-title-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px 14px;
          margin-bottom: 6px;
        }
        .match-map-name {
          font-family: var(--font-head);
          font-size: 1.8rem;
          letter-spacing: 4px;
          color: #f9fafb;
          margin: 0;
        }
        .match-game-mode-badge {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(245, 166, 35, 0.22);
          color: #fcd34d;
          border: 1px solid rgba(245, 166, 35, 0.45);
        }
        .match-date {
          margin: 0;
          font-size: 0.85rem;
          color: rgba(226,232,240,0.8);
        }
        .match-id-label {
          margin: 6px 0 0;
          font-size: 0.75rem;
          color: rgba(148,163,184,0.9);
        }
        .match-share-btn {
          margin-top: 8px;
          padding: 6px 12px;
          font-size: 0.8rem;
          color: rgba(56,189,248,0.95);
          background: rgba(56,189,248,0.15);
          border: 1px solid rgba(56,189,248,0.4);
          border-radius: 8px;
          cursor: pointer;
        }
        .match-share-btn:hover {
          background: rgba(56,189,248,0.25);
        }
        .match-hero-score {
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-family: var(--font-mono);
        }
        .match-score-ct,
        .match-score-tr {
          font-size: 2.4rem;
          font-weight: 800;
          color: #f9fafb;
        }
        .match-score-sep {
          font-size: 1.4rem;
          color: rgba(148,163,184,0.9);
        }
        .match-teams {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }
        .match-team {
          background: rgba(15,23,42,0.92);
          border-radius: 16px;
          border: 1px solid rgba(148,163,184,0.4);
          box-shadow: 0 10px 30px rgba(0,0,0,0.45);
          overflow: hidden;
        }
        .match-team-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: linear-gradient(90deg, rgba(15,23,42,0.98), rgba(30,64,175,0.6));
        }
        .match-team--tr .match-team-header,
        .match-team--b .match-team-header {
          background: linear-gradient(90deg, rgba(15,23,42,0.98), rgba(185,28,28,0.7));
        }
        .match-team--a .match-team-header {
          background: linear-gradient(90deg, rgba(15,23,42,0.98), rgba(30,64,175,0.6));
        }
        .match-team-name {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: rgba(226,232,240,0.9);
        }
        .match-winner-badge {
          display: inline-block;
          margin-left: 10px;
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 0.7rem;
          letter-spacing: 1px;
          color: rgba(15,23,42,0.95);
          background: rgba(245,166,35,0.95);
          border: 1px solid rgba(245,166,35,0.85);
          vertical-align: middle;
        }
        .match-team-score {
          font-family: var(--font-mono);
          font-size: 1.4rem;
          color: #f9fafb;
        }
        .match-team-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .match-team-table thead {
          background: rgba(15,23,42,0.95);
        }
        .match-team-table th {
          text-align: left;
          padding: 8px 12px;
          font-weight: 500;
          color: rgba(148,163,184,0.95);
          border-bottom: 1px solid rgba(30,41,59,0.9);
        }
        .match-team-table td {
          padding: 8px 12px;
          border-bottom: 1px solid rgba(30,41,59,0.85);
          color: rgba(226,232,240,0.9);
        }
        .match-player-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .match-player-avatar {
          width: 24px;
          height: 24px;
          border-radius: 999px;
        }
        .match-player-name {
          max-width: 140px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .match-points-delta {
          font-family: var(--font-mono);
          font-weight: 700;
        }
        .match-points-delta.pos { color: rgba(74,222,128,0.95); }
        .match-points-delta.neg { color: rgba(248,113,113,0.95); }
      `}</style>
    </div>
  );
}

