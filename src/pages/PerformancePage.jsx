import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { HamburgerNav } from '../components/HamburgerNav';
import { Avatar } from '../components/Avatar';
import { getLevelStyle } from '../utils/levelStyle';
import { getPlayerStats, getHeatmapData, getRecentMatches } from '../services/pugService';
import { getWarmupStats } from '../services/warmupService';
import { MAP_META, gameToRadarPixel, getRadarImageUrl, AVAILABLE_MAPS } from '../utils/radarCoords';
import { formatGameModeLabel } from '../utils/gameModeLabel';
import simpleheat from 'simpleheat';
import './PerformancePage.css';
import { TrackedButton } from '../components/TrackedButton';

const MAP_ICONS_BASE = '/images/maps';
const MAP_DISPLAY_NAMES = {
  de_mirage: 'Mirage', de_dust2: 'Dust 2', de_inferno: 'Inferno',
  de_ancient: 'Ancient', de_anubis: 'Anubis', de_nuke: 'Nuke',
  de_overpass: 'Overpass', de_cache: 'Cache',
  unknown: 'Mapa desconhecido',
};

const SHOWCASE_MAPS = [
  {
    name: 'Mirage', map: 'de_mirage',
    heat: 'radial-gradient(circle 50px at 48% 52%, rgba(255,30,0,0.5), transparent 70%), radial-gradient(circle 35px at 28% 60%, rgba(255,140,0,0.4), transparent 70%), radial-gradient(circle 28px at 70% 35%, rgba(255,200,0,0.3), transparent 70%), radial-gradient(circle 20px at 42% 36%, rgba(200,255,0,0.2), transparent 70%)',
    insights: ['Morreu 7x no Mid', 'Morreu 5x Bomb B'],
  },
  {
    name: 'Dust 2', map: 'de_dust2',
    heat: 'radial-gradient(circle 55px at 30% 55%, rgba(255,30,0,0.5), transparent 70%), radial-gradient(circle 40px at 45% 45%, rgba(255,100,0,0.4), transparent 70%), radial-gradient(circle 30px at 65% 28%, rgba(255,180,0,0.35), transparent 70%), radial-gradient(circle 22px at 25% 32%, rgba(200,255,0,0.2), transparent 70%)',
    insights: ['Morreu 9x Long A', 'Morreu 4x Mid Doors'],
  },
  {
    name: 'Inferno', map: 'de_inferno',
    heat: 'radial-gradient(circle 50px at 60% 65%, rgba(255,30,0,0.5), transparent 70%), radial-gradient(circle 38px at 45% 45%, rgba(255,140,0,0.4), transparent 70%), radial-gradient(circle 30px at 30% 30%, rgba(255,200,0,0.3), transparent 70%), radial-gradient(circle 24px at 55% 38%, rgba(200,255,0,0.25), transparent 70%)',
    insights: ['Morreu 6x Banana', 'Morreu 3x no Mid'],
  },
  {
    name: 'Ancient', map: 'de_ancient',
    heat: 'radial-gradient(circle 48px at 50% 50%, rgba(255,30,0,0.5), transparent 70%), radial-gradient(circle 35px at 70% 55%, rgba(255,140,0,0.4), transparent 70%), radial-gradient(circle 28px at 30% 40%, rgba(255,200,0,0.3), transparent 70%)',
    insights: ['Morreu 5x no Mid', 'Morreu 4x B site'],
  },
  {
    name: 'Nuke', map: 'de_nuke',
    heat: 'radial-gradient(circle 45px at 45% 50%, rgba(255,30,0,0.5), transparent 70%), radial-gradient(circle 35px at 70% 40%, rgba(255,140,0,0.4), transparent 70%), radial-gradient(circle 28px at 40% 35%, rgba(255,200,0,0.3), transparent 70%)',
    insights: ['Morreu 6x na Ramp', 'Morreu 3x Outside'],
  },
  {
    name: 'Overpass', map: 'de_overpass',
    heat: 'radial-gradient(circle 50px at 55% 60%, rgba(255,30,0,0.5), transparent 70%), radial-gradient(circle 38px at 42% 42%, rgba(255,140,0,0.4), transparent 70%), radial-gradient(circle 30px at 30% 35%, rgba(255,200,0,0.3), transparent 70%)',
    insights: ['Morreu 8x B Short', 'Morreu 4x Connector'],
  },
];

const SHOWCASE_FEATURES = [
  { icon: '\u{1F525}', title: 'Heatmap de Mortes', desc: 'Veja exatamente onde voce morre em cada mapa. Identifique padroes e evite posicoes perigosas.' },
  { icon: '\u{1F3AF}', title: 'Heatmap de Kills', desc: 'Descubra onde voce e mais letal. Aproveite suas posicoes fortes e domine o mapa.' },
  { icon: '\u{1F5FA}', title: 'Analise por Mapa', desc: 'Estatisticas detalhadas por mapa: K/D, HS%, vitorias, derrotas e muito mais.' },
  { icon: '\u{23F1}', title: 'Tempo de Round', desc: 'Entenda em qual momento do round voce morre. Ajuste seu timing e rotacoes.' },
  { icon: '\u{1F4A3}', title: 'Utilitarios', desc: 'Analise onde voce joga flashbangs, smokes e granadas. Otimize seu uso de utilidades.' },
  { icon: '\u{1F4CA}', title: 'Historico de Partidas', desc: 'Acompanhe suas ultimas partidas com K/D/A, resultado e mapa jogado.' },
];

const HITGROUP_LABELS = {
  head: 'Cabeça',
  chest: 'Peito',
  stomach: 'Estômago',
  left_arm: 'Braço esq.',
  right_arm: 'Braço dir.',
  left_leg: 'Perna esq.',
  right_leg: 'Perna dir.',
  neck: 'Pescoço',
};

function weaponDisplayName(weapon) {
  if (!weapon) return '—';
  const w = weapon.replace(/^weapon_/, '');
  const upper = w.toUpperCase();
  if (w === 'ak47') return 'AK-47';
  if (w === 'm4a1' || w === 'm4a1_silencer') return 'M4A1';
  if (w === 'awp') return 'AWP';
  if (w === 'deagle') return 'Deagle';
  if (w === 'usp_silencer') return 'USP-S';
  if (w === 'glock') return 'Glock';
  return upper;
}

function KdGauge({ value, label }) {
  const kd = Number(value) || 0;
  const pct = Math.min(1, kd / 2);
  const deg = pct * 360;
  const isPositive = kd >= 1;
  return (
    <div className="perf-faceit-gauge">
      <div
        className="perf-faceit-gauge-ring"
        style={{
          background: `conic-gradient(${isPositive ? '#4caf50' : '#ef5350'} 0deg ${deg}deg, rgba(255,255,255,0.12) ${deg}deg 360deg)`,
        }}
      />
      <div className="perf-faceit-gauge-inner">
        <span className="perf-faceit-gauge-value">{kd > 0 ? kd.toFixed(2) : '—'}</span>
        <span className="perf-faceit-gauge-label">{label}</span>
      </div>
    </div>
  );
}

function WarmupTab({ warmupStats, warmupLoading, profileData, levelStyle }) {
  if (warmupLoading) {
    return <div className="perf-loading">Carregando estatísticas de warmup...</div>;
  }

  const hasData = warmupStats && (warmupStats.totalKills > 0 || warmupStats.totalDeaths > 0);
  const insights = warmupStats?.insights ?? [];
  const weapons = Object.entries(warmupStats?.weaponKills || {}).sort((a, b) => b[1] - a[1]);
  const hitLocation = Object.entries(warmupStats?.hitLocation || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="perf-faceit">
      <div className="perf-faceit-hero">
        <Avatar avatarUrl={profileData?.avatarUrl} className="perf-faceit-avatar" />
        <div className="perf-faceit-hero-text">
          <span className="perf-faceit-username">{profileData?.displayName || 'Jogador'}</span>
          <span
            className="perf-faceit-level"
            style={{ backgroundColor: levelStyle?.backgroundColor, color: levelStyle?.color }}
          >
            LVL {profileData?.level || 1}
          </span>
        </div>
        <p className="perf-faceit-sub">Warmup (Deathmatch) — estatísticas independentes do PUG.</p>
      </div>

      {!hasData ? (
        <div className="perf-faceit-empty">
          <span className="perf-faceit-empty-icon">🎯</span>
          <p>Jogue no servidor Warmup para gerar estatísticas.</p>
          <p className="perf-faceit-empty-hint">Kills, mortes, HS%, tempo de reação e desempenho por arma serão registrados.</p>
        </div>
      ) : (
        <>
          <div className="perf-faceit-row">
            <div className="perf-faceit-card perf-faceit-card--gauge">
              <KdGauge value={warmupStats.kd} label="K/D" />
            </div>
            <div className="perf-faceit-card">
              <div className="perf-faceit-card-icon perf-faceit-card-icon--skull">💀</div>
              <div className="perf-faceit-card-value">{warmupStats.hsPercent}%</div>
              <div className="perf-faceit-card-label">HS%</div>
              <div className="perf-faceit-card-detail">
                {warmupStats.totalHeadshots} / {warmupStats.totalKills} kills
              </div>
            </div>
            <div className="perf-faceit-card">
              <div className="perf-faceit-card-icon perf-faceit-card-icon--target">⏱</div>
              <div className="perf-faceit-card-value">
                {warmupStats.avgReactionMs != null ? `${warmupStats.avgReactionMs} ms` : '—'}
              </div>
              <div className="perf-faceit-card-label">Reação</div>
              <div className="perf-faceit-card-detail">Primeiro hit → kill</div>
            </div>
            <div className="perf-faceit-card">
              <div className="perf-faceit-card-icon perf-faceit-card-icon--trophy">📊</div>
              <div className="perf-faceit-card-value">{warmupStats.totalKills} / {warmupStats.totalDeaths}</div>
              <div className="perf-faceit-card-label">Kills / Mortes</div>
            </div>
          </div>

          <div className="perf-faceit-row">
            {weapons.length > 0 && (
              <div className="perf-faceit-card perf-faceit-card--wide">
                <h3 className="perf-faceit-card-title">Most Kills</h3>
                <div className="perf-faceit-list">
                  {weapons.slice(0, 8).map(([weapon, kills]) => (
                    <div key={weapon} className="perf-faceit-list-row">
                      <span className="perf-faceit-list-name">{weaponDisplayName(weapon)}</span>
                      <span className="perf-faceit-list-value">{kills}</span>
                    </div>
                  ))}
                </div>
                {warmupStats.bestWeapon && (
                  <p className="perf-faceit-best">Melhor arma: <strong>{weaponDisplayName(warmupStats.bestWeapon)}</strong></p>
                )}
              </div>
            )}
            {hitLocation.length > 0 && (
              <div className="perf-faceit-card perf-faceit-card--wide perf-hitzone-card">
                <h3 className="perf-faceit-card-title">Onde você acerta</h3>
                <div className="perf-hitzone-wrap">
                  <div className="perf-hitzone-figure">
                    {/* Boneco (imagem) com porcentagens em cima nos locais respectivos */}
                    <img
                      src="/images/warmup-target-figure.png"
                      alt=""
                      className="perf-hitzone-silhouette perf-hitzone-figure-img"
                      aria-hidden
                    />
                    <div className="perf-hitzone-labels">
                      {[
                        { key: 'head', x: 50, y: 10, label: 'Cabeça' },
                        { key: 'neck', x: 50, y: 19, label: 'Pescoço' },
                        { key: 'chest', x: 50, y: 33, label: 'Peito' },
                        { key: 'stomach', x: 50, y: 47, label: 'Estômago' },
                        { key: 'left_arm', x: 24, y: 40, label: 'Braço esq.' },
                        { key: 'right_arm', x: 76, y: 40, label: 'Braço dir.' },
                        { key: 'left_leg', x: 40, y: 78, label: 'Perna esq.' },
                        { key: 'right_leg', x: 60, y: 78, label: 'Perna dir.' },
                      ].map(({ key, x, y, label }) => {
                        const count = (warmupStats?.hitLocation || {})[key] || 0;
                        const total = hitLocation.reduce((s, [, c]) => s + c, 0);
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={key} className="perf-hitzone-item" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
                            <span className="perf-hitzone-pct">{pct}%</span>
                            <span className="perf-hitzone-name">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="perf-hitzone-legend">
                    {hitLocation.map(([key, count]) => {
                      const total = hitLocation.reduce((s, [, c]) => s + c, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={key} className="perf-hitzone-legend-row">
                          <span className="perf-faceit-list-name">{HITGROUP_LABELS[key] || key}</span>
                          <span className="perf-hitzone-legend-pct">{pct}%</span>
                          <span className="perf-faceit-list-value">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {insights.length > 0 && (
            <div className="perf-faceit-card perf-faceit-card--full">
              <h3 className="perf-faceit-card-title">Sugestões de melhoria</h3>
              <ul className="perf-faceit-insights">
                {insights.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PerformanceShowcase({ buyVip, checkoutLoading }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [heatType, setHeatType] = useState('deaths');

  useEffect(() => {
    const iv = setInterval(() => {
      setActiveSlide((p) => (p + 1) % SHOWCASE_MAPS.length);
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  const cur = SHOWCASE_MAPS[activeSlide];

  return (
    <div className="perf-showcase">
      <div className="perf-showcase-hero">
        <div className="perf-showcase-hero-glow" />
        <span className="perf-showcase-badge">VIP EXCLUSIVO</span>
        <h1 className="perf-showcase-title">
          ANALISE DE<br /><span className="perf-showcase-accent">PERFORMANCE</span>
        </h1>
        <p className="perf-showcase-desc">
          Descubra seus pontos fracos e fortes com heatmaps detalhados,
          estatisticas por mapa, analise de rounds e muito mais.
          Treine com inteligencia e suba de nivel.
        </p>
      </div>

      <div className="perf-showcase-preview">
        <div className="perf-showcase-radar-wrap">
          <div className="perf-showcase-radar-card">
            <img
              src={`/images/radars/${cur.map}/radar.png`}
              alt={cur.name}
              className="perf-showcase-radar-img"
              draggable={false}
            />
            <div
              className="perf-showcase-heat-overlay"
              style={{ background: cur.heat }}
            />
            <div className="perf-showcase-radar-label">
              <span className="perf-showcase-radar-map">{cur.name}</span>
              <span className="perf-showcase-radar-type">
                {heatType === 'deaths' ? 'Mortes' : 'Kills'}
              </span>
            </div>
            <div className="perf-showcase-radar-insights">
              {cur.insights.map((ins, i) => (
                <span key={i} className="perf-showcase-insight">{ins}</span>
              ))}
            </div>
          </div>
          <div className="perf-showcase-radar-dots">
            {SHOWCASE_MAPS.map((_, i) => (
              <TrackedButton
                key={i}
                type="button"
                className={`perf-showcase-dot${i === activeSlide ? ' perf-showcase-dot--active' : ''}`}
                onClick={() => setActiveSlide(i)}
                aria-label={SHOWCASE_MAPS[i].name}
              />
            ))}
          </div>
          <div className="perf-showcase-type-btns">
            <TrackedButton
              type="button"
              className={`perf-showcase-type-btn${heatType === 'deaths' ? ' active' : ''}`}
              onClick={() => setHeatType('deaths')}
            >
              Mortes
            </TrackedButton>
            <TrackedButton
              type="button"
              className={`perf-showcase-type-btn${heatType === 'kills' ? ' active' : ''}`}
              onClick={() => setHeatType('kills')}
            >
              Kills
            </TrackedButton>
          </div>
        </div>
      </div>

      <div className="perf-showcase-features">
        <h2 className="perf-showcase-features-title">O QUE VOCE DESBLOQUEIA</h2>
        <div className="perf-showcase-features-grid">
          {SHOWCASE_FEATURES.map((feat, i) => (
            <div key={i} className="perf-showcase-feat-card">
              <span className="perf-showcase-feat-icon">{feat.icon}</span>
              <h3>{feat.title}</h3>
              <p>{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="perf-showcase-cta">
        <div className="perf-showcase-cta-glow" />
        <h2>Pronto para melhorar seu jogo?</h2>
        <p>Desbloqueie a analise completa de performance com VIP.</p>
        <TrackedButton
          type="button"
          className="perf-showcase-cta-btn"
          onClick={buyVip}
          disabled={checkoutLoading}
        >
          {checkoutLoading ? 'Processando...' : 'SEJA VIP — DESBLOQUEIE AGORA'}
        </TrackedButton>
      </div>
    </div>
  );
}
const MAP_ICON_FILES = {
  de_mirage: 'de_mirage.png', de_dust2: 'de_dust2.png', de_inferno: 'de_inferno.png',
  de_ancient: 'de_ancient.png', de_anubis: 'de_anubis.png', de_nuke: 'de_nuke.png',
  de_overpass: 'de_overpass.png', de_cache: 'de_cache.png',
};

function bareMapName(mapId) {
  if (!mapId) return mapId;
  const parts = mapId.split('/');
  return parts[parts.length - 1];
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="perf-stat-card">
      <span className="perf-stat-value" style={color ? { color } : undefined}>{value}</span>
      <span className="perf-stat-label">{label}</span>
      {sub && <span className="perf-stat-sub">{sub}</span>}
    </div>
  );
}

/** Card estilo FACEIT: valor, tendência (opcional) e barra de progresso */
function FaceitStatCard({ label, value, trend, barPct = 0, barColor = 'green' }) {
  const hasTrend = trend && (trend.direction === 'up' || trend.direction === 'down');
  return (
    <div className="perf-faceit-detail-card">
      <div className="perf-faceit-detail-head">
        <span className="perf-faceit-detail-value">{value}</span>
        {hasTrend && (
          <span className={`perf-faceit-detail-trend perf-faceit-detail-trend--${trend.direction}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <div className="perf-faceit-detail-label">{label}</div>
      <div className="perf-faceit-detail-bar-wrap">
        <div
          className={`perf-faceit-detail-bar perf-faceit-detail-bar--${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, barPct))}%` }}
        />
        <div
          className="perf-faceit-detail-bar-marker"
          style={{ left: `${Math.min(100, Math.max(0, barPct))}%` }}
        />
      </div>
    </div>
  );
}

function MapSelector({ maps, selectedMap, onSelect, mapStats }) {
  return (
    <div className="perf-map-selector">
      {maps.map((m) => {
        const active = m === selectedMap;
        const stats = mapStats?.[m];
        const bare = bareMapName(m);
        const iconFile = MAP_ICON_FILES[bare] || (bare === 'unknown' ? null : bare + '.png');
        const displayName = MAP_DISPLAY_NAMES[bare] || MAP_DISPLAY_NAMES[m] || m;
        return (
          <TrackedButton
            key={m}
            className={`perf-map-btn${active ? ' perf-map-btn--active' : ''}`}
            onClick={() => onSelect(m)}
          >
            <span className="perf-map-btn-img-wrap">
              {iconFile ? (
                <img
                  src={`${MAP_ICONS_BASE}/${iconFile}`}
                  alt={displayName}
                  className="perf-map-btn-img"
                />
              ) : (
                <span className="perf-map-btn-placeholder">{bare === 'unknown' ? '?' : bare}</span>
              )}
            </span>
            <span className="perf-map-btn-name">{displayName}</span>
            {stats && (
              <span className="perf-map-btn-stats">{stats.matches}P · {stats.wins}V</span>
            )}
          </TrackedButton>
        );
      })}
    </div>
  );
}

/** Desenha ícones nos quadrantes mais densos (★ kills / ✖ mortes) por cima do heat. */
function drawHotspotMarkers(ctx, heatData, { symbol, fillStyle, maxCells = 4, gridPx = 34 }) {
  if (!heatData.length) return;
  const cellCounts = new Map();
  for (const [x, y] of heatData) {
    const key = `${Math.floor(x / gridPx)},${Math.floor(y / gridPx)}`;
    cellCounts.set(key, (cellCounts.get(key) || 0) + 1);
  }
  const topCells = Array.from(cellCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCells);

  topCells.forEach(([key, count]) => {
    const [cx, cy] = key.split(',').map(Number);
    const centerX = cx * gridPx + gridPx / 2;
    const centerY = cy * gridPx + gridPx / 2;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.font = 'bold 17px system-ui, Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.lineWidth = 2.5;
    ctx.strokeText(symbol, 0, 0);
    ctx.fillStyle = fillStyle;
    ctx.fillText(symbol, 0, 0);
    ctx.font = '600 10px var(--font-mono, ui-monospace, monospace)';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeText(String(count), 0, 15);
    ctx.fillText(String(count), 0, 15);
    ctx.restore();
  });
}

/** Amostra de eventos reais no mapa (pontinhos) para ver dispersão junto do heat. */
function drawEventDots(ctx, rawPts, meta, internal, scale, color, maxDots = 100) {
  const arr = rawPts || [];
  if (!arr.length) return;
  const step = Math.max(1, Math.ceil(arr.length / maxDots));
  ctx.save();
  for (let i = 0; i < arr.length; i += step) {
    const p = arr[i];
    const { x, y } = gameToRadarPixel(p.x, p.y, meta, internal);
    const px = x * scale;
    const py = y * scale;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  ctx.restore();
}

/** Mapa radar completo (1:1, largura da coluna): azul = kills, vermelho = mortes (combinado). */
function HeatmapCanvas({ mapName, mode, points, pointsKills, pointsDeaths }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const radarImgRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const radarImg = radarImgRef.current;
    if (!canvas || !radarImg || !radarImg.complete) return;

    const meta = MAP_META[mapName];
    if (!meta) return;

    const size = canvas.width;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    const INTERNAL = 1024;
    // Radar inteiro no canvas (textura completa → quadrado do heatmap, sem crop central).
    const nw = radarImg.naturalWidth || INTERNAL;
    const nh = radarImg.naturalHeight || INTERNAL;
    ctx.drawImage(radarImg, 0, 0, nw, nh, 0, 0, size, size);
    const scale = size / INTERNAL;

    const toScaledHeatData = (rawPts) =>
      (rawPts || []).map((p) => {
        const { x, y } = gameToRadarPixel(p.x, p.y, meta, INTERNAL);
        return [x * scale, y * scale, 1];
      });

    const drawLayer = (heatData, isKills, pointCount) => {
      if (!heatData.length) return;
      const heatCanvas = document.createElement('canvas');
      heatCanvas.width = size;
      heatCanvas.height = size;
      const heat = simpleheat(heatCanvas);
      heat.data(heatData);
      heat.radius(38, 56);
      heat.max(Math.max(2, Math.ceil(pointCount / 18)));
      if (isKills) {
        heat.gradient({
          0.0: 'rgba(0,0,0,0)',
          0.2: 'rgba(59,130,246,0.55)',
          0.5: 'rgba(37,99,235,0.88)',
          0.78: 'rgba(29,78,216,0.95)',
          1.0: 'rgba(23,37,84,1)',
        });
      } else {
        heat.gradient({
          0.0: 'rgba(0,0,0,0)',
          0.2: 'rgba(248,113,113,0.6)',
          0.5: 'rgba(220,38,38,0.92)',
          0.78: 'rgba(185,28,28,0.98)',
          1.0: 'rgba(69,10,10,1)',
        });
      }
      heat.draw(0.42);
      ctx.drawImage(heatCanvas, 0, 0);
    };

    if (mode === 'combined') {
      const kd = toScaledHeatData(pointsKills);
      const dd = toScaledHeatData(pointsDeaths);
      if (!kd.length && !dd.length) return;
      ctx.globalAlpha = 0.88;
      if (dd.length) drawLayer(dd, false, (pointsDeaths || []).length);
      ctx.globalAlpha = 0.88;
      if (kd.length) drawLayer(kd, true, (pointsKills || []).length);
      ctx.globalAlpha = 1;
      drawEventDots(ctx, pointsDeaths, meta, INTERNAL, scale, 'rgba(248,113,113,0.85)', 120);
      drawEventDots(ctx, pointsKills, meta, INTERNAL, scale, 'rgba(96,165,250,0.9)', 120);
      drawHotspotMarkers(ctx, dd, { symbol: '✖', fillStyle: '#fecaca', maxCells: 4 });
      drawHotspotMarkers(ctx, kd, { symbol: '★', fillStyle: '#93c5fd', maxCells: 4 });
      return;
    }

    const raw = points;
    if (!raw || raw.length === 0) return;

    const heatData = toScaledHeatData(raw);
    ctx.globalAlpha = 0.9;
    drawLayer(heatData, mode === 'kills', raw.length);
    ctx.globalAlpha = 1;

    drawEventDots(ctx, raw, meta, INTERNAL, scale, mode === 'kills' ? 'rgba(96,165,250,0.85)' : 'rgba(248,113,113,0.85)', 140);
    drawHotspotMarkers(ctx, heatData, {
      symbol: mode === 'kills' ? '★' : '✖',
      fillStyle: mode === 'kills' ? '#93c5fd' : '#fecaca',
      maxCells: 4,
    });
  }, [mapName, mode, points, pointsKills, pointsDeaths]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = getRadarImageUrl(mapName);
    img.onload = () => {
      radarImgRef.current = img;
      draw();
    };
  }, [mapName, draw]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = container.clientWidth;
      // Usa a largura útil toda (radar completo visível), sem teto baixo que pareça “zoom”.
      const size = Math.max(280, Math.min(Math.floor(w), 960));
      canvas.width = size;
      canvas.height = size;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      canvas.style.maxWidth = '100%';
      canvas.style.display = 'block';
      canvas.style.margin = '0 auto';
      draw();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div className="perf-heatmap-container" ref={containerRef}>
      <canvas ref={canvasRef} width={600} height={600} className="perf-heatmap-canvas" />
      <div className="perf-heatmap-legend">
        {mode === 'combined' ? (
          <>
            <span className="perf-heatmap-legend-chip perf-heatmap-legend-chip--kill">Azul = kills</span>
            <span className="perf-heatmap-legend-chip perf-heatmap-legend-chip--death">Vermelho = mortes</span>
            <span className="perf-heatmap-legend-label">Mapa completo</span>
          </>
        ) : (
          <>
            <span className="perf-heatmap-legend-low">Poucas</span>
            <div className="perf-heatmap-legend-bar" />
            <span className="perf-heatmap-legend-high">Muitas</span>
            <span className="perf-heatmap-legend-label">
              {mode === 'kills' ? 'Kills' : 'Mortes'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function MatchRow({ match }) {
  const won = match.won;
  const kda = `${match.kills}/${match.deaths}/${match.assists}`;
  const scoreDisplay = match.myScore != null ? `${match.myScore}-${match.oppScore}` : `${match.scoreCt}-${match.scoreTr}`;
  const modeLabel = formatGameModeLabel(match.gameMode);
  const content = (
    <>
      <span className="perf-match-mode" title="Modo de jogo">{modeLabel}</span>
      <span className="perf-match-map">{MAP_DISPLAY_NAMES[match.map] || match.map}</span>
      <span className={`perf-match-result${won ? ' perf-match-result--win' : ''}`}>
        {won ? 'V' : 'D'} {scoreDisplay}
      </span>
      <span className="perf-match-kda">{kda}</span>
      <span className="perf-match-date">{new Date(match.playedAt).toLocaleDateString('pt-BR')}</span>
    </>
  );
  const className = `perf-match-row${won ? ' perf-match-row--win' : ' perf-match-row--loss'}`;
  if (match.matchId) {
    return (
      <Link to={`/match/${encodeURIComponent(match.matchId)}`} className={`${className} perf-match-row--link`} title="Ver detalhes da partida">
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}

export default function PerformancePage() {
  const auth = useAuth();
  const profileHook = useProfile();
  const authSteamId = auth.steamId;
  const authLoading = auth.loading;
  const profileData = profileHook.profile;
  const profileLoading = profileHook.loading;
  const { buyVip, checkoutLoading } = profileHook;
  const [searchParams] = useSearchParams();
  const targetSteamId = searchParams.get('steamId') || authSteamId;

  const MATCHES_PAGE_SIZE = 10;
  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchPage, setMatchPage] = useState(1);
  const [matchesHasMore, setMatchesHasMore] = useState(false);
  const [matchesPageLoading, setMatchesPageLoading] = useState(false);
  const [selectedMap, setSelectedMap] = useState('de_mirage');
  /** @type {'combined'|'kills'|'deaths'} */
  const [heatmapMode, setHeatmapMode] = useState('combined');
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [heatmapKills, setHeatmapKills] = useState([]);
  const [heatmapDeaths, setHeatmapDeaths] = useState([]);
  const [matchGameFilter, setMatchGameFilter] = useState('all');
  const [matchSortOrder, setMatchSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [heatLoading, setHeatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pug');
  const [warmupStats, setWarmupStats] = useState(null);
  const [warmupLoading, setWarmupLoading] = useState(false);

  useEffect(() => {
    if (!targetSteamId) return;
    setLoading(true);
    Promise.all([
      getPlayerStats(targetSteamId),
      getRecentMatches(targetSteamId, MATCHES_PAGE_SIZE, 1, {
        gameMode: matchGameFilter,
        sort: matchSortOrder,
      }),
    ]).then(([s, mRes]) => {
      setStats(s);
      setMatches(mRes.matches || []);
      setMatchesHasMore(mRes.hasMore ?? false);
      setMatchPage(1);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [targetSteamId, matchGameFilter, matchSortOrder]);

  const loadMatchesPage = (page) => {
    if (!targetSteamId || page < 1) return;
    setMatchesPageLoading(true);
    getRecentMatches(targetSteamId, MATCHES_PAGE_SIZE, page, {
      gameMode: matchGameFilter,
      sort: matchSortOrder,
    })
      .then((data) => {
        setMatches(data.matches || []);
        setMatchesHasMore(data.hasMore ?? false);
        setMatchPage(page);
      })
      .catch(() => {})
      .finally(() => setMatchesPageLoading(false));
  };

  useEffect(() => {
    if (!targetSteamId || activeTab !== 'warmup') return;
    setWarmupLoading(true);
    getWarmupStats(targetSteamId)
      .then(setWarmupStats)
      .catch(() => setWarmupStats(null))
      .finally(() => setWarmupLoading(false));
  }, [targetSteamId, activeTab]);

  useEffect(() => {
    if (!targetSteamId || !selectedMap) return;
    setHeatLoading(true);
    if (heatmapMode === 'combined') {
      Promise.all([
        getHeatmapData(targetSteamId, selectedMap, 'kills'),
        getHeatmapData(targetSteamId, selectedMap, 'deaths'),
      ])
        .then(([k, d]) => {
          setHeatmapKills(k.points || []);
          setHeatmapDeaths(d.points || []);
          setHeatmapPoints([]);
        })
        .catch(() => {
          setHeatmapKills([]);
          setHeatmapDeaths([]);
        })
        .finally(() => setHeatLoading(false));
      return;
    }
    getHeatmapData(targetSteamId, selectedMap, heatmapMode)
      .then((d) => {
        setHeatmapPoints(d.points || []);
        setHeatmapKills([]);
        setHeatmapDeaths([]);
      })
      .catch(() => {
        setHeatmapPoints([]);
        setHeatmapKills([]);
        setHeatmapDeaths([]);
      })
      .finally(() => setHeatLoading(false));
  }, [targetSteamId, selectedMap, heatmapMode]);

  const mapsWithData = stats?.maps ? Object.keys(stats.maps) : [];
  const allMaps = [...new Set([...mapsWithData, ...AVAILABLE_MAPS])];
  const currentMapStats = stats?.maps?.[selectedMap];

  const isVip = Boolean(profileData?.isVip);
  const levelStyle = getLevelStyle(profileData?.level || 1);

  return (
    <div className="app perf-page">
      <div className="scanlines" />
      <div className="grid-bg" />
      <header className="header">
        <div className="header-left">
          <Link to="/" className="logo-hex" aria-label="Inicio" />
          <div>
            <div className="header-title">PERFORMANCE</div>
            <div className="header-sub">ANALISE</div>
          </div>
        </div>
        <HamburgerNav activePath="/performance" auth={auth} profile={profileHook} returnTo="/performance" />
      </header>
      <div className="perf-content">
        <div className="perf-header">
          <Link to="/profile" className="perf-back-link">&larr; Perfil</Link>
          <h1 className="perf-title">Performance</h1>
        </div>

        {!authLoading && !targetSteamId && (
          <div className="perf-login-msg">Faca login com Steam para ver suas estatisticas.</div>
        )}

        {(authLoading || (targetSteamId && loading)) && (
          <div className="perf-loading">Carregando estatisticas...</div>
        )}

        {!authLoading && !profileLoading && targetSteamId && !isVip && (
          <PerformanceShowcase buyVip={buyVip} checkoutLoading={checkoutLoading} />
        )}

        {targetSteamId && !loading && stats && isVip && (
          <>
            <div className="perf-tabs">
              <TrackedButton
                type="button"
                className={`perf-tab${activeTab === 'pug' ? ' perf-tab--active' : ''}`}
                onClick={() => setActiveTab('pug')}
              >
                PUG
              </TrackedButton>
              <TrackedButton
                type="button"
                className={`perf-tab${activeTab === 'warmup' ? ' perf-tab--active' : ''}`}
                onClick={() => setActiveTab('warmup')}
              >
                Warmup
              </TrackedButton>
            </div>

            {activeTab === 'pug' && (
              <>
                <div className="perf-overview">
                  <div className="perf-user-info">
                    <Avatar avatarUrl={profileData?.avatarUrl} className="perf-avatar" />
                    <div>
                      <span className="perf-username">{profileData?.displayName || 'Jogador'}</span>
                      <span
                        className="perf-level-badge"
                        style={{ backgroundColor: levelStyle.backgroundColor, color: levelStyle.color }}
                      >
                        LVL {profileData?.level || 1}
                      </span>
                    </div>
                  </div>

                  <div className="perf-stats-grid">
                    <StatCard label="Partidas" value={stats.totalMatches} />
                    <StatCard label="Vitórias" value={stats.wins} color="#4caf50" />
                    <StatCard label="Derrotas" value={stats.losses} color="#ef5350" />
                    <StatCard label="K/D" value={stats.kd} color={stats.kd >= 1 ? '#4caf50' : '#ef5350'} />
                    <StatCard label="Kills" value={stats.totalKills} />
                    <StatCard label="Mortes" value={stats.totalDeaths} />
                    <StatCard label="Assistências" value={stats.totalAssists} />
                    <StatCard label="HS %" value={`${stats.hsPercent}%`} color="#ffa726" />
                  </div>
                </div>

                <div className="perf-section perf-section--faceit-details">
                  <h2 className="perf-section-title">Detalhes de performance</h2>
                  <div className="perf-faceit-details-grid">
                    <FaceitStatCard
                      label="Win rate"
                      value={stats.totalMatches > 0 ? `${Math.round((stats.wins / stats.totalMatches) * 100)}%` : '0%'}
                      barPct={stats.totalMatches > 0 ? (stats.wins / stats.totalMatches) * 100 : 0}
                      barColor="green"
                    />
                    <FaceitStatCard
                      label="ADR"
                      value={stats.totalRoundsPlayed > 0 ? (stats.totalDamage / stats.totalRoundsPlayed).toFixed(1) : (stats.avgAdr ? Number(stats.avgAdr).toFixed(1) : '—')}
                      barPct={stats.totalRoundsPlayed > 0 ? Math.min(100, (stats.totalDamage / stats.totalRoundsPlayed) / 120 * 100) : 0}
                      barColor="green"
                    />
                    <FaceitStatCard
                      label="K/R"
                      value={stats.totalMatches > 0 ? (stats.totalKills / Math.max(1, stats.totalMatches * 24)).toFixed(2) : '0'}
                      barPct={stats.totalMatches > 0 ? Math.min(100, (stats.totalKills / (stats.totalMatches * 24)) / 1.2 * 100) : 0}
                      barColor="green"
                    />
                    <FaceitStatCard
                      label="Clutch Success"
                      value={stats.totalClutchSuccesses != null ? String(stats.totalClutchSuccesses) : '0'}
                      barPct={stats.totalMatches > 0 ? Math.min(100, (stats.totalClutchSuccesses || 0) / Math.max(1, stats.totalMatches) / 0.5 * 100) : 0}
                      barColor="green"
                    />
                    <FaceitStatCard
                      label="Entry Success"
                      value={stats.totalEntrySuccesses != null ? String(stats.totalEntrySuccesses) : '0'}
                      barPct={stats.totalMatches > 0 ? Math.min(100, (stats.totalEntrySuccesses || 0) / Math.max(1, stats.totalMatches) / 0.5 * 100) : 0}
                      barColor="green"
                    />
                    <FaceitStatCard
                      label="Headshot %"
                      value={`${Number(stats.hsPercent) || 0}%`}
                      barPct={Number(stats.hsPercent) || 0}
                      barColor="green"
                    />
                    <FaceitStatCard
                      label="Kills / Partida"
                      value={stats.totalMatches > 0 ? (stats.totalKills / stats.totalMatches).toFixed(1) : '0'}
                      barPct={stats.totalMatches > 0 ? Math.min(100, (stats.totalKills / stats.totalMatches) / 30 * 100) : 0}
                      barColor="green"
                    />
                    <FaceitStatCard
                      label="Mortes / Partida"
                      value={stats.totalMatches > 0 ? (stats.totalDeaths / stats.totalMatches).toFixed(1) : '0'}
                      barPct={stats.totalMatches > 0 ? Math.min(100, (stats.totalDeaths / stats.totalMatches) / 30 * 100) : 0}
                      barColor="yellow"
                    />
                    <FaceitStatCard
                      label="Assists / Partida"
                      value={stats.totalMatches > 0 ? (stats.totalAssists / stats.totalMatches).toFixed(1) : '0'}
                      barPct={stats.totalMatches > 0 ? Math.min(100, (stats.totalAssists / stats.totalMatches) / 5 * 100) : 0}
                      barColor="yellow"
                    />
                  </div>
                </div>

                <div className="perf-section">
              <h2 className="perf-section-title">
                Heatmap
                {heatmapMode === 'combined' ? ' (azul = kills · vermelho = mortes)' : heatmapMode === 'kills' ? ' — Kills' : ' — Mortes'}
              </h2>

              <div className="perf-heatmap-type-toggle">
                <TrackedButton
                  type="button"
                  className={`perf-toggle-btn${heatmapMode === 'combined' ? ' perf-toggle-btn--active' : ''}`}
                  onClick={() => setHeatmapMode('combined')}
                >
                  Combinado
                </TrackedButton>
                <TrackedButton
                  type="button"
                  className={`perf-toggle-btn${heatmapMode === 'deaths' ? ' perf-toggle-btn--active' : ''}`}
                  onClick={() => setHeatmapMode('deaths')}
                >
                  Só mortes
                </TrackedButton>
                <TrackedButton
                  type="button"
                  className={`perf-toggle-btn${heatmapMode === 'kills' ? ' perf-toggle-btn--active' : ''}`}
                  onClick={() => setHeatmapMode('kills')}
                >
                  Só kills
                </TrackedButton>
              </div>

              <MapSelector
                maps={allMaps}
                selectedMap={selectedMap}
                onSelect={setSelectedMap}
                mapStats={stats.maps}
              />

              {currentMapStats && (
                <div className="perf-map-detail-stats">
                  <span>{currentMapStats.matches} partidas</span>
                  <span>{currentMapStats.wins}V / {currentMapStats.matches - currentMapStats.wins}D</span>
                  <span>{currentMapStats.kills}K / {currentMapStats.deaths}D</span>
                  <span>HS: {currentMapStats.kills > 0 ? Math.round((currentMapStats.headshots / currentMapStats.kills) * 100) : 0}%</span>
                </div>
              )}

              <div className="perf-heatmap-wrapper">
                {heatLoading ? (
                  <div className="perf-loading">Carregando heatmap...</div>
                ) : (
                  <HeatmapCanvas
                    mapName={selectedMap}
                    mode={heatmapMode}
                    points={heatmapPoints}
                    pointsKills={heatmapKills}
                    pointsDeaths={heatmapDeaths}
                  />
                )}
                {!heatLoading
                  && (heatmapMode === 'combined'
                    ? heatmapKills.length === 0 && heatmapDeaths.length === 0
                    : heatmapPoints.length === 0) && (
                  <div className="perf-heatmap-empty">
                    Sem dados neste mapa. Jogue partidas PUG para gerar o heatmap!
                  </div>
                )}
              </div>
            </div>

                {matches.length > 0 && (
                  <div className="perf-section">
                    <h2 className="perf-section-title">Histórico de partidas</h2>
                    <div className="perf-matches-filters">
                      <label className="perf-matches-filter">
                        <span>Modo</span>
                        <select
                          value={matchGameFilter}
                          onChange={(e) => {
                            setMatchGameFilter(e.target.value);
                            setMatchPage(1);
                          }}
                        >
                          <option value="all">Todos</option>
                          <option value="pug">PUG</option>
                          <option value="mix">MIX</option>
                          <option value="squad">Clan</option>
                          <option value="snaparena">SnapArena</option>
                          <option value="snaphack">SnapHack</option>
                        </select>
                      </label>
                      <label className="perf-matches-filter">
                        <span>Data</span>
                        <select
                          value={matchSortOrder}
                          onChange={(e) => {
                            setMatchSortOrder(e.target.value);
                            setMatchPage(1);
                          }}
                        >
                          <option value="desc">Mais recentes</option>
                          <option value="asc">Mais antigas</option>
                        </select>
                      </label>
                    </div>
                    <div className="perf-matches-header">
                      <span>Modo</span>
                      <span>Mapa</span>
                      <span>Resultado</span>
                      <span>K/D/A</span>
                      <span>Data</span>
                    </div>
                    {matchesPageLoading ? (
                      <div className="perf-matches-loading">Carregando...</div>
                    ) : (
                      matches.map((m, i) => <MatchRow key={m.matchId || i} match={m} />)
                    )}
                    <div className="perf-matches-pagination">
                      <TrackedButton
                        type="button"
                        className="perf-pagination-btn"
                        disabled={matchPage <= 1 || matchesPageLoading}
                        onClick={() => loadMatchesPage(matchPage - 1)}
                        aria-label="Página anterior"
                      >
                        Anterior
                      </TrackedButton>
                      <span className="perf-pagination-page">Página {matchPage}</span>
                      <TrackedButton
                        type="button"
                        className="perf-pagination-btn"
                        disabled={!matchesHasMore || matchesPageLoading}
                        onClick={() => loadMatchesPage(matchPage + 1)}
                        aria-label="Próxima página"
                      >
                        Próxima
                      </TrackedButton>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'warmup' && (
              <WarmupTab
                warmupStats={warmupStats}
                warmupLoading={warmupLoading}
                profileData={profileData}
                levelStyle={levelStyle}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
