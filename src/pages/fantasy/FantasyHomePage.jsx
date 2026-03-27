import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { fetchFantasyLatestResults, fetchFantasyWeekMeta } from '../../services/fantasyService';

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

export default function FantasyHomePage() {
  const [meta, setMeta] = useState(null);
  const [latest, setLatest] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [m, l] = await Promise.all([
          fetchFantasyWeekMeta(),
          fetchFantasyLatestResults().catch(() => null),
        ]);
        if (!alive) return;
        setMeta(m);
        setLatest(l);
      } catch (err) {
        if (alive) setError(err?.message || 'Erro ao carregar dados do fantasy');
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

  const myWeeklyLp = useMemo(() => {
    const p = latest?.personal?.weeklyPoints;
    if (typeof p !== 'number') return null;
    const min = -600;
    const max = 6000;
    const t = (p - min) / (max - min);
    return Math.round(Math.max(0, Math.min(1, t)) * 100);
  }, [latest?.personal?.weeklyPoints]);

  return (
    <section className="fantasy-page-content">
      {error && <div className="fantasy-error-banner">{error}</div>}
      <div className="fantasy-hero-panel">
        <p className="fantasy-hero-badge">SNAPFANTASY WEEKLY</p>
        <h1>O fantasy de CS2 mais competitivo da plataforma</h1>
        <div className="fantasy-hero-stats">
          <div className="fantasy-hero-stat">
            <span>Sua pontuação (última semana)</span>
            <strong>{myWeeklyLp != null ? `${myWeeklyLp} LP` : '—'}</strong>
          </div>
          <div className="fantasy-hero-stat">
            <span>Virada semanal</span>
            <strong>{meta?.msRemaining != null ? `em ${fmtRemaining(meta.msRemaining)}` : '—'}</strong>
          </div>
          <div className="fantasy-hero-stat">
            <span>Semana atual</span>
            <strong>{meta?.weekKey || '—'}</strong>
          </div>
        </div>
        <div className="fantasy-hero-cta">
          <Link to="/fantasy/time" className="fantasy-btn fantasy-btn-primary">Montar Time</Link>
          <Link to="/fantasy/ranking" className="fantasy-btn fantasy-btn-glass">Ver Ranking</Link>
        </div>
      </div>

      <div className="fantasy-info-grid">
        <article className="fantasy-info-card">
          <h3>1) Monte seu elenco</h3>
          <p>Escolha 5 titulares + 1 bench e mantenha o budget em 100.</p>
        </article>
        <article className="fantasy-info-card">
          <h3>2) Capitão 2x</h3>
          <p>O capitão multiplica pontos e pode virar a rodada.</p>
        </article>
        <article className="fantasy-info-card">
          <h3>3) Domingo final</h3>
          <p>Domingo 22:00 vira a semana: fecha pontuação, atualiza ranking e libera montar outro time.</p>
        </article>
      </div>
    </section>
  );
}

