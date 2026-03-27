import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { HamburgerNav } from '../components/HamburgerNav';
import { trackVipClickAssinar } from '../utils/analytics';
import '../index.css';
import { TrackedButton } from '../components/TrackedButton';

function VipHeroPerformanceCard() {
  const [heatmapType, setHeatmapType] = useState('deaths');
  const isDeaths = heatmapType === 'deaths';
  return (
    <div className="vip-hero-card vip-hero-card--example vip-hero-card--performance">
      <div className="vip-hero-crown" aria-hidden>👑</div>
      <div className="vip-hero-example-label">Performance avançada</div>
      <p className="vip-hero-example-desc vip-hero-example-desc--top">
        Troque entre mortes e kills no radar por mapa, igual à página Performance PUG.
      </p>
      <div className="vip-hero-example-mock vip-hero-example-mock--large">
        <div className="vip-hero-example-bar">
          <span className="vip-hero-example-tab">PERFORMANCE</span>
          <span className="vip-hero-example-pill">VIP</span>
        </div>
        <div className="vip-hero-perf-toggle">
          <TrackedButton
            type="button"
            className={`vip-hero-perf-toggle-btn ${isDeaths ? 'vip-hero-perf-toggle-btn--active' : ''}`}
            onClick={() => setHeatmapType('deaths')}
          >
            Mortes
          </TrackedButton>
          <TrackedButton
            type="button"
            className={`vip-hero-perf-toggle-btn ${!isDeaths ? 'vip-hero-perf-toggle-btn--active' : ''}`}
            onClick={() => setHeatmapType('kills')}
          >
            Kills
          </TrackedButton>
        </div>
        <div className="vip-hero-example-radar-wrap">
          <div
            className="vip-hero-example-radar"
            style={{ backgroundImage: "url('/images/radars/de_mirage/radar.png')" }}
          >
            <div className={`vip-hero-example-radar-heat vip-hero-example-radar-heat--${heatmapType}`} />
            <span className="vip-hero-example-radar-icon vip-hero-example-radar-icon--death" title="Onde você mais morreu">✖</span>
            <span className="vip-hero-example-radar-icon vip-hero-example-radar-icon--kill" title="Onde você mais matou">★</span>
          </div>
          <span className="vip-hero-example-radar-hint">
            {isDeaths ? 'Vermelho = mortes' : 'Azul = kills'} · Ícones mostram hotspots
          </span>
        </div>
      </div>
    </div>
  );
}

function VipShowcasePerformanceBlock() {
  const [heatmapType, setHeatmapType] = useState('deaths');
  const isDeaths = heatmapType === 'deaths';
  return (
    <div className="vip-showcase-mock vip-showcase-mock--perf">
      <div className="vip-showcase-bar">
        <span className="vip-showcase-tab vip-showcase-tab--active">PERFORMANCE</span>
        <span className="vip-showcase-pill">VIP</span>
      </div>
      <div className="vip-showcase-perf-toggle">
        <TrackedButton
          type="button"
          className={`vip-showcase-perf-btn ${isDeaths ? 'vip-showcase-perf-btn--active' : ''}`}
          onClick={() => setHeatmapType('deaths')}
        >
          Mortes
        </TrackedButton>
        <TrackedButton
          type="button"
          className={`vip-showcase-perf-btn ${!isDeaths ? 'vip-showcase-perf-btn--active' : ''}`}
          onClick={() => setHeatmapType('kills')}
        >
          Kills
        </TrackedButton>
      </div>
      <div className="vip-showcase-radar-row vip-showcase-radar-row--with-icons">
        <div
          className="vip-showcase-mini-radar"
          style={{ backgroundImage: "url('/images/radars/de_mirage/radar.png')" }}
        >
          <div className={`vip-showcase-mini-radar-heat vip-showcase-mini-radar-heat--${heatmapType}`} />
          <span className="vip-showcase-radar-dot vip-showcase-radar-dot--death" title="Mortes">✖</span>
          <span className="vip-showcase-radar-dot vip-showcase-radar-dot--kill" title="Kills">★</span>
        </div>
      </div>
    </div>
  );
}

export default function VipPage() {
  const auth = useAuth();
  const profile = useProfile();
  const profileReady = !auth.loading && (!auth.steamId || !profile.loading);
  const isVip = profileReady ? Boolean(profile.profile?.isVip) : null;

  const handleBuy = () => {
    trackVipClickAssinar();
    if (!auth.steamId) {
      auth.login('/vip');
      return;
    }
    profile.buyVip();
  };

  return (
    <div className="app vip-page">
      <div className="scanlines" />
      <div className="grid-bg" />

      <header className="header">
        <div className="header-left">
          <Link to="/" className="logo-hex" aria-label="Início" />
          <div>
            <div className="header-title">VIP</div>
            <div className="header-sub">BENEFÍCIOS & ASSINATURA</div>
          </div>
        </div>
        <HamburgerNav activePath="/vip" auth={auth} profile={profile} returnTo="/vip" />
      </header>

      <main className="vip-main">
        <section className="vip-hero">
          <div className="vip-hero-left">
            <span className="vip-hero-badge">OFERTA LANÇAMENTO</span>
            <h1 className="vip-hero-title">
              SEJA VIP<br />
              <span className="vip-hero-accent">E DOMINE O SERVIDOR</span>
            </h1>
            <p className="vip-hero-sub">
              Crie suas próprias salas MIX, Squad e Warmup, destrave análise de performance avançada
              e participe de benefícios exclusivos.
            </p>
            <div className="vip-price-row">
              <span className="vip-price-old">R$ 59,00</span>
              <span className="vip-price-new">R$ 39,00</span>
              <span className="vip-price-tag">LANÇAMENTO</span>
            </div>
            {isVip === false && (
              <>
                <p className="vip-hero-bonus">+ 1 CAIXA DA STEAM GRÁTIS NA ASSINATURA</p>
                <TrackedButton
                  type="button"
                  className="pug-btn pug-btn-vip-cta vip-hero-btn"
                  onClick={handleBuy}
                  disabled={profile.checkoutLoading}
                >
                  {profile.checkoutLoading ? 'PROCESSANDO...' : 'ASSINAR VIP AGORA'}
                </TrackedButton>
                <div className="vip-hero-small">
                  Pagamento via Stripe · seguro e rápido.
                </div>
              </>
            )}
            {isVip === true && (
              <div className="vip-hero-vip-block">
                <div className="vip-hero-vip-badge">
                  <span className="vip-hero-vip-crown" aria-hidden>👑</span>
                  <span className="vip-hero-vip-text">VOCÊ É VIP</span>
                </div>
                <div className="vip-hero-vip-lvl">
                  <span className="vip-hero-vip-lvl-icon">⬆</span>
                  <span className="vip-hero-vip-lvl-label">Upgrade ativo</span>
                </div>
                <p className="vip-hero-vip-desc">Benefícios desbloqueados: MIX, Squad, Warmup e Performance.</p>
              </div>
            )}
          </div>
          <div className="vip-hero-right">
            <VipHeroPerformanceCard />
          </div>
        </section>

        <section className="vip-benefits">
          <h2 className="vip-section-title">O QUE VOCÊ DESBLOQUEIA</h2>
          <div className="vip-benefits-grid">
            <div className="vip-benefit-card">
              <span className="vip-benefit-icon">⚔</span>
              <h3>Salas MIX & SQUAD</h3>
              <p>Crie lobbies PUG e partidas Squad exclusivas. Você controla o mapa, horário e quem entra.</p>
            </div>
            <div className="vip-benefit-card">
              <span className="vip-benefit-icon">🏰</span>
              <h3>Criação de Clan</h3>
              <p>Somente VIPs podem criar squad/clan, com logo, descrição, medalhas e ranking próprio.</p>
            </div>
            <div className="vip-benefit-card">
              <span className="vip-benefit-icon">🔥</span>
              <h3>Warmup VIP</h3>
              <p>Crie warmups dedicados, escolha mapa, senha e bots para treinar com o seu time.</p>
            </div>
            <div className="vip-benefit-card">
              <span className="vip-benefit-icon">📈</span>
              <h3>Performance Avançada</h3>
              <p>Mapa de calor de mortes e kills, estatísticas detalhadas por mapa e histórico de partidas.</p>
            </div>
            <div className="vip-benefit-card">
              <span className="vip-benefit-icon">🎁</span>
              <h3>Giveaways & Brindes</h3>
              <p>Participação em sorteios exclusivos para VIPs e recompensas sazonais.</p>
            </div>
            <div className="vip-benefit-card">
              <span className="vip-benefit-icon">💬</span>
              <h3>Ferramentas In-Game</h3>
              <p>Recursos extras no chat, como pedido de estratégia rápida para o mapa atual.</p>
            </div>
            <div className="vip-benefit-card">
              <span className="vip-benefit-icon">⭐</span>
              <h3>Missões Semanais (3x pontos)</h3>
              <p>VIP ganha <strong>3x</strong> pontos ao completar missões. Esses pontos podem virar recompensas reais (skins) em eventos e loja.</p>
            </div>
          </div>
        </section>

        <section className="vip-showcase">
          <h2 className="vip-section-title">O QUE A PLATAFORMA OFERECE PARA VIPs</h2>
          <p className="vip-showcase-intro">
            Recursos exclusivos com exemplos dos componentes reais do site.
          </p>
          <div className="vip-showcase-grid">
            <div className="vip-showcase-card vip-showcase-card--performance">
              <h3>Performance avançada</h3>
              <VipShowcasePerformanceBlock />
              <p className="vip-showcase-text">
                Radar por mapa com heatmap (mortes em vermelho, kills em azul) e ícones de hotspot. Igual à página Performance PUG.
              </p>
            </div>
            <div className="vip-showcase-card vip-showcase-card--warmup">
              <h3>Criação de Warmup</h3>
              <div className="vip-showcase-mock">
                <div className="vip-showcase-modal-header">
                  <span className="vip-showcase-fire">🔥</span>
                  <span className="vip-showcase-modal-title">WARMUP VIP</span>
                </div>
                <div className="vip-showcase-modal-body">
                  <div className="vip-showcase-field">
                    <span className="vip-showcase-field-label">Nome da sala</span>
                    <div className="vip-showcase-field-input">Warmup do Clan</div>
                  </div>
                  <div className="vip-showcase-field">
                    <span className="vip-showcase-field-label">Mapa</span>
                    <div className="vip-showcase-field-input">de_mirage</div>
                  </div>
                </div>
              </div>
              <p className="vip-showcase-text">
                Na página de servidores, o VIP abre este modal para criar warmups dedicados com mapa, senha e bots.
              </p>
            </div>
            <div className="vip-showcase-card vip-showcase-card--mix-squad">
              <h3>MIX e Squad</h3>
              <div className="vip-showcase-mock">
                <div className="vip-showcase-tabs">
                  <span className="vip-showcase-tab vip-showcase-tab--active">MIX</span>
                  <span className="vip-showcase-tab">SQUAD</span>
                </div>
                <div className="vip-showcase-lobby">
                  <div className="vip-showcase-lobby-header">
                    <span className="vip-showcase-lobby-name">Lobby MIX</span>
                    <span className="vip-showcase-lobby-badge">VIP</span>
                  </div>
                  <div className="vip-showcase-lobby-meta">
                    <span>10/10</span>
                    <span>de_mirage</span>
                  </div>
                </div>
              </div>
              <p className="vip-showcase-text">
                Crie lobbies PUG (MIX) e partidas Squad (clan vs clan).
              </p>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .vip-main {
          max-width: 1000px;
          margin: 0 auto;
          padding: 32px 24px 80px;
        }
        .vip-hero {
          display: grid;
          grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
          gap: 32px;
          align-items: center;
          margin-bottom: 40px;
        }
        @media (max-width: 900px) {
          .vip-hero {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        .vip-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(245, 166, 35, 0.16);
          border: 1px solid rgba(245, 166, 35, 0.6);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 12px;
        }
        .vip-hero-title {
          font-family: var(--font-head);
          font-size: 32px;
          letter-spacing: 4px;
          margin: 0 0 10px;
          color: #fff;
        }
        .vip-hero-accent {
          color: var(--gold);
        }
        .vip-hero-sub {
          color: rgba(255,255,255,0.7);
          font-size: 0.95rem;
          margin: 0 0 14px;
        }
        .vip-price-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin: 12px 0;
        }
        .vip-price-old {
          text-decoration: line-through;
          color: rgba(255,255,255,0.4);
          font-size: 0.9rem;
        }
        .vip-price-new {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--gold);
        }
        .vip-price-tag {
          font-size: 0.75rem;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(245,166,35,0.18);
          border: 1px solid rgba(245,166,35,0.7);
          color: var(--gold);
        }
        .vip-hero-bonus {
          margin: 4px 0 10px;
          color: rgba(255,255,255,0.8);
          font-size: 0.9rem;
        }
        .vip-hero-btn {
          margin-top: 4px;
        }
        .vip-hero-vip-block {
          margin-top: 12px;
          padding: 20px 24px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(245,166,35,0.12) 0%, rgba(20,18,12,0.95) 100%);
          border: 1px solid rgba(245,166,35,0.35);
          box-shadow: 0 0 32px rgba(245,166,35,0.12);
          position: relative;
          overflow: hidden;
        }
        .vip-hero-vip-block::before {
          content: '';
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 80px;
          background: radial-gradient(ellipse, rgba(245,166,35,0.2) 0%, transparent 70%);
          pointer-events: none;
        }
        .vip-hero-vip-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          animation: vip-badge-pulse 2s ease-in-out infinite;
        }
        @keyframes vip-badge-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.92; transform: scale(1.02); }
        }
        .vip-hero-vip-crown {
          font-size: 28px;
          filter: drop-shadow(0 0 10px rgba(245,166,35,0.5));
        }
        .vip-hero-vip-text {
          font-family: var(--font-head);
          font-size: 1.1rem;
          letter-spacing: 4px;
          color: var(--gold);
          text-shadow: 0 0 20px rgba(245,166,35,0.3);
        }
        .vip-hero-vip-lvl {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(245,166,35,0.15);
          border: 1px solid rgba(245,166,35,0.4);
          margin-bottom: 10px;
          animation: vip-lvl-float 2.5s ease-in-out infinite;
        }
        @keyframes vip-lvl-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .vip-hero-vip-lvl-icon {
          font-size: 1rem;
          color: var(--gold);
        }
        .vip-hero-vip-lvl-label {
          font-size: 0.8rem;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.9);
        }
        .vip-hero-vip-desc {
          margin: 0;
          font-size: 0.9rem;
          color: rgba(255,255,255,0.75);
        }
        .vip-hero-small {
          margin-top: 8px;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.6);
        }
        .vip-hero-right {
          display: flex;
          justify-content: center;
        }
        .vip-hero-card {
          position: relative;
          padding: 20px 18px;
          border-radius: 16px;
          background: radial-gradient(circle at top left, rgba(245,166,35,0.35), transparent 60%), rgba(10,12,24,0.95);
          border: 1px solid rgba(245,166,35,0.4);
          box-shadow: 0 0 40px rgba(245,166,35,0.15);
          max-width: 320px;
          width: 100%;
        }
        .vip-hero-crown {
          position: absolute;
          top: -22px;
          left: 16px;
          font-size: 36px;
          filter: drop-shadow(0 0 12px rgba(245,166,35,0.6));
        }
        .vip-hero-card--example { min-height: 200px; }
        .vip-hero-card--performance {
          max-width: 380px;
          min-height: 340px;
        }
        .vip-hero-example-desc--top {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.65);
          margin: 0 0 10px;
          line-height: 1.35;
        }
        .vip-hero-example-mock--large {
          padding: 12px 14px;
        }
        .vip-hero-perf-toggle {
          display: flex;
          gap: 6px;
          margin-bottom: 10px;
        }
        .vip-hero-perf-toggle-btn {
          flex: 1;
          padding: 8px 12px;
          font-size: 0.75rem;
          letter-spacing: 1px;
          font-family: var(--font-mono, monospace);
          background: rgba(15,23,42,0.95);
          border: 1px solid rgba(148,163,184,0.35);
          border-radius: 8px;
          color: rgba(148,163,184,0.9);
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .vip-hero-perf-toggle-btn--active {
          background: rgba(245,166,35,0.15);
          border-color: rgba(245,166,35,0.5);
          color: var(--gold);
        }
        .vip-hero-example-radar-wrap {
          margin-top: 6px;
        }
        .vip-hero-example-radar {
          position: relative;
          width: 100%;
          padding-top: 100%;
          border-radius: 10px;
          overflow: hidden;
          background: #020617;
          background-size: cover;
          background-position: center;
          border: 1px solid rgba(148,163,184,0.4);
        }
        .vip-hero-example-radar-heat {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .vip-hero-example-radar-heat--deaths {
          background: radial-gradient(circle at 52% 55%, rgba(239,68,68,0.5), transparent 55%),
                      radial-gradient(circle at 35% 42%, rgba(249,115,22,0.4), transparent 50%);
          mix-blend-mode: screen;
        }
        .vip-hero-example-radar-heat--kills {
          background: radial-gradient(circle at 48% 48%, rgba(59,130,246,0.5), transparent 55%),
                      radial-gradient(circle at 62% 60%, rgba(96,165,250,0.35), transparent 50%);
          mix-blend-mode: screen;
        }
        .vip-hero-example-radar-icon {
          position: absolute;
          font-size: 14px;
          font-weight: 700;
          line-height: 1;
          text-shadow: 0 0 8px rgba(0,0,0,0.9);
          pointer-events: none;
        }
        .vip-hero-example-radar-icon--death {
          top: 52%; left: 50%;
          transform: translate(-50%, -50%);
          color: #ef4444;
        }
        .vip-hero-example-radar-icon--kill {
          top: 48%; left: 48%;
          transform: translate(-50%, -50%);
          color: #3b82f6;
        }
        .vip-hero-example-radar-hint {
          display: block;
          margin-top: 6px;
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
        }
        .vip-hero-example-label {
          font-size: 10px;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 10px;
        }
        .vip-hero-example-mock {
          background: rgba(10,16,32,0.9);
          border-radius: 12px;
          padding: 10px 12px;
          border: 1px solid rgba(148,163,184,0.3);
        }
        .vip-hero-example-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .vip-hero-example-tab {
          font-size: 0.7rem;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.9);
        }
        .vip-hero-example-pill {
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 999px;
          background: rgba(245,166,35,0.2);
          border: 1px solid rgba(245,166,35,0.6);
          color: var(--gold);
        }
        .vip-hero-example-heatmaps {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        .vip-hero-example-hm {
          height: 50px;
          border-radius: 8px;
        }
        .vip-hero-example-hm--death {
          background: radial-gradient(circle at 30% 50%, rgba(239,68,68,0.6), transparent 60%);
        }
        .vip-hero-example-hm--kill {
          background: radial-gradient(circle at 70% 50%, rgba(59,130,246,0.6), transparent 60%);
        }
        .vip-hero-example-desc {
          margin: 8px 0 0;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.7);
        }
        .vip-showcase-intro {
          margin: -8px 0 16px;
          font-size: 0.95rem;
          color: rgba(255,255,255,0.75);
        }
        .vip-section-title {
          font-family: var(--font-head);
          font-size: 1.3rem;
          letter-spacing: 3px;
          color: #fff;
          margin: 32px 0 16px;
        }
        .vip-benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .vip-benefit-card {
          background: rgba(11,16,30,0.98);
          border-radius: 14px;
          padding: 16px 18px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .vip-benefit-icon {
          font-size: 22px;
          display: inline-block;
          margin-bottom: 8px;
        }
        .vip-benefit-card h3 {
          margin: 0 0 6px;
          color: #fff;
          font-size: 1rem;
        }
        .vip-benefit-card p {
          margin: 0;
          color: rgba(255,255,255,0.7);
          font-size: 0.9rem;
        }
        .vip-showcase-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }
        .vip-showcase-card {
          background: rgba(8,12,24,0.96);
          border-radius: 14px;
          padding: 18px 20px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .vip-showcase-card h3 {
          margin: 0 0 8px;
          color: #fff;
          font-size: 1rem;
        }
        .vip-showcase-mock {
          margin-bottom: 8px;
        }
        .vip-showcase-text {
          margin: 0;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.75);
        }
        .vip-showcase-card--performance .vip-showcase-mock,
        .vip-showcase-card--warmup .vip-showcase-mock,
        .vip-showcase-card--mix-squad .vip-showcase-mock {
          background: rgba(10,16,32,0.98);
          border-radius: 14px;
          padding: 10px 12px;
          border: 1px solid rgba(148,163,184,0.4);
        }
        .vip-showcase-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .vip-showcase-tab {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid transparent;
          color: rgba(148,163,184,0.9);
        }
        .vip-showcase-tab--active {
          border-color: rgba(96,165,250,0.7);
          background: rgba(37,99,235,0.25);
          color: #e5f0ff;
        }
        .vip-showcase-pill {
          font-size: 0.65rem;
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(245,166,35,0.15);
          border: 1px solid rgba(245,166,35,0.7);
          color: var(--gold);
        }
        .vip-showcase-content {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
        }
        .vip-showcase-map-icon-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .vip-showcase-map-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid rgba(148,163,184,0.3);
          opacity: 0.7;
        }
        .vip-showcase-map-icon--active {
          opacity: 1;
          border-color: rgba(245,166,35,0.5);
          box-shadow: 0 0 12px rgba(245,166,35,0.2);
        }
        .vip-showcase-map-name {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.8);
          font-family: var(--font-mono, monospace);
        }
        .vip-showcase-perf-toggle {
          display: flex;
          gap: 4px;
          margin-bottom: 8px;
        }
        .vip-showcase-perf-btn {
          flex: 1;
          padding: 6px 10px;
          font-size: 0.7rem;
          letter-spacing: 1px;
          font-family: var(--font-mono, monospace);
          background: rgba(15,23,42,0.95);
          border: 1px solid rgba(148,163,184,0.35);
          border-radius: 6px;
          color: rgba(148,163,184,0.9);
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .vip-showcase-perf-btn--active {
          background: rgba(245,166,35,0.12);
          border-color: rgba(245,166,35,0.45);
          color: var(--gold);
        }
        .vip-showcase-radar-row {
          margin-bottom: 6px;
        }
        .vip-showcase-radar-row--with-icons .vip-showcase-mini-radar { padding-top: 70%; }
        .vip-showcase-mini-radar {
          position: relative;
          width: 100%;
          padding-top: 56%;
          border-radius: 10px;
          overflow: hidden;
          background: #020617;
          background-size: cover;
          background-position: center;
          border: 1px solid rgba(148,163,184,0.4);
        }
        .vip-showcase-mini-radar-heat {
          position: absolute;
          inset: 0;
          mix-blend-mode: screen;
          pointer-events: none;
        }
        .vip-showcase-mini-radar-heat--deaths {
          background: radial-gradient(circle at 52% 55%, rgba(239,68,68,0.55), transparent 60%),
                      radial-gradient(circle at 35% 40%, rgba(249,115,22,0.45), transparent 65%);
        }
        .vip-showcase-mini-radar-heat--kills {
          background: radial-gradient(circle at 48% 48%, rgba(59,130,246,0.5), transparent 55%),
                      radial-gradient(circle at 62% 60%, rgba(96,165,250,0.4), transparent 60%);
        }
        .vip-showcase-radar-dot {
          position: absolute;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          text-shadow: 0 0 6px rgba(0,0,0,0.9);
          pointer-events: none;
        }
        .vip-showcase-radar-dot--death {
          top: 52%; left: 50%;
          transform: translate(-50%, -50%);
          color: #ef4444;
        }
        .vip-showcase-radar-dot--kill {
          top: 48%; left: 48%;
          transform: translate(-50%, -50%);
          color: #3b82f6;
        }
        .vip-showcase-mini-heatmap {
          position: relative;
          height: 70px;
          border-radius: 10px;
          overflow: hidden;
          background: radial-gradient(circle at 30% 40%, rgba(239,68,68,0.5), transparent 60%);
        }
        .vip-showcase-mini-heatmap--kills {
          background: radial-gradient(circle at 60% 60%, rgba(59,130,246,0.5), transparent 60%);
        }
        .vip-showcase-mini-label {
          position: absolute;
          left: 8px;
          bottom: 6px;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.8);
          text-shadow: 0 1px 2px rgba(0,0,0,0.7);
        }
        .vip-showcase-modal-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }
        .vip-showcase-fire {
          font-size: 1rem;
        }
        .vip-showcase-modal-title {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.9);
        }
        .vip-showcase-modal-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .vip-showcase-field {
          font-size: 0.7rem;
        }
        .vip-showcase-field-label {
          display: block;
          color: rgba(148,163,184,0.9);
          margin-bottom: 2px;
        }
        .vip-showcase-field-input {
          padding: 4px 6px;
          border-radius: 6px;
          background: rgba(15,23,42,0.96);
          border: 1px solid rgba(55,65,81,0.9);
          color: rgba(255,255,255,0.9);
        }
        .vip-showcase-tabs {
          display: inline-flex;
          padding: 2px;
          border-radius: 999px;
          background: rgba(15,23,42,0.95);
          margin-bottom: 6px;
        }
        .vip-showcase-lobby {
          border-radius: 10px;
          background: radial-gradient(circle at top left, rgba(56,189,248,0.3), transparent 55%), rgba(10,16,32,0.98);
          padding: 8px 10px;
        }
        .vip-showcase-lobby-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .vip-showcase-lobby-name {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.95);
        }
        .vip-showcase-lobby-badge {
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 999px;
          background: rgba(56,189,248,0.18);
          border: 1px solid rgba(56,189,248,0.8);
          color: #e0f7ff;
        }
        .vip-showcase-lobby-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: rgba(209,213,219,0.9);
          margin-bottom: 4px;
        }
        .vip-showcase-lobby-footer {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .vip-list {
          padding-left: 18px;
          margin: 0;
          color: rgba(255,255,255,0.8);
          font-size: 0.9rem;
        }
        .vip-list li + li {
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}

