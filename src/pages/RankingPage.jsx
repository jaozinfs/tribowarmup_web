import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { HamburgerNav } from '../components/HamburgerNav';
import { Avatar } from '../components/Avatar';
import { getLevelStyle } from '../utils/levelStyle';
import { getApiBaseUrl } from '../utils/apiBase';
import './RankingPage.css';
import { TrackedButton } from '../components/TrackedButton';

function PodiumPlayer({ player, rank, currentUser }) {
  const levelStyle = getLevelStyle(player.level);
  const isMe = currentUser && player.steamId === currentUser;
  const isVip = Boolean(player.isVip);
  const trophies = ['🥇', '🥈', '🥉'];
  return (
    <div className={`ranking-podium-player ranking-podium-player--${rank} ${isVip ? 'ranking-podium-player--vip' : ''}`}>
      {isVip && <div className="ranking-podium-vip-paper" aria-hidden />}
      <div className="ranking-podium-avatar-wrap">
        <span className="ranking-podium-trophy" aria-hidden="true">{trophies[rank - 1]}</span>
        <Avatar avatarUrl={player.avatarUrl} className="ranking-podium-avatar" loading={rank === 1 ? 'eager' : 'lazy'} />
        {isMe && <span className="ranking-podium-me">VOCÊ</span>}
      </div>
      {isVip && <span className="ranking-podium-vip-badge" title="VIP">VIP</span>}
      <span className="ranking-podium-name">{player.displayName}</span>
      <div className="ranking-podium-stats">
        <span className="ranking-podium-level" style={{ backgroundColor: levelStyle.backgroundColor, color: levelStyle.color }}>
          LVL {player.level}
        </span>
        <span className="ranking-podium-points">{player.points ?? 0} pts</span>
        <span className="ranking-podium-wins">{player.wins}V</span>
        <span className="ranking-podium-losses">{player.losses}D</span>
      </div>
    </div>
  );
}

function PodiumSquad({ squad, rank }) {
  const trophies = ['🥇', '🥈', '🥉'];
  const trophy = trophies[rank - 1];
  return (
    <div className={`ranking-podium-player ranking-podium-player--${rank} ranking-podium-squad`}>
      <div className="ranking-podium-avatar-wrap">
        <span className="ranking-podium-trophy" aria-hidden="true">{trophy}</span>
        {squad.logoUrl ? (
          <img src={squad.logoUrl} alt="" className="ranking-podium-squad-logo" />
        ) : (
          <Avatar avatarUrl={squad.leaderAvatarUrl} className="ranking-podium-avatar" loading={rank === 1 ? 'eager' : 'lazy'} />
        )}
      </div>
      <span className="ranking-podium-name">{squad.name}</span>
      <span className="ranking-podium-squad-leader">Líder: {squad.leaderName || '—'}</span>
      <div className="ranking-podium-stats">
        <span className="ranking-podium-points">{squad.points ?? 0} pts</span>
        <span className="ranking-podium-wins">{squad.wins ?? 0}V</span>
        <span className="ranking-podium-losses">{squad.losses ?? 0}D</span>
      </div>
    </div>
  );
}

const TAB_SOLO = 'solo';
const TAB_WARMUP = 'warmup';
const TAB_SQUADS = 'squads';
const TAB_AFFILIATES = 'affiliates';

function WarmupPodiumPlayer({ player, rank, currentUser }) {
  const isMe = currentUser && player.steamId === currentUser;
  return (
    <div className={`ranking-podium-player ranking-podium-player--${rank}`}>
      <div className="ranking-podium-avatar-wrap">
        <span className="ranking-podium-trophy" aria-hidden="true">{['🥇','🥈','🥉'][rank-1]}</span>
        <Avatar avatarUrl={player.avatarUrl} className="ranking-podium-avatar" />
        {isMe && <span className="ranking-podium-me">VOCÊ</span>}
      </div>
      <span className="ranking-podium-name">{player.displayName}</span>
      <div className="ranking-podium-stats">
        <span className="ranking-podium-points">K: {player.totalKills} | D: {player.totalDeaths}</span>
        <span className="ranking-podium-wins">KD: {Number(player.kd).toFixed(2)}</span>
        <span className="ranking-podium-losses">HS%: {Number(player.hsPercent).toFixed(1)}%</span>
      </div>
    </div>
  );
}

export default function RankingPage() {
  const auth = useAuth();
  const profile = useProfile();
  const [tab, setTab] = useState(TAB_WARMUP);
  const [ranking, setRanking] = useState([]);
  const [squadsRanking, setSquadsRanking] = useState([]);
  const [affiliatesRanking, setAffiliatesRanking] = useState([]);
  const [warmupRanking, setWarmupRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warmupLoading, setWarmupLoading] = useState(false);
  const [squadsLoading, setSquadsLoading] = useState(false);
  const [affiliatesLoading, setAffiliatesLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSolo = useCallback(() => {
    const url = `${getApiBaseUrl()}/api/ranking`;
    setLoading(true);
    setError(null);
    fetch(url, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setRanking(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err.message || 'Erro ao carregar ranking');
        setRanking([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchSquads = useCallback(() => {
    const url = `${getApiBaseUrl()}/api/ranking/squads`;
    setSquadsLoading(true);
    fetch(url, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setSquadsRanking(Array.isArray(data) ? data : []);
      })
      .catch(() => setSquadsRanking([]))
      .finally(() => setSquadsLoading(false));
  }, []);

  const fetchAffiliates = useCallback(() => {
    const url = `${getApiBaseUrl()}/api/ranking/affiliates`;
    setAffiliatesLoading(true);
    fetch(url, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setAffiliatesRanking(Array.isArray(data) ? data : []);
      })
      .catch(() => setAffiliatesRanking([]))
      .finally(() => setAffiliatesLoading(false));
  }, []);

  const fetchWarmup = useCallback(() => {
    const url = `${getApiBaseUrl()}/api/ranking/warmup`;
    setWarmupLoading(true);
    fetch(url, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setWarmupRanking(Array.isArray(data) ? data : []);
      })
      .catch(() => setWarmupRanking([]))
      .finally(() => setWarmupLoading(false));
  }, []);

  useEffect(() => {
    fetchSolo();
  }, [fetchSolo]);

  useEffect(() => {
    if (tab === TAB_SQUADS) fetchSquads();
  }, [tab, fetchSquads]);

  useEffect(() => {
    if (tab === TAB_AFFILIATES) fetchAffiliates();
    if (tab === TAB_WARMUP) fetchWarmup();
  }, [tab, fetchAffiliates, fetchWarmup]);

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);
  const top3Squads = squadsRanking.slice(0, 3);
  const restSquads = squadsRanking.slice(3);
  const top3Affiliates = affiliatesRanking.slice(0, 3);
  const restAffiliates = affiliatesRanking.slice(3);
  const top3Warmup = warmupRanking.slice(0, 3);
  const restWarmup = warmupRanking.slice(3);

  return (
    <div className="app ranking-page">
      <div className="scanlines" />
      <div className="grid-bg" />

      <header className="header ranking-header">
        <div className="header-left">
          <Link to="/" className="logo-hex" aria-label="Início" />
          <div>
            <div className="header-title">RANKING</div>
            <div className="header-sub">WARMUP DM · RANKING PRINCIPAL</div>
          </div>
        </div>
        <HamburgerNav activePath="/ranking" auth={auth} profile={profile} returnTo="/ranking" />
      </header>

      <main className="ranking-main">
        <section className="ranking-hero">
          <h1 className="ranking-title">RANKING</h1>
          <p className="ranking-sub">Warmup DM (principal), PUG e Squads</p>
        </section>

        <div className="ranking-tabs">
          <TrackedButton
            type="button"
            className={`ranking-tab ${tab === TAB_WARMUP ? 'ranking-tab--active' : ''}`}
            onClick={() => setTab(TAB_WARMUP)}
          >
           LEADERBOARD
          </TrackedButton>
          <TrackedButton
            type="button"
            className={`ranking-tab ${tab === TAB_SOLO ? 'ranking-tab--active' : ''}`}
            onClick={() => setTab(TAB_SOLO)}
          >
            PUG SOLO
          </TrackedButton>
          <TrackedButton
            type="button"
            className={`ranking-tab ${tab === TAB_SQUADS ? 'ranking-tab--active' : ''}`}
            onClick={() => setTab(TAB_SQUADS)}
          >
            TIMES (SQUADS)
          </TrackedButton>
          <TrackedButton
            type="button"
            className={`ranking-tab ${tab === TAB_AFFILIATES ? 'ranking-tab--active' : ''}`}
            onClick={() => setTab(TAB_AFFILIATES)}
          >
            TOP INVITERS
          </TrackedButton>
        </div>

        {tab === TAB_AFFILIATES && (
          <section className="ranking-affiliates-section">
            {affiliatesLoading && (
              <div className="ranking-loading">
                <div className="spinner" />
                <span>Carregando ranking de afiliados...</span>
              </div>
            )}
            {!affiliatesLoading && affiliatesRanking.length === 0 && (
              <div className="ranking-empty">
                <p>Nenhum afiliado no ranking ainda.</p>
                <Link to="/profile" className="ranking-empty-link">Compartilhe seu link de indicação no perfil</Link>
              </div>
            )}
            {!affiliatesLoading && affiliatesRanking.length > 0 && (
              <>
                <section className="ranking-podium ranking-podium--squads">
                  <div className="ranking-podium-stage">
                    {top3Affiliates[1] && (
                      <div className="ranking-podium-slot ranking-podium-slot--2">
                        <div className="ranking-podium-player ranking-podium-squad">
                          <div className="ranking-podium-avatar-wrap">
                            <span className="ranking-podium-trophy" aria-hidden="true">🥈</span>
                            <Avatar avatarUrl={top3Affiliates[1].avatarUrl} className="ranking-podium-avatar" />
                          </div>
                          <span className="ranking-podium-name">{top3Affiliates[1].displayName}</span>
                          <span className="ranking-podium-points">{top3Affiliates[1].referredCount} jogadores</span>
                        </div>
                      </div>
                    )}
                    {top3Affiliates[0] && (
                      <div className="ranking-podium-slot ranking-podium-slot--1">
                        <div className="ranking-podium-player ranking-podium-squad">
                          <div className="ranking-podium-avatar-wrap">
                            <span className="ranking-podium-trophy" aria-hidden="true">🥇</span>
                            <Avatar avatarUrl={top3Affiliates[0].avatarUrl} className="ranking-podium-avatar" />
                          </div>
                          <span className="ranking-podium-name">{top3Affiliates[0].displayName}</span>
                          <span className="ranking-podium-points">{top3Affiliates[0].referredCount} jogadores</span>
                        </div>
                      </div>
                    )}
                    {top3Affiliates[2] && (
                      <div className="ranking-podium-slot ranking-podium-slot--3">
                        <div className="ranking-podium-player ranking-podium-squad">
                          <div className="ranking-podium-avatar-wrap">
                            <span className="ranking-podium-trophy" aria-hidden="true">🥉</span>
                            <Avatar avatarUrl={top3Affiliates[2].avatarUrl} className="ranking-podium-avatar" />
                          </div>
                          <span className="ranking-podium-name">{top3Affiliates[2].displayName}</span>
                          <span className="ranking-podium-points">{top3Affiliates[2].referredCount} jogadores</span>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
                <section className="ranking-list-wrap">
                  <div className="ranking-list-header ranking-list-header--squads">
                    <span className="ranking-list-rank">#</span>
                    <span className="ranking-list-avatar-header" aria-hidden="true" />
                    <span className="ranking-list-name">Jogador</span>
                    <span className="ranking-list-points">Jogadores</span>
                  </div>
                  <div className="ranking-list">
                    {restAffiliates.map((row, i) => (
                      <div key={row.steamId} className="ranking-list-row ranking-list-row--squad" style={{ animationDelay: `${i * 0.03}s` }}>
                        <span className="ranking-list-rank">#{row.rank}</span>
                        <Avatar avatarUrl={row.avatarUrl} className="ranking-list-avatar" />
                        <span className="ranking-list-name">{row.displayName}</span>
                        <span className="ranking-list-points">{row.referredCount}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </section>
        )}

        {tab === TAB_WARMUP && (
          <section className="ranking-warmup-section">
            {warmupLoading && (
              <div className="ranking-loading">
                <div className="spinner" />
                <span>Carregando ranking de warmup...</span>
              </div>
            )}
            {!warmupLoading && warmupRanking.length === 0 && (
              <div className="ranking-empty">
                <p>Nenhum registro de warmup ainda. Jogue partidas de warmup para aparecer aqui.</p>
                <Link to="/warmup" className="ranking-empty-link">Ir para Warmup</Link>
              </div>
            )}
            {!warmupLoading && warmupRanking.length > 0 && (
              <>
                <section className="ranking-podium">
                  <div className="ranking-podium-stage">
                    {top3Warmup[1] && (
                      <div className="ranking-podium-slot ranking-podium-slot--2">
                        <WarmupPodiumPlayer player={top3Warmup[1]} rank={2} currentUser={auth.steamId} />
                      </div>
                    )}
                    {top3Warmup[0] && (
                      <div className="ranking-podium-slot ranking-podium-slot--1">
                        <WarmupPodiumPlayer player={top3Warmup[0]} rank={1} currentUser={auth.steamId} />
                      </div>
                    )}
                    {top3Warmup[2] && (
                      <div className="ranking-podium-slot ranking-podium-slot--3">
                        <WarmupPodiumPlayer player={top3Warmup[2]} rank={3} currentUser={auth.steamId} />
                      </div>
                    )}
                  </div>
                </section>
                <section className="ranking-list-wrap">
                  <div className="ranking-list-header">
                    <span className="ranking-list-rank">#</span>
                    <span className="ranking-list-avatar-header" aria-hidden="true" />
                    <span className="ranking-list-name">Jogador</span>
                    <span className="ranking-list-level">K</span>
                    <span className="ranking-list-points">D</span>
                    <span className="ranking-list-wins">KD</span>
                    <span className="ranking-list-losses">HS%</span>
                    <span className="ranking-list-points">Avg Tiros</span>
                    <span className="ranking-list-points">Reaction</span>
                  </div>
                  <div className="ranking-list">
                    {restWarmup.map((player, i) => {
                      const rank = i + 4;
                      const isMe = auth.steamId && player.steamId === auth.steamId;
                      return (
                        <div
                          key={player.steamId}
                          className={`ranking-list-row ${isMe ? 'ranking-list-row--me' : ''}`}
                          style={{ animationDelay: `${i * 0.03}s` }}
                        >
                          <span className="ranking-list-rank">#{rank}</span>
                          <Avatar avatarUrl={player.avatarUrl} className="ranking-list-avatar" />
                          <span className="ranking-list-name">{player.displayName}</span>
                          <span className="ranking-list-level">{player.totalKills}</span>
                          <span className="ranking-list-points">{player.totalDeaths}</span>
                          <span className="ranking-list-wins">{Number(player.kd).toFixed(2)}</span>
                          <span className="ranking-list-losses">{Number(player.hsPercent).toFixed(1)}%</span>
                          <span className="ranking-list-points">{Number(player.avgShotsToKill).toFixed(2)}</span>
                          <span className="ranking-list-points">{player.avgReactionMs ? `${player.avgReactionMs}ms` : '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            )}
          </section>
        )}

        {tab === TAB_SQUADS && (
          <section className="ranking-squads-section">
            {squadsLoading && (
              <div className="ranking-loading">
                <div className="spinner" />
                <span>Carregando ranking de times...</span>
              </div>
            )}
            {!squadsLoading && squadsRanking.length === 0 && (
              <div className="ranking-empty">
                <p>Nenhum time no ranking ainda.</p>
                <Link to="/squad" className="ranking-empty-link">Crie um squad e jogue partidas Squad</Link>
              </div>
            )}
            {!squadsLoading && squadsRanking.length > 0 && (
              <>
                <section className="ranking-podium ranking-podium--squads">
                  <div className="ranking-podium-stage">
                    {top3Squads[1] && (
                      <div className="ranking-podium-slot ranking-podium-slot--2">
                        <PodiumSquad squad={top3Squads[1]} rank={2} />
                      </div>
                    )}
                    {top3Squads[0] && (
                      <div className="ranking-podium-slot ranking-podium-slot--1">
                        <PodiumSquad squad={top3Squads[0]} rank={1} />
                      </div>
                    )}
                    {top3Squads[2] && (
                      <div className="ranking-podium-slot ranking-podium-slot--3">
                        <PodiumSquad squad={top3Squads[2]} rank={3} />
                      </div>
                    )}
                  </div>
                </section>
                <section className="ranking-list-wrap">
                <div className="ranking-list-header ranking-list-header--squads">
                  <span className="ranking-list-rank">#</span>
                  <span className="ranking-list-avatar-header" aria-hidden="true" />
                  <span className="ranking-list-name">Time</span>
                  <span className="ranking-list-level">Líder</span>
                  <span className="ranking-list-points">Pts</span>
                  <span className="ranking-list-wins">V</span>
                  <span className="ranking-list-losses">D</span>
                </div>
                <div className="ranking-list">
                  {restSquads.map((squad, i) => {
                    const rank = i + 4;
                    return (
                      <div key={squad.id} className="ranking-list-row ranking-list-row--squad" style={{ animationDelay: `${i * 0.03}s` }}>
                        <span className="ranking-list-rank">#{rank}</span>
                        <Avatar avatarUrl={squad.leaderAvatarUrl} className="ranking-list-avatar" />
                        <span className="ranking-list-name">{squad.name}</span>
                        <span className="ranking-list-squad-leader">{squad.leaderName}</span>
                        <span className="ranking-list-points">{squad.points ?? 0}</span>
                        <span className="ranking-list-wins">{squad.wins ?? 0}</span>
                        <span className="ranking-list-losses">{squad.losses ?? 0}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
              </>
            )}
          </section>
        )}

        {tab === TAB_SOLO && loading && (
          <div className="ranking-loading">
            <div className="spinner" />
            <span>Carregando ranking...</span>
          </div>
        )}
        {tab === TAB_SOLO && error && (
          <div className="ranking-error">{error}</div>
        )}
        {tab === TAB_SOLO && !loading && !error && ranking.length === 0 && (
          <div className="ranking-empty">
            <p>Nenhum jogador no ranking ainda.</p>
            <Link to="/pug" className="ranking-empty-link">Jogue uma partida para entrar</Link>
          </div>
        )}
        {tab === TAB_SOLO && !loading && !error && ranking.length > 0 && (
          <>
            {/* Pódio — Top 3 destacados */}
            <section className="ranking-podium">
              <div className="ranking-podium-stage">
                {top3[1] && (
                  <div className="ranking-podium-slot ranking-podium-slot--2">
                    <PodiumPlayer player={top3[1]} rank={2} currentUser={auth.steamId} />
                  </div>
                )}
                {top3[0] && (
                  <div className="ranking-podium-slot ranking-podium-slot--1">
                    <PodiumPlayer player={top3[0]} rank={1} currentUser={auth.steamId} />
                  </div>
                )}
                {top3[2] && (
                  <div className="ranking-podium-slot ranking-podium-slot--3">
                    <PodiumPlayer player={top3[2]} rank={3} currentUser={auth.steamId} />
                  </div>
                )}
              </div>
            </section>

            {/* Lista do restante */}
            <section className="ranking-list-wrap">
              <div className="ranking-list-header">
                <span className="ranking-list-rank">#</span>
                <span className="ranking-list-avatar-header" aria-hidden="true" />
                <span className="ranking-list-name">Jogador</span>
                <span className="ranking-list-badge-cell" aria-hidden="true" />
                <span className="ranking-list-level">LVL</span>
                <span className="ranking-list-vip-cell" aria-hidden="true" />
                <span className="ranking-list-points">Pts</span>
                <span className="ranking-list-wins">V</span>
                <span className="ranking-list-losses">D</span>
              </div>
              <div className="ranking-list">
                {rest.map((player, i) => {
                  const rank = i + 4;
                  const levelStyle = getLevelStyle(player.level);
                  const isMe = auth.steamId && player.steamId === auth.steamId;
                  return (
                    <div
                      key={player.steamId}
                      className={`ranking-list-row ${isMe ? 'ranking-list-row--me' : ''}`}
                      style={{ animationDelay: `${i * 0.03}s` }}
                    >
                      <span className="ranking-list-rank">#{rank}</span>
                      <Avatar avatarUrl={player.avatarUrl} className="ranking-list-avatar" />
                      <span className="ranking-list-name">{player.displayName}</span>
                      <span className="ranking-list-badge-cell">{isMe ? <span className="ranking-list-me-badge">VOCÊ</span> : ''}</span>
                      <span className="ranking-list-level" style={{ backgroundColor: levelStyle.backgroundColor, color: levelStyle.color }}>
                        {player.level}
                      </span>
                      <span className="ranking-list-vip-cell">{player.isVip ? <span className="ranking-list-vip">VIP</span> : ''}</span>
                      <span className="ranking-list-points">{player.points ?? 0}</span>
                      <span className="ranking-list-wins">{player.wins ?? 0}</span>
                      <span className="ranking-list-losses">{player.losses ?? 0}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
