/**
 * Cores e fundo por level (1 = mais fraco, 100 = mais top).
 * Retorna estilo para badge em círculo.
 */

const LEVEL_COLORS = [
  { lvl: 1, bg: '#4b5563', color: '#9ca3af' },      // cinza fraco
  { lvl: 10, bg: '#6b7280', color: '#d1d5db' },
  { lvl: 20, bg: '#059669', color: '#a7f3d0' },     // verde
  { lvl: 35, bg: '#0d9488', color: '#99f6e4' },
  { lvl: 50, bg: '#2563eb', color: '#93c5fd' },     // azul
  { lvl: 65, bg: '#7c3aed', color: '#c4b5fd' },     // roxo
  { lvl: 80, bg: '#c026d3', color: '#e9d5ff' },
  { lvl: 90, bg: '#ea580c', color: '#fed7aa' },     // laranja
  { lvl: 100, bg: '#ca8a04', color: '#fef08a' },     // dourado top
];

function interpolate(stops, value) {
  const v = Math.max(1, Math.min(100, Number(value) || 1));
  let i = 0;
  while (i < stops.length - 1 && stops[i + 1].lvl <= v) i++;
  if (i >= stops.length - 1) return stops[stops.length - 1];
  const a = stops[i];
  const b = stops[i + 1];
  const t = (v - a.lvl) / (b.lvl - a.lvl);
  const lerp = (x, y) => Math.round(x + (y - x) * t);
  const hex = (r, g, b) => '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
  const parse = (h) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  };
  const [r1, g1, b1] = parse(a.bg);
  const [r2, g2, b2] = parse(b.bg);
  const [r3, g3, b3] = parse(a.color);
  const [r4, g4, b4] = parse(b.color);
  return {
    bg: hex(lerp(r1, r2), lerp(g1, g2), lerp(b1, b2)),
    color: hex(lerp(r3, r4), lerp(g3, g4), lerp(b3, b4)),
  };
}

/**
 * Retorna { backgroundColor, color } para o nível (1–100).
 * Use em um elemento com border-radius: 50% para círculo.
 */
export function getLevelStyle(level) {
  const { bg, color } = interpolate(LEVEL_COLORS, level);
  return { backgroundColor: bg, color };
}

/**
 * Retorna classe CSS para o level (para usar com estilos globais).
 */
export function getLevelClass(level) {
  const n = Math.max(1, Math.min(100, Math.floor(Number(level) || 1)));
  return `level-badge-${n}`;
}
