import { roleForPlayerId } from '../../utils/fantasyRole';
import { TrackedButton } from '../TrackedButton';

function hltvToOvr(rating) {
  const r = Number(rating) || 1;
  return Math.max(48, Math.min(99, Math.round(50 + (r - 0.92) * 220)));
}

const RARITY_CLASS = {
  common: 'fifa-card--common',
  uncommon: 'fifa-card--uncommon',
  rare: 'fifa-card--rare',
  epic: 'fifa-card--epic',
  legendary: 'fifa-card--legendary',
  mythic: 'fifa-card--mythic',
};

const ROLE_LABELS = {
  captain: 'Capitão',
  support: 'Support',
  entry: 'Entry',
  lurk: 'Lurk',
  anchor: 'Âncora',
  coach: 'Técnico',
};

export function FifaPlayerCard({
  player,
  selected = false,
  draggable = false,
  onDragStart,
  onAddStarter,
  onSetBench,
  onSetCoach,
  isBench = false,
  isCoach = false,
  onOpenDetail,
  compact = false,
  owned = false,
  showLockWhenMissing = false,
  noHover = false,
  showActions = true,
}) {
  const rating = Number(player?.rating || 0).toFixed(2);
  const price = Number(player?.price || 0).toFixed(1);
  const trend = player?.trend || 'steady';
  const ovr = hltvToOvr(player?.rating);
  const rarity = player?.rarity || 'common';
  const rarityCls = RARITY_CLASS[rarity] || RARITY_CLASS.common;
  const img = player?.image || '';
  const isMissing = !owned && showLockWhenMissing;
  const roleKey = String(
    player?.role || roleForPlayerId(player?.id || player?.playerId || ''),
  ).toLowerCase();
  const roleLabel = ROLE_LABELS[roleKey] || roleKey || '—';
  const isCoachRole = roleKey === 'coach';
  const cardClick = !showActions && onOpenDetail ? () => onOpenDetail() : undefined;

  return (
    <article
      className={`fifa-card ${rarityCls} ${selected ? 'fifa-card--selected' : ''} ${isBench ? 'fifa-card--bench' : ''} ${isCoach ? 'fifa-card--coach' : ''} ${compact ? 'fifa-card--compact' : ''} ${noHover ? 'fifa-card--no-hover' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={cardClick}
      role={cardClick ? 'button' : undefined}
      style={cardClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="fifa-card-shine" aria-hidden />
      {isMissing && (
        <div className="fifa-card-lock-overlay" aria-hidden>
          <span className="fifa-card-lock-icon">🔒</span>
          <span className="fifa-card-lock-label">Nao obtida</span>
        </div>
      )}
      <div className="fifa-card-frame">
        <header className="fifa-card-header">
          <div className="fifa-ovr-block">
            <span className="fifa-ovr-num">{ovr}</span>
            <span className="fifa-ovr-lbl">OVR</span>
          </div>
          <div className="fifa-card-meta">
            <span className={`fifa-rarity-badge fifa-rarity-badge--${rarity}`}>{rarity}</span>
            {owned && <span className="fifa-owned-pill">Colecao</span>}
          </div>
          <div className="fifa-price-chip">
            <span className="fifa-price-label">$</span>
            {price}
          </div>
        </header>

        <div className="fifa-photo-wrap">
          <div className="fifa-photo-bg" />
          <img
            src={img}
            alt=""
            className="fifa-avatar"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="fifa-photo-vignette" aria-hidden />
        </div>

        <div className="fifa-card-footer">
          <div className="fifa-role-line">{roleLabel}</div>
          <div className="fifa-name">{player?.name}</div>
          <div className="fifa-team">{player?.team}</div>
          <div className="fifa-stats">
            <span title="HLTV 2.0">RTG {rating}</span>
            <span>K {Number(player?.weeklyStats?.kills || 0)}</span>
            <span>ADR {Number(player?.weeklyStats?.adr || 0).toFixed(0)}</span>
            <span className={`fifa-trend fifa-trend--${trend}`}>{trend}</span>
          </div>
        </div>
      </div>

      {showActions && (
      <div className="fifa-actions">
        <TrackedButton type="button" onClick={onAddStarter} disabled={selected || isMissing || isCoachRole}>Titular</TrackedButton>
        <TrackedButton type="button" onClick={onSetBench} disabled={selected || isMissing || isCoachRole}>{isBench ? 'Bench ✓' : 'Bench'}</TrackedButton>
        {onSetCoach && (
          <TrackedButton
            type="button"
            onClick={onSetCoach}
            disabled={selected || isMissing || !isCoachRole}
            title={!isCoachRole ? 'Só cartas com posição Técnico' : undefined}
          >
            {isCoach ? 'Técnico ✓' : 'Técnico'}
          </TrackedButton>
        )}
        <TrackedButton type="button" className="fifa-detail-btn" onClick={() => onOpenDetail?.()}>Stats</TrackedButton>
      </div>
      )}
    </article>
  );
}
