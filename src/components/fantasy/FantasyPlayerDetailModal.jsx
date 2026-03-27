import { useEffect, useState } from 'react';
import { fetchFantasyPlayerHltvProfile } from '../../services/fantasyService';
import { roleForPlayerId, ROLE_LABELS_PT } from '../../utils/fantasyRole';
import { TrackedButton } from '../TrackedButton';

const STAT_ORDER = [
  ['firepower', 'Firepower'],
  ['entrying', 'Entrying'],
  ['trading', 'Trading'],
  ['opening', 'Opening'],
  ['clutching', 'Clutching'],
  ['sniping', 'Sniping'],
  ['utility', 'Utility'],
];

export function FantasyPlayerDetailModal({ player, onClose }) {
  const [hltv, setHltv] = useState(null);
  const [hltvErr, setHltvErr] = useState('');
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });

  const pid = player?.id || player?.playerId;
  const rarity = String(player?.rarity || 'common').toLowerCase();
  const roleKey = String(player?.role || roleForPlayerId(pid || '')).toLowerCase();
  const roleLabel = ROLE_LABELS_PT[roleKey] || roleKey || '—';
  const ws = player?.weeklyStats && Object.keys(player.weeklyStats).length
    ? player.weeklyStats
    : {
      kills: player?.kills,
      deaths: player?.deaths,
      adr: player?.adr,
      headshotPercentage: player?.headshotPercentage,
      impact: player?.impact,
      mapsPlayed: player?.mapsPlayed,
    };
  const weekLooksEmpty = !ws || (
    Number(ws.kills || 0) === 0
    && Number(ws.deaths || 0) === 0
    && Number(ws.adr || 0) === 0
    && Number(ws.impact || 0) === 0
    && Number(ws.mapsPlayed || 0) === 0
  );
  const rating = Number(player?.rating || 0).toFixed(2);
  const ovr = Math.max(48, Math.min(99, Math.round(50 + (Number(player?.rating || 0) - 0.92) * 220)));

  useEffect(() => {
    if (!pid) return;
    let alive = true;
    setHltv(null);
    setHltvErr('');
    fetchFantasyPlayerHltvProfile(pid)
      .then((data) => {
        if (alive) setHltv(data || {});
      })
      .catch((e) => {
        if (alive) setHltvErr(e.message || 'Falha ao carregar HLTV');
      });
    return () => { alive = false; };
  }, [pid]);

  const onMoveCard = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setTilt({
      rx: -y * 12,
      ry: x * 14,
      gx: ((e.clientX - rect.left) / rect.width) * 100,
      gy: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  if (!player) return null;

  const ratingPrimary = hltv?.ratingPrimary != null && Number.isFinite(Number(hltv.ratingPrimary))
    ? Number(hltv.ratingPrimary).toFixed(2)
    : rating;
  const ratingTitle = hltv?.ratingLabel || 'Rating 2.0 (HLTV)';
  const rating3ValueRaw = hltv?.rating3 ?? hltv?.rating3Legacy ?? null;
  const rating3Extra = rating3ValueRaw != null && Number.isFinite(Number(rating3ValueRaw))
    ? Number(rating3ValueRaw).toFixed(2)
    : null;
  const percentileLabel = hltv?.percentileLabel || null;
  const bars = hltv?.stats || hltv?.infoBoxStats || {};

  return (
    <div className="fantasy-modal-backdrop fantasy-modal-backdrop--site" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="fantasy-detail-modal fantasy-detail-modal--framed" onClick={(e) => e.stopPropagation()}>
        <TrackedButton type="button" className="fantasy-detail-close" onClick={onClose} aria-label="Fechar">×</TrackedButton>

        <div className="fantasy-detail-layout">
          <div className="fantasy-detail-visual">
            <div
              className={`fantasy-detail-card fantasy-detail-card--${rarity} holo`}
              onMouseMove={onMoveCard}
              onMouseLeave={() => setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 })}
              style={{
                '--detail-rx': `${tilt.rx}deg`,
                '--detail-ry': `${tilt.ry}deg`,
                '--detail-gx': `${tilt.gx}%`,
                '--detail-gy': `${tilt.gy}%`,
              }}
            >
              <div className="fantasy-detail-card-frame">
                <header className="fantasy-detail-card-top">
                  <div className="fantasy-detail-ovr">
                    <span className="fantasy-detail-ovr-num">{ovr}</span>
                    <span className="fantasy-detail-ovr-lbl">OVR</span>
                  </div>
                  <div className="fantasy-detail-card-badges">
                    <span className={`fifa-rarity-badge fifa-rarity-badge--${rarity}`}>{rarity}</span>
                    <span className="fantasy-detail-role-pill">{roleLabel}</span>
                  </div>
                  <div className="fantasy-detail-price-chip">
                    <span className="fifa-price-label">$</span>
                    {Number(player?.price || 0).toFixed(1)}
                  </div>
                </header>
                <div className="fantasy-detail-photo-wrap">
                  <div className="fantasy-detail-photo-bg" />
                  <img src={player.image} alt="" className="fantasy-detail-card-img" referrerPolicy="no-referrer" />
                  <div className="fantasy-detail-photo-vignette" aria-hidden />
                </div>
                <footer className="fantasy-detail-card-caption">
                  <div className="fantasy-detail-cap-name">{player.name}</div>
                  <div className="fantasy-detail-cap-team">{player.team}</div>
                  <div className="fantasy-detail-cap-mini">
                    <span>RTG {rating}</span>
                    <span>K {Number(ws.kills || 0)}</span>
                    <span>ADR {Number(ws.adr || 0).toFixed(0)}</span>
                  </div>
                </footer>
              </div>
              <div className="fantasy-detail-glare" aria-hidden />
              <div className="fantasy-detail-prism" aria-hidden />
            </div>
          </div>

          <div className="fantasy-detail-head">
            <h2>{player.name}</h2>
            <p className="fantasy-detail-team">{player.team}</p>
            <div className="fantasy-detail-head-badges">
              <span className={`fifa-rarity-badge fifa-rarity-badge--${rarity}`}>{rarity}</span>
              <span className="fantasy-detail-role-pill">{roleLabel}</span>
            </div>
          </div>
        </div>

        <div className="fantasy-detail-section">
          <h3 className="fantasy-detail-section-title">HLTV — {ratingTitle}</h3>
          {hltvErr && <p className="fantasy-detail-warn">{hltvErr}</p>}
          <div className="fantasy-detail-hero-stat">
            <div>
              <span className="fantasy-detail-hero-label">{ratingTitle}</span>
              <strong className="fantasy-detail-hero-val">{ratingPrimary}</strong>
            </div>
            {rating3Extra && (
              <div className="fantasy-detail-rating3-extra">
                <span className="fantasy-detail-hero-label">Rating 3.0 (aba info)</span>
                <strong className="fantasy-detail-hero-val fantasy-detail-hero-val--sm">{rating3Extra}</strong>
              </div>
            )}
            {percentileLabel && (
              <p className="fantasy-detail-percentile">{percentileLabel}</p>
            )}
          </div>

          <div className="fantasy-hltv-bars">
            {STAT_ORDER.map(([key, label]) => {
              const row = bars?.[key];
              if (row == null || row.score == null) return null;
              const maxRaw = Number(row.max || 100);
              const max = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : 100;
              const score = Number(row.score || 0);
              const scoreSafe = Number.isFinite(score) ? score : 0;
              const pct = Math.min(100, Math.round((scoreSafe / max) * 100));
              return (
                <div key={key} className="fantasy-hltv-bar-row">
                  <span className="fantasy-hltv-bar-name">{label}</span>
                  <div className="fantasy-hltv-bar-track">
                    <div className="fantasy-hltv-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="fantasy-hltv-bar-num">{scoreSafe}/{max}</span>
                </div>
              );
            })}
          </div>

          {hltv?.libStats?.overview && (
            <div className="fantasy-detail-grid fantasy-detail-grid--lib">
              {hltv.libStats.overview.rating2 != null && (
                <div className="fantasy-stat-pill"><span>Rating 2.0 (stats)</span><strong>{Number(hltv.libStats.overview.rating2).toFixed(2)}</strong></div>
              )}
              {hltv.libStats.overview.damagePerRound != null && (
                <div className="fantasy-stat-pill"><span>ADR (lib)</span><strong>{Number(hltv.libStats.overview.damagePerRound).toFixed(2)}</strong></div>
              )}
              {hltv.libStats.overview.kdRatio != null && (
                <div className="fantasy-stat-pill"><span>K/D</span><strong>{Number(hltv.libStats.overview.kdRatio).toFixed(2)}</strong></div>
              )}
              {hltv.libStats.opening?.openingKillRating != null && (
                <div className="fantasy-stat-pill"><span>OK rating</span><strong>{Number(hltv.libStats.opening.openingKillRating).toFixed(2)}</strong></div>
              )}
              {hltv.libStats.overview.kills != null && (
                <div className="fantasy-stat-pill"><span>Kills (média HLTV)</span><strong>{Number(hltv.libStats.overview.kills).toFixed(0)}</strong></div>
              )}
              {hltv.libStats.overview.deaths != null && (
                <div className="fantasy-stat-pill"><span>Deaths (média HLTV)</span><strong>{Number(hltv.libStats.overview.deaths).toFixed(0)}</strong></div>
              )}
              {hltv.libStats.overview.mapsPlayed != null && (
                <div className="fantasy-stat-pill"><span>Maps (HLTV)</span><strong>{Number(hltv.libStats.overview.mapsPlayed).toFixed(0)}</strong></div>
              )}
              {hltv.libStats.overview.headshots != null && (
                <div className="fantasy-stat-pill"><span>HS% (HLTV)</span><strong>{Number(hltv.libStats.overview.headshots).toFixed(1)}</strong></div>
              )}
              {hltv.libStats.overview.assistsPerRound != null && (
                <div className="fantasy-stat-pill"><span>Assists/R (HLTV)</span><strong>{Number(hltv.libStats.overview.assistsPerRound).toFixed(2)}</strong></div>
              )}
            </div>
          )}
        </div>

        <div className="fantasy-detail-section">
          <h3 className="fantasy-detail-section-title">Fantasy (semana)</h3>
          {weekLooksEmpty && (
            <p className="fantasy-detail-warn">Semana atual sem dados ainda. Use os blocos HLTV acima para médias gerais do jogador.</p>
          )}
          <div className="fantasy-detail-grid">
            <div className="fantasy-stat-pill"><span>Kills</span><strong>{ws.kills ?? '—'}</strong></div>
            <div className="fantasy-stat-pill"><span>Deaths</span><strong>{ws.deaths ?? '—'}</strong></div>
            <div className="fantasy-stat-pill"><span>ADR</span><strong>{Number(ws.adr || 0).toFixed(1)}</strong></div>
            <div className="fantasy-stat-pill"><span>HS%</span><strong>{Number(ws.headshotPercentage || 0).toFixed(1)}</strong></div>
            <div className="fantasy-stat-pill"><span>Impact</span><strong>{Number(ws.impact || 0).toFixed(2)}</strong></div>
            <div className="fantasy-stat-pill"><span>Maps</span><strong>{ws.mapsPlayed ?? '—'}</strong></div>
            <div className="fantasy-stat-pill"><span>Preço</span><strong>${Number(player.price || 0).toFixed(1)}</strong></div>
          </div>
        </div>

        <p className="fantasy-detail-hint">Rating principal vem da API HLTV (getPlayerStats). Barras Rating 3.0 quando a página HLTV for parseada com sucesso.</p>
      </div>
    </div>
  );
}
