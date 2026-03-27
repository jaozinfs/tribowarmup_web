import { useEffect, useMemo, useState } from 'react';
import {
  fetchFantasyGlobalRanking,
  fetchFantasyLeagueRanking,
  fetchFantasyPlayers,
  fetchFantasyWeeklyRanking,
  fetchFantasyWeekMeta,
  fetchMyFantasyLeagues,
} from '../../services/fantasyService';

function fmtRemaining(ms) {
  const x = Math.max(0, Number(ms || 0));
  const totalSec = Math.floor(x / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function lpColor(lp) {
  const n = Number(lp || 0);
  if (n >= 85) return 'lp-elite';
  if (n >= 65) return 'lp-gold';
  if (n >= 40) return 'lp-silver';
  return 'lp-bronze';
}

export default function FantasyRankingPage() {
  const [weekKey, setWeekKey] = useState('');
  const [globalRanking, setGlobalRanking] = useState([]);
  const [weeklyRanking, setWeeklyRanking] = useState([]);
  const [leagueRanking, setLeagueRanking] = useState([]);
  const [leagueId, setLeagueId] = useState('');
  const [leagues, setLeagues] = useState([]);
  const [meta, setMeta] = useState(null);
  const [weeklyPage, setWeeklyPage] = useState(1);
  const [globalPage, setGlobalPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [playersData, weekMeta] = await Promise.all([fetchFantasyPlayers(), fetchFantasyWeekMeta()]);
        if (!alive) return;
        setWeekKey(playersData.weekKey);
        setMeta(weekMeta);
        const [g, w, myLeagues] = await Promise.all([
          fetchFantasyGlobalRanking(),
          fetchFantasyWeeklyRanking(playersData.weekKey),
          fetchMyFantasyLeagues(),
        ]);
        if (!alive) return;
        setGlobalRanking(g || []);
        setWeeklyRanking(w || []);
        setLeagues(myLeagues || []);
        if ((myLeagues || []).length) setLeagueId(String(myLeagues[0].id));
      } catch (err) {
        if (alive) setError(err.message || 'Erro ao carregar ranking fantasy');
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!meta?.nextResetAt) return undefined;
    const t = setInterval(() => {
      setMeta((prev) => (prev ? { ...prev, msRemaining: Math.max(0, new Date(prev.nextResetAt).getTime() - Date.now()) } : prev));
    }, 1000);
    return () => clearInterval(t);
  }, [meta?.nextResetAt]);

  useEffect(() => {
    if (!leagueId) {
      setLeagueRanking([]);
      return;
    }
    fetchFantasyLeagueRanking(leagueId, weekKey)
      .then((r) => setLeagueRanking(Array.isArray(r) ? r : []))
      .catch((err) => setError(err.message || 'Erro ao carregar ranking da liga'));
  }, [leagueId, weekKey]);

  const weeklyPaged = useMemo(() => {
    const pageSize = 25;
    const total = weeklyRanking.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.max(1, Math.min(totalPages, weeklyPage));
    const start = (page - 1) * pageSize;
    return {
      items: weeklyRanking.slice(start, start + pageSize),
      page,
      totalPages,
      total,
      pageSize,
    };
  }, [weeklyRanking, weeklyPage]);

  const globalPaged = useMemo(() => {
    const pageSize = 25;
    const total = globalRanking.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.max(1, Math.min(totalPages, globalPage));
    const start = (page - 1) * pageSize;
    return {
      items: globalRanking.slice(start, start + pageSize),
      page,
      totalPages,
      total,
      pageSize,
    };
  }, [globalRanking, globalPage]);

  return (
    <section className="fantasy-page-content">
      {error && <div className="fantasy-error-banner">{error}</div>}
      <div className="fantasy-rank-hero">
        <div>
          <p className="fantasy-hero-badge">RANKING SNAPFANTASY</p>
          <h2 style={{ margin: '8px 0 0' }}>Semana {weekKey || '—'}</h2>
          <p className="fantasy-rank-sub">Domingo 22:00 fecha e recalcula pontuações.</p>
        </div>
        <div className="fantasy-rank-countdown">
          <span>Próximo reset</span>
          <strong>{meta?.msRemaining != null ? fmtRemaining(meta.msRemaining) : '—'}</strong>
        </div>
      </div>

      <div className="fantasy-ranking-grid">
        <article className="fantasy-ranking-panel">
          <div className="fantasy-rank-panel-head">
            <h2>Ranking Semanal</h2>
            <div className="fantasy-rank-pager">
              <button type="button" onClick={() => setWeeklyPage((p) => Math.max(1, p - 1))} disabled={weeklyPaged.page <= 1}>‹</button>
              <span>{weeklyPaged.page} / {weeklyPaged.totalPages}</span>
              <button type="button" onClick={() => setWeeklyPage((p) => Math.min(weeklyPaged.totalPages, p + 1))} disabled={weeklyPaged.page >= weeklyPaged.totalPages}>›</button>
            </div>
          </div>
          <div className="fantasy-rank-table">
            {weeklyPaged.items.map((r) => {
              const lp = r.weeklyLp ?? r.weeklyPoints ?? 0;
              const top = Number(r.position || 0) <= 10;
              return (
                <div key={`${r.userId}-${r.position}`} className={`fantasy-rank-row ${top ? 'top' : ''}`}>
                  <div className="pos">{r.position}</div>
                  <div className="user">
                    {r.avatarUrl ? <img src={r.avatarUrl} alt="" className="avatar" referrerPolicy="no-referrer" /> : <div className="avatar avatar--fallback" />}
                    <div className="name">{r.displayName}</div>
                  </div>
                  <div className={`lp ${lpColor(lp)}`}>{Number(lp)} <small>LP</small></div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="fantasy-ranking-panel">
          <div className="fantasy-rank-panel-head">
            <h2>Ranking Global</h2>
            <div className="fantasy-rank-pager">
              <button type="button" onClick={() => setGlobalPage((p) => Math.max(1, p - 1))} disabled={globalPaged.page <= 1}>‹</button>
              <span>{globalPaged.page} / {globalPaged.totalPages}</span>
              <button type="button" onClick={() => setGlobalPage((p) => Math.min(globalPaged.totalPages, p + 1))} disabled={globalPaged.page >= globalPaged.totalPages}>›</button>
            </div>
          </div>
          <div className="fantasy-rank-table">
            {globalPaged.items.map((r) => {
              const lp = r.totalLp ?? r.totalPoints ?? 0;
              const top = Number(r.position || 0) <= 10;
              return (
                <div key={`${r.userId}-${r.position}`} className={`fantasy-rank-row ${top ? 'top' : ''}`}>
                  <div className="pos">{r.position}</div>
                  <div className="user">
                    {r.avatarUrl ? <img src={r.avatarUrl} alt="" className="avatar" referrerPolicy="no-referrer" /> : <div className="avatar avatar--fallback" />}
                    <div className="name">{r.displayName}</div>
                  </div>
                  <div className={`lp ${lpColor(lp)}`}>{Number(lp)} <small>LP</small></div>
                </div>
              );
            })}
          </div>
        </article>
      </div>

      <article className="fantasy-ranking-panel">
        <div className="fantasy-league-head">
          <h2>Liga Privada</h2>
          <select value={leagueId} onChange={(e) => setLeagueId(e.target.value)}>
            <option value="">Selecione uma liga</option>
            {leagues.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="fantasy-rank-table fantasy-rank-table--league">
          {leagueRanking.map((r) => {
            const lp = r.weeklyLp ?? r.weeklyPoints ?? 0;
            const top = Number(r.position || 0) <= 10;
            return (
              <div key={`${r.userId}-${r.position}`} className={`fantasy-rank-row ${top ? 'top' : ''}`}>
                <div className="pos">{r.position}</div>
                <div className="user">
                  {r.avatarUrl ? <img src={r.avatarUrl} alt="" className="avatar" referrerPolicy="no-referrer" /> : <div className="avatar avatar--fallback" />}
                  <div className="name">{r.displayName}</div>
                </div>
                <div className={`lp ${lpColor(lp)}`}>{Number(lp)} <small>LP</small></div>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
}

