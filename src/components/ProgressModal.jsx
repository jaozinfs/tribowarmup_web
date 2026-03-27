import { TrackedButton } from './TrackedButton';
/**
 * ProgressModal — Exibe atualização de pontos/level após fim da partida.
 */

import './ProgressModal.css';

export function ProgressModal({ update, onClose }) {
  if (!update) return null;
  const { previousLevel, newLevel, previousPoints, newPoints, pointsDelta, levelUp } = update;
  const deltaStr = pointsDelta >= 0 ? `+${pointsDelta}` : String(pointsDelta);

  return (
    <div className="progress-modal-backdrop" onClick={onClose}>
      <div className="progress-modal" onClick={(e) => e.stopPropagation()}>
        <div className="progress-modal-title">
          {levelUp ? '🎉 SUBIU DE LEVEL!' : 'PARTIDA FINALIZADA'}
        </div>
        <div className="progress-modal-body">
          {levelUp && (
            <div className="progress-modal-level-row">
              <span className="progress-modal-level-old">Level {previousLevel}</span>
              <span className="progress-modal-level-arrow">→</span>
              <span className="progress-modal-level-new">Level {newLevel}</span>
            </div>
          )}
          <div className="progress-modal-points-row">
            <span className="progress-modal-points-label">Pontos:</span>
            <span className="progress-modal-points-old">{previousPoints}</span>
            <span className={`progress-modal-points-delta ${pointsDelta >= 0 ? 'positive' : 'negative'}`}>{deltaStr}</span>
            <span className="progress-modal-points-new">= {newPoints}</span>
          </div>
        </div>
        <TrackedButton type="button" className="pug-btn pug-btn-primary progress-modal-btn" onClick={onClose}>
          OK
        </TrackedButton>
      </div>
    </div>
  );
}
