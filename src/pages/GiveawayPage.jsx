import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { HamburgerNav } from '../components/HamburgerNav';
import { FortuneWheel } from '../components/FortuneWheel/FortuneWheel';
import '../index.css';
import { TrackedButton } from '../components/TrackedButton';

export default function GiveawayPage() {
  const auth = useAuth();
  const profile = useProfile();
  const navigate = useNavigate();
  const [state, setState] = useState({ points: 0, tickets: 0 });
  const [pointsDelta, setPointsDelta] = useState(null);
  const [ticketsPulseKey, setTicketsPulseKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [prizes, setPrizes] = useState([]);

  useEffect(() => {
    if (!auth.steamId && !auth.loading) {
      navigate('/vip');
    }
  }, [auth.steamId, auth.loading, navigate]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/giveaway/state')
      .then((r) => {
        if (r.status === 403) {
          return r.json().then(() => {
            setError('Apenas VIPs podem acessar este sorteio.');
            setLoading(false);
          });
        }
        if (!r.ok) return r.json().then((j) => Promise.reject(j));
        return r.json().then((json) => {
          setState({ points: json.points || 0, tickets: json.tickets || 0 });
          setPrizes(Array.isArray(json.prizes) ? json.prizes : []);
          setLoading(false);
        });
      })
      .catch((e) => {
        if (loading) setLoading(false);
        setError(e?.error || 'Erro ao carregar estado do sorteio.');
      });
  }, []);

  const handleSpin = () => {
    if (state.tickets <= 0) {
      setError('Você não possui fichas suficientes.');
      return null;
    }
    setError(null);
    return fetch('/api/giveaway/spin', { method: 'POST' })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((json) => {
        setState((prev) => {
          const prevTickets = prev.tickets;
          const nextTickets = json.remainingTickets;
          if (nextTickets !== prevTickets) {
            setTicketsPulseKey(Date.now());
          }
          return {
            ...prev,
            tickets: nextTickets,
            points: json.points ?? prev.points,
          };
        });
        return { ...json.prize, inventoryId: json.inventoryId };
      })
      .catch((e) => {
        setError(e?.error || 'Erro ao girar a roda.');
        throw e;
      });
  };

  const handleSpinComplete = (prize) => {
    setResult(prize);
  };

  const [exchanging, setExchanging] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);

  const handleExchange = () => {
    if (state.points < 10) {
      setError('Você precisa de pelo menos 10 pontos para converter em ficha.');
      return;
    }
    setError(null);
    setExchanging(true);
    fetch('/api/giveaway/exchange', { method: 'POST' })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((json) => {
        const prevPoints = state.points;
        const prevTickets = state.tickets;
        const nextPoints = json.points || 0;
        const nextTickets = json.tickets || 0;
        setState({ points: nextPoints, tickets: nextTickets });

        const spent = prevPoints - nextPoints;
        if (spent > 0) {
          setPointsDelta({ value: spent, key: Date.now() });
          setTimeout(() => setPointsDelta(null), 900);
        }
        if (nextTickets !== prevTickets) {
          setTicketsPulseKey(Date.now());
        }
      })
      .catch((e) => {
        setError(e?.error || 'Erro ao converter pontos em ficha.');
      })
      .finally(() => {
        setExchanging(false);
      });
  };

  return (
    <div className="app">
      <div className="scanlines" />
      <div className="grid-bg" />
      <header className="header">
        <div className="header-left">
          <div className="logo-hex" />
          <div>
            <div className="header-title">VIP</div>
            <div className="header-sub">SORTEIO</div>
          </div>
        </div>
        <HamburgerNav activePath="/giveaway" auth={auth} profile={profile} returnTo="/giveaway" />
      </header>
      <main className="giveaway-main">
        <TrackedButton
          type="button"
          className="giveaway-inventory-btn"
          onClick={() => navigate('/inventory')}
          title="Abrir inventário de prêmios"
        >
          <span className="giveaway-inventory-icon" aria-hidden>🎒</span>
          <span className="giveaway-inventory-text">INVENTÁRIO</span>
        </TrackedButton>
        {loading && (
          <div className="giveaway-loading">
            <div className="spinner" />
            <span>Carregando sorteio VIP...</span>
          </div>
        )}
        {!loading && error && (
          <div className="giveaway-error">
            <span>{error}</span>
          </div>
        )}
        {!loading && !error && (
          <>
            <section className="giveaway-summary">
              <div className="giveaway-summary-card">
                <div>
                  <h1 className="giveaway-main-title">Snaptap Giveaway</h1>
                  <p className="giveaway-main-desc">
                    Jogue com seus amigos em salas PUG ou warmup, use todas as skins liberadas e acumule pontos para girar
                    a roleta e concorrer a itens no servidor oficial da Valve.
                  </p>
                </div>
                <div className="giveaway-summary-stats">
                  <div className="giveaway-summary-stat giveaway-summary-stat--points">
                    <span className="giveaway-summary-label">
                      Pontos <span className="giveaway-summary-month">(mês atual)</span>
                    </span>
                    <span className="giveaway-summary-value giveaway-summary-value--points">
                      <span className="giveaway-summary-value-inner">
                        {state.points}
                      </span>
                      {pointsDelta && pointsDelta.value > 0 && (
                        <span key={pointsDelta.key} className="giveaway-points-delta">
                          -{pointsDelta.value}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="giveaway-summary-stat">
                    <span className="giveaway-summary-label">
                      Fichas <span className="giveaway-summary-month">(mês atual)</span>
                    </span>
                    <span
                      className={`giveaway-summary-value giveaway-summary-value--tickets${
                        ticketsPulseKey ? ' giveaway-summary-value--tickets-pulse' : ''
                      }`}
                      key={ticketsPulseKey}
                    >
                      {state.tickets}
                    </span>
                  </div>
                </div>
                <TrackedButton
                  type="button"
                  className={`giveaway-exchange-btn${
                    exchanging ? ' giveaway-exchange-btn--busy' : ''
                  }`}
                  onClick={handleExchange}
                  disabled={state.points < 10 || exchanging}
                >
                  <span className="giveaway-exchange-gear" aria-hidden="true" />
                  <span className="giveaway-exchange-text">
                    {exchanging ? 'Convertendo...' : 'Converter 10 pontos em 1 ficha'}
                  </span>
                </TrackedButton>
              </div>
            </section>

            <section className="giveaway-how-section">
              <h2 className="giveaway-how-title">Como funcionam os pontos</h2>
              <div className="giveaway-how-grid">
                <article className="giveaway-how-card">
                  <h3>1. Jogue nos nossos servidores</h3>
                  <p>
                    Entre em salas PUG ou warmup com seus amigos, treine suas táticas e aproveite todas as skins liberadas
                    no servidor sem pagar nada.
                  </p>
                </article>
                <article className="giveaway-how-card">
                  <h3>2. Ganhe pontos automaticamente</h3>
                  <p>
                    Enquanto você joga, o sistema registra seu tempo de jogo e converte em pontos de forma automática. É só
                    jogar normalmente que os pontos caem na sua conta.
                  </p>
                </article>
                <article className="giveaway-how-card">
                  <h3>3. Gire a roleta e ganhe itens</h3>
                  <p>
                    Use seus pontos para gerar fichas, girar a roleta e ter chance de ganhar skins, VIPs e outros itens que
                    podem ser usados no servidor principal da Valve.
                  </p>
                </article>
              </div>
            </section>

            <section className="giveaway-wheel-section">
              <FortuneWheel
                canSpin={state.tickets > 0}
                tickets={state.tickets}
                onSpinRequest={handleSpin}
                onSpinComplete={handleSpinComplete}
                prizes={prizes}
              />
              {state.tickets <= 0 && (
                <p className="giveaway-no-tickets">
                  Você não possui fichas suficientes. Jogue mais partidas este mês para acumular pontos.
                </p>
              )}
            </section>
            {Array.isArray(prizes) && prizes.length > 0 && (
              <section className="giveaway-prizes-section">
                <h2 className="giveaway-prizes-title">Conteúdo da caixa</h2>
                <div className="giveaway-prizes-grid">
                  {(() => {
                    const totalWeight = prizes.reduce((sum, p) => sum + (p.weight || 0), 0) || 1;
                    const withPct = prizes.map((p) => {
                      const pct = ((p.weight || 0) / totalWeight) * 100;
                      let rarity = 'common';
                      if (pct > 0 && pct <= 1) rarity = 'rare';
                      else if (pct <= 5) rarity = 'medium';
                      return { ...p, pct, rarity };
                    });
                    const byChanceAsc = [...withPct].sort((a, b) => a.pct - b.pct);
                    return byChanceAsc.map((p) => {
                      const displayPct = p.pct > 0 ? `${p.pct.toFixed(p.pct < 1 ? 2 : 1)}%` : '<0.01%';
                      const image = p.image_url || p.image || '/assets/images/fever-case.webp';
                      let typeLabel = 'Voucher';
                      if (p.type === 'skin' || p.type === 'item' || p.type === 'rare') typeLabel = 'Item raro';
                      else if (p.type === 'case' || p.type === 'steam_case') typeLabel = 'Caixa Steam';
                      return (
                        <article
                          key={p.key + p.label}
                          className={`giveaway-prize-card giveaway-prize-card--${p.rarity}`}
                        >
                          <div className="giveaway-prize-thumb">
                            <img src={image} alt={p.label} className="giveaway-prize-thumb-img" loading="lazy" />
                          </div>
                          <div className="giveaway-prize-body">
                            <h3 className="giveaway-prize-name">{p.label}</h3>
                            <div className="giveaway-prize-meta">
                              <span className="giveaway-prize-type">{typeLabel}</span>
                            </div>
                            <span className="giveaway-prize-chance">{displayPct}</span>
                          </div>
                        </article>
                      );
                    });
                  })()}
                </div>
              </section>
            )}
          </>
        )}

        {result && (
          <div className="giveaway-reveal-backdrop" role="dialog" aria-modal="true" aria-labelledby="giveaway-reveal-title">
            <div className="giveaway-reveal-confetti">
              {Array.from({ length: 48 }).map((_, i) => (
                <div
                  key={i}
                  className="giveaway-reveal-confetti-piece"
                  style={{
                    '--delay': `${Math.random() * 0.6}s`,
                    '--x': `calc(-50% + ${(Math.random() - 0.5) * 200}px)`,
                    '--color': ['#22c55e', '#4ade80', '#f97316', '#eab308', '#f43f5e'][i % 5],
                  }}
                />
              ))}
            </div>
            <div className="giveaway-reveal-center">
              <div className="giveaway-reveal-item-orb">
                <img
                  src={
                    result.image_url ||
                    result.image ||
                    (Array.isArray(prizes) && prizes.find((p) => p.key === result.key)?.image_url) ||
                    '/assets/images/fever-case.webp'
                  }
                  alt=""
                  className="giveaway-reveal-item-img"
                />
              </div>
              <h2 id="giveaway-reveal-title" className="giveaway-reveal-title">Você ganhou</h2>
              <p className="giveaway-reveal-label">{result.label}</p>
              <div className="giveaway-reveal-actions">
                {(result.type === 'voucher' || result.type === 'vip_days') && result.inventoryId && (
                  <TrackedButton
                    type="button"
                    className="pug-btn pug-btn-primary giveaway-reveal-redeem-btn"
                    disabled={redeemLoading}
                    onClick={() => {
                      setRedeemLoading(true);
                      fetch(`/api/giveaway/inventory/${result.inventoryId}/redeem`, {
                        method: 'POST',
                        credentials: 'include',
                      })
                        .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
                        .then((json) => {
                          const item = json?.item || {};
                          let meta = item.metadata;
                          if (meta && typeof meta === 'string') {
                            try {
                              meta = JSON.parse(meta);
                            } catch {
                              meta = null;
                            }
                          }
                          const url = meta?.voucherUrl || meta?.url || meta?.voucher_url || '';
                          const label = item.label || result.label;
                          setResult(null);
                          if (json.vip_days_redeemed || (result.type === 'vip_days' && json.vipExpiresAt)) {
                            navigate('/inventory', { state: { openVipRedeem: { label, vipExpiresAt: json.vipExpiresAt || null } } });
                          } else if (url) {
                            navigate('/inventory', { state: { openVoucher: { label, url } } });
                          } else {
                            navigate('/inventory');
                          }
                        })
                        .catch(() => {
                          setRedeemLoading(false);
                        });
                    }}
                  >
                    {redeemLoading ? 'Resgatando...' : 'RESGATAR AGORA'}
                  </TrackedButton>
                )}
                <TrackedButton
                  type="button"
                  className="giveaway-reveal-close"
                  onClick={() => setResult(null)}
                >
                  Fechar
                </TrackedButton>
              </div>
            </div>
          </div>
        )}
      </main>
      <style>{`
        .giveaway-main {
          flex: 1;
          padding: 80px 16px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          position: relative;
          z-index: 10;
          overflow: hidden;
          background:
            radial-gradient(circle at 0% 0%, rgba(56,189,248,0.18), transparent 55%),
            radial-gradient(circle at 100% 0%, rgba(248,113,22,0.18), transparent 55%),
            radial-gradient(circle at 50% 120%, rgba(15,23,42,0.95), #020617);
        }
        .giveaway-inventory-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 20;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,0.7);
          background:
            linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.85)),
            repeating-linear-gradient(90deg, rgba(15,23,42,0.7) 0 2px, rgba(30,41,59,0.9) 2px 4px);
          color: #e5e7eb;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.85), 0 4px 10px rgba(0,0,0,0.8);
          cursor: pointer;
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
        .giveaway-inventory-btn:hover {
          border-color: rgba(250,204,21,0.8);
          box-shadow: 0 0 0 1px rgba(0,0,0,0.9), 0 6px 14px rgba(0,0,0,0.95), 0 0 18px rgba(250,204,21,0.6);
        }
        .giveaway-inventory-icon {
          font-size: 0.9rem;
        }
        .giveaway-inventory-text {
          transform: translateY(0.5px);
        }
        .giveaway-reveal-redeem-btn:disabled {
          opacity: 0.8;
          cursor: wait;
        }
        @media (max-width: 768px) {
          .giveaway-main {
            padding: 72px 12px 32px;
            align-items: stretch;
          }
          .giveaway-summary-card {
            flex-direction: column;
            align-items: flex-start;
          }
          .giveaway-summary-stats {
            width: 100%;
            justify-content: space-between;
          }
          .giveaway-how-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .giveaway-wheel-section {
            width: 100%;
          }
        }
        .giveaway-main::before {
          content: '';
          position: absolute;
          inset: -40%;
          background:
            radial-gradient(circle at 10% 20%, rgba(15,118,110,0.35), transparent 60%),
            radial-gradient(circle at 90% 30%, rgba(234,88,12,0.35), transparent 60%),
            radial-gradient(circle at 50% 60%, rgba(15,23,42,0.85), transparent 65%);
          opacity: 0.9;
          filter: blur(6px);
          mix-blend-mode: screen;
          z-index: -1;
        }
        .giveaway-loading,
        .giveaway-error {
          margin-top: 40px;
          color: var(--text);
        }
        .giveaway-error {
          color: #fecaca;
        }
        .giveaway-summary {
          width: 100%;
          max-width: 960px;
          position: relative;
          z-index: 1;
        }
        .giveaway-how-section {
          width: 100%;
          max-width: 960px;
          margin-top: 16px;
          position: relative;
          z-index: 1;
        }
        .giveaway-how-title {
          margin: 0 0 12px;
          font-family: var(--font-head);
          font-size: 1.1rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #e5e7eb;
        }
        .giveaway-how-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        .giveaway-how-card {
          padding: 14px 16px;
          border-radius: 14px;
          background:
            radial-gradient(circle at 0 0, rgba(34,197,94,0.16), transparent 55%),
            rgba(15,23,42,0.98);
          border: 1px solid rgba(55,65,81,0.9);
          box-shadow: 0 10px 28px rgba(0,0,0,0.75);
        }
        .giveaway-how-card h3 {
          margin: 0 0 6px;
          font-size: 0.95rem;
          color: #f9fafb;
        }
        .giveaway-how-card p {
          margin: 0;
          font-size: 0.82rem;
          line-height: 1.5;
          color: rgba(148,163,184,0.98);
        }
        .giveaway-summary-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 18px 20px;
          border-radius: 16px;
          background: radial-gradient(circle at 0 0, rgba(34,197,94,0.16), transparent 55%), radial-gradient(circle at 100% 0, rgba(249,115,22,0.22), transparent 55%), rgba(15,23,42,0.96);
          border: 1px solid rgba(148,163,184,0.4);
          box-shadow: 0 10px 32px rgba(0,0,0,0.6);
        }
        .giveaway-main-title {
          margin: 0 0 4px;
          font-family: var(--font-head);
          font-size: 1.4rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #f9fafb;
        }
        .giveaway-main-desc {
          margin: 0;
          font-size: 0.9rem;
          color: rgba(148,163,184,0.96);
        }
        .giveaway-summary-stats {
          display: flex;
          gap: 16px;
        }
        .giveaway-summary-stat {
          text-align: right;
        }
        .giveaway-exchange-btn {
          margin-left: 16px;
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid rgba(251,191,36,0.8);
          background:
            radial-gradient(circle at 30% 0, rgba(252,211,77,0.35), transparent 55%),
            linear-gradient(135deg, #78350f, #92400e);
          color: #fef9c3;
          font-family: var(--font-head);
          font-size: 0.8rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.85),
            0 8px 20px rgba(0,0,0,0.9),
            0 0 16px rgba(251,191,36,0.7);
          cursor: pointer;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .giveaway-exchange-btn:hover:not(:disabled) {
          filter: brightness(1.05);
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.9),
            0 10px 26px rgba(0,0,0,1),
            0 0 24px rgba(251,191,36,0.9);
        }
        .giveaway-exchange-btn:disabled {
          opacity: 0.5;
          cursor: default;
        }
        .giveaway-exchange-btn--busy {
          position: relative;
          filter: brightness(1.08);
          animation: giveaway-exchange-pulse 0.9s ease-in-out infinite;
        }
        .giveaway-exchange-btn--busy::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(252,211,77,0.35), transparent);
          transform: translateX(-120%);
          animation: giveaway-exchange-shine 1.1s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes giveaway-exchange-shine {
          0% { transform: translateX(-120%); opacity: 0; }
          35% { opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        @keyframes giveaway-exchange-pulse {
          0% { box-shadow: 0 0 0 1px rgba(0,0,0,0.9), 0 8px 20px rgba(0,0,0,0.9), 0 0 16px rgba(251,191,36,0.55); }
          50% { box-shadow: 0 0 0 1px rgba(0,0,0,1), 0 10px 26px rgba(0,0,0,1), 0 0 26px rgba(251,191,36,0.95); }
          100% { box-shadow: 0 0 0 1px rgba(0,0,0,0.9), 0 8px 20px rgba(0,0,0,0.9), 0 0 16px rgba(251,191,36,0.55); }
        }
        .giveaway-exchange-gear {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(250,250,210,0.9);
          position: relative;
        }
        .giveaway-exchange-gear::before,
        .giveaway-exchange-gear::after {
          content: '';
          position: absolute;
          inset: 3px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: rgba(248,250,252,0.9);
        }
        .giveaway-exchange-gear::after {
          inset: 5px;
          border-top-color: rgba(253,224,71,0.9);
        }
        .giveaway-exchange-btn--busy .giveaway-exchange-gear {
          animation: giveaway-gear-spin 0.6s linear infinite;
        }
        @keyframes giveaway-gear-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .giveaway-summary-label {
          font-size: 0.75rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(148,163,184,0.9);
        }
        .giveaway-summary-month {
          font-size: 0.65rem;
          text-transform: none;
          letter-spacing: 0;
          color: rgba(148,163,184,0.65);
        }
        .giveaway-summary-value {
          display: block;
          margin-top: 4px;
          font-family: var(--font-mono);
          font-size: 1.3rem;
          color: #f97316;
        }
        .giveaway-summary-value--points {
          position: relative;
          min-width: 64px;
        }
        .giveaway-summary-value-inner {
          display: inline-block;
        }
        .giveaway-wheel-section {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          position: relative;
          z-index: 1;
        }
        .giveaway-prizes-section {
          width: 100%;
          max-width: 960px;
          margin-top: 8px;
          position: relative;
          z-index: 1;
        }
        .giveaway-prizes-title {
          margin: 0 0 12px;
          font-family: var(--font-head);
          font-size: 1.1rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #f9fafb;
          text-align: center;
        }
        .giveaway-prizes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }
        .giveaway-prize-card {
          padding: 14px 14px 16px;
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,0.4);
          background: radial-gradient(circle at 0 0, rgba(148,163,184,0.26), transparent 55%), rgba(15,23,42,0.96);
          box-shadow: 0 10px 26px rgba(0,0,0,0.8);
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 10px;
          position: relative;
        }
        .giveaway-prize-card--rare {
          border: 2px solid rgba(250,204,21,0.95);
          background: radial-gradient(ellipse 120% 80% at 50% 0%, rgba(250,204,21,0.22), transparent 50%), radial-gradient(circle at 0 0, rgba(148,163,184,0.2), transparent 55%), rgba(15,23,42,0.98);
          box-shadow: 0 0 32px rgba(250,204,21,0.65), 0 -4px 20px rgba(250,204,21,0.25), inset 0 1px 0 rgba(253,224,71,0.15);
          position: relative;
        }
        .giveaway-prize-card--rare::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 15px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(253,224,71,0.7), rgba(250,204,21,0.4), rgba(253,224,71,0.6));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .giveaway-prize-card--medium {
          border-color: rgba(96,165,250,0.85);
        }
        .giveaway-prize-thumb {
          width: 100%;
          height: 120px;
          border-radius: 10px;
          background: radial-gradient(circle at 30% 20%, rgba(248,250,252,0.15), transparent 55%), #020617;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .giveaway-prize-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 8px 20px rgba(0,0,0,0.8));
        }
        .giveaway-prize-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .giveaway-prize-name {
          margin: 0;
          font-size: 0.95rem;
          color: #f9fafb;
        }
        .giveaway-prize-meta {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          font-size: 0.8rem;
        }
        .giveaway-prize-type {
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(30,64,175,0.4);
          color: #e0f2fe;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .giveaway-prize-chance {
          position: absolute;
          top: 8px;
          left: 10px;
          padding: 2px 10px;
          border-radius: 999px;
          font-size: 0.68rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #fef3c7;
          background: linear-gradient(135deg, rgba(250,204,21,0.06), rgba(250,204,21,0.22));
          border: 1px solid rgba(253,224,71,0.55);
          box-shadow: 0 0 18px rgba(250,204,21,0.45);
        }
        .giveaway-spin-btn {
          margin-top: 4px;
          min-width: 180px;
        }
        .giveaway-no-tickets {
          margin: 4px 0 0;
          font-size: 0.8rem;
          color: rgba(148,163,184,0.9);
        }
        .giveaway-summary-value--tickets {
          position: relative;
        }
        .giveaway-summary-value--tickets-pulse {
          animation: giveaway-tickets-pulse 0.6s ease-out;
        }
        @keyframes giveaway-tickets-pulse {
          0% { transform: scale(1); text-shadow: 0 0 0 rgba(250,204,21,0); }
          40% { transform: scale(1.25); text-shadow: 0 0 18px rgba(250,204,21,0.9); }
          100% { transform: scale(1); text-shadow: 0 0 0 rgba(250,204,21,0); }
        }
        .giveaway-points-delta {
          position: absolute;
          right: 0;
          top: -4px;
          font-size: 0.75rem;
          color: #f97373;
          text-shadow: 0 0 10px rgba(239,68,68,0.9);
          animation: giveaway-points-float 0.9s ease-out forwards;
        }
        @keyframes giveaway-points-float {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .giveaway-reveal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,0.25);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          animation: giveaway-reveal-fadeIn 0.35s ease-out;
        }
        @keyframes giveaway-reveal-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .giveaway-reveal-confetti {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: visible;
        }
        .giveaway-reveal-confetti-piece {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 8px;
          height: 8px;
          border-radius: 2px;
          background: var(--color);
          opacity: 0;
          animation: giveaway-reveal-confetti-fall 1.8s ease-out var(--delay) forwards;
          transform: translate(var(--x), -50%) rotate(0deg);
        }
        @keyframes giveaway-reveal-confetti-fall {
          0% {
            opacity: 1;
            transform: translate(var(--x), -50%) scale(1) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--x), 70vh) scale(0.6) rotate(720deg);
          }
        }
        .giveaway-reveal-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px;
        }
        .giveaway-reveal-item-orb {
          width: 160px;
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          animation: giveaway-reveal-item-out 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: center center;
        }
        @keyframes giveaway-reveal-item-out {
          0% {
            transform: scale(0.15);
            opacity: 0.6;
            filter: brightness(0.7);
          }
          55% {
            transform: scale(1.15);
            opacity: 1;
            filter: brightness(1.2);
          }
          75% {
            transform: scale(1.05);
            filter: brightness(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
            filter: brightness(1);
          }
        }
        .giveaway-reveal-item-orb::before {
          content: '';
          position: absolute;
          inset: -20%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%);
          animation: giveaway-reveal-glow 1.2s ease-out 0.3s infinite alternate;
          pointer-events: none;
        }
        @keyframes giveaway-reveal-glow {
          from { opacity: 0.5; transform: scale(1); }
          to { opacity: 1; transform: scale(1.15); }
        }
        .giveaway-reveal-item-img {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 0 20px rgba(249,115,22,0.5)) drop-shadow(0 8px 32px rgba(0,0,0,0.5));
        }
        .giveaway-reveal-title {
          margin: 0 0 6px;
          font-family: var(--font-head);
          font-size: 1rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #f9fafb;
          text-shadow: 0 0 20px rgba(249,115,22,0.4);
        }
        .giveaway-reveal-label {
          margin: 0 0 20px;
          font-size: 1.2rem;
          font-weight: 600;
          color: #f97316;
          text-shadow: 0 0 16px rgba(249,115,22,0.35);
        }
        .giveaway-reveal-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 14px;
        }
        .giveaway-reveal-close {
          padding: 10px 24px;
          border-radius: 8px;
          border: 1px solid rgba(148,163,184,0.5);
          background: rgba(30,41,59,0.9);
          color: #e2e8f0;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .giveaway-reveal-close:hover {
          background: rgba(51,65,85,0.95);
        }
      `}</style>
    </div>
  );
}

