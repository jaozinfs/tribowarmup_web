/**
 * LevelUpPreview — Mostra como funciona o sistema de level no MIX (estilo da home).
 * Usado no gate VIP para motivar: vitórias dão pontos, pontos sobem level.
 */
import { Link } from 'react-router-dom';
import './LevelUpPreview.css';

export function LevelUpPreview() {
  return (
    <div className="level-up-preview">
      <div className="level-up-preview-visual">
        <img
          src="/images/home-pug-level.png"
          alt="Sistema de level no Mix"
          className="level-up-preview-img"
        />
      </div>
      <div className="level-up-preview-steps">
        <div className="level-up-step">
          <span className="level-up-step-num">+20</span>
          <span className="level-up-step-label">pts por vitória</span>
        </div>
        <span className="level-up-arrow">→</span>
        <div className="level-up-step">
          <span className="level-up-step-num">100</span>
          <span className="level-up-step-label">pts = level up</span>
        </div>
        <span className="level-up-arrow">→</span>
        <div className="level-up-step level-up-step--rank">
          <span className="level-up-step-badge">RANKING</span>
          <span className="level-up-step-label">mostre seu nível</span>
        </div>
      </div>
      <p className="level-up-preview-desc">
        Jogue partidas, ganhe pontos e suba de level. Cada vitória conta.
      </p>
      <Link to="/ranking" className="level-up-preview-link">Ver ranking</Link>
    </div>
  );
}
