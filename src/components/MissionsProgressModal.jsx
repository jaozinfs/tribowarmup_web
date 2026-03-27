import './MissionsProgressModal.css';
import { TrackedButton } from './TrackedButton';

function clamp(n, min = 0, max = 1_000_000_000) {
  const x = Math.floor(Number(n) || 0);
  return Math.max(min, Math.min(max, x));
}

function pct(progress, target) {
  const t = Math.max(1, clamp(target, 1));
  return Math.max(0, Math.min(100, Math.round((clamp(progress) / t) * 100)));
}

export function MissionsProgressModal({ update, onClose, isVip }) {
  if (!update || update.kind !== 'missions_progress') return null;
  const changes = Array.isArray(update.changes) ? update.changes : [];
  if (changes.length === 0) return null;

  const completedNow = changes.filter((c) => c?.completedNow);

  return (
    <div className="missions-modal-backdrop" onClick={onClose}>
      <div className="missions-modal" onClick={(e) => e.stopPropagation()}>
        <div className="missions-modal-head">
          <div className="missions-modal-title">🎯 Progresso das Missões</div>
          <div className="missions-modal-sub">
            {isVip ? <span className="missions-modal-vip-pill">VIP 3x</span> : null}
            <span>{update.matchId ? `Partida: ${update.matchId}` : 'Partida finalizada'}</span>
          </div>
        </div>

        <div className="missions-modal-list">
          {changes.map((c) => {
            const before = clamp(c.before);
            const target = clamp(c.target, 1);
            const after = Math.min(clamp(c.after), target);
            const storedDelta = after - before;
            const mc = c.matchContribution;
            const delta =
              mc != null && Number.isFinite(Number(mc)) ? clamp(mc) : Math.max(0, storedDelta);
            const done = after >= target;
            const bar = pct(after, target);
            return (
              <div key={c.userMissionId} className={`missions-modal-card ${done ? 'missions-modal-card--done' : ''}`}>
                <div className="missions-modal-card-top">
                  <div className="missions-modal-card-name">{c.name}</div>
                  <div className="missions-modal-card-reward">
                    +{clamp(c.rewardPoints)} pts
                    {isVip ? <span className="missions-modal-card-reward-mult">×3</span> : null}
                  </div>
                </div>
                <div className="missions-modal-card-mid">
                  <div className="missions-modal-progress-text">
                    <span className="missions-modal-progress-now">{after}/{target}</span>
                    <span className="missions-modal-progress-delta">
                      {delta > 0 ? `(+${delta} nesta partida)` : ''}
                    </span>
                    {done ? <span className="missions-modal-done-badge">CONCLUÍDA</span> : <span className="missions-modal-live-badge">EM ANDAMENTO</span>}
                  </div>
                  <div className="missions-modal-bar">
                    <div className="missions-modal-bar-fill" style={{ width: `${bar}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {completedNow.length > 0 ? (
          <div className="missions-modal-highlight">
            <div className="missions-modal-highlight-title">🔥 Missão concluída</div>
            <div className="missions-modal-highlight-list">
              {completedNow.slice(0, 3).map((c) => (
                <div key={`done-${c.userMissionId}`} className="missions-modal-highlight-item">
                  <span className="missions-modal-highlight-name">{c.name}</span>
                  <span className="missions-modal-highlight-reward">+{clamp(c.rewardPoints)} pts{isVip ? ' ×3' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <TrackedButton type="button" className="pug-btn pug-btn-primary missions-modal-btn" onClick={onClose}>
          OK
        </TrackedButton>
      </div>
    </div>
  );
}

