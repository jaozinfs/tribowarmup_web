const POINTS_PER_LEVEL = 100;

/**
 * Faixa de progresso fixa no rodapé (PUG, Squad). Sempre expandida, com level atual,
 * barra de progresso colorida até o próximo level (0–100 pontos) e próximo level à direita.
 */
export function LevelProgressFloatingModal({ level = 1, points = 0 }) {
  const lvl = Math.max(1, Math.min(100, Number(level) || 1));
  const pts = Math.max(0, Math.min(POINTS_PER_LEVEL - 1, Number(points) || 0));
  const nextLvl = Math.min(100, lvl + 1);
  const progressPct = (pts / POINTS_PER_LEVEL) * 100;
  let fillColor = '#22c55e'; // verde
  if (progressPct > 66) fillColor = '#f59e0b'; // laranja
  else if (progressPct > 33) fillColor = '#84cc16'; // verde/amarelo

  return (
    <div className="level-progress-float-wrap">
      <div className="level-progress-float-modal">
        <div className="level-progress-float-inner">
          <span
            className="level-progress-float-badge level-progress-float-badge--current"
            title="Level atual"
          >
            {lvl}
          </span>
          <div className="level-progress-float-bar-wrap">
            <div className="level-progress-float-bar-bg">
              <div
                className="level-progress-float-bar-fill"
                style={{ width: `${progressPct}%`, backgroundColor: fillColor, boxShadow: `0 0 18px ${fillColor}55` }}
              />
            </div>
            <span className="level-progress-float-bar-label">{pts} / {POINTS_PER_LEVEL} pts</span>
          </div>
          <span
            className="level-progress-float-badge level-progress-float-badge--next"
            title="Próximo level"
          >
            {nextLvl}
          </span>
        </div>
      </div>
      <style>{`
        .level-progress-float-wrap { position: fixed; bottom: 32px; left: 0; right: 0; z-index: 900; display: flex; justify-content: center; pointer-events: none; }
        .level-progress-float-wrap * { pointer-events: auto; }
        .level-progress-float-modal {
          width: min(92vw, 640px);
          padding: 14px 20px 16px;
          background: rgba(15,23,42,0.82);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(248,250,252,0.1);
          border-radius: 12px;
          box-shadow: 0 6px 28px rgba(0,0,0,0.55);
        }
        .level-progress-float-inner {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .level-progress-float-badge {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          font-family: var(--font-mono);
          background: rgba(15,23,42,0.98);
          border: 1px solid rgba(148,163,184,0.7);
          color: #e5e7eb;
        }
        .level-progress-float-bar-wrap { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
        .level-progress-float-bar-bg {
          height: 20px;
          background: rgba(15,23,42,0.9);
          border-radius: 999px;
          overflow: hidden;
          position: relative;
        }
        .level-progress-float-bar-fill {
          height: 100%;
          border-radius: 999px;
          box-shadow: 0 0 18px rgba(132,204,22,0.35);
          transition: width 0.35s ease-out, background-color 0.35s ease-out, box-shadow 0.35s ease-out;
        }
        .level-progress-float-bar-label {
          font-size: 11px;
          color: var(--text-dim);
          font-family: var(--font-mono);
        }
        .level-progress-float-badge--next {
          border-color: rgba(245,158,11,0.8);
        }
        @keyframes level-progress-gradient {
          0% { background-position: 0% 50%; }
          100% { background-position: -200% 50%; }
        }
      `}</style>
    </div>
  );
}
