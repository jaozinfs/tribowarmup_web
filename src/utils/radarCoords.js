/**
 * CS2 game-world coordinates → radar-image pixel conversion.
 *
 * Values extracted from CS2 game files (resource/overviews/<map>.txt):
 *   pos_x  — world X of the left edge of the radar image
 *   pos_y  — world Y of the top edge of the radar image
 *   scale  — world units per pixel (for a 1024×1024 radar)
 *
 * Formula (same as demoinfocs-golang TranslateScale):
 *   pixelX = (worldX - pos_x) / scale
 *   pixelY = (pos_y  - worldY) / scale   ← Y flipped (game up = image down)
 */

export const MAP_META = {
  de_dust2:    { pos_x: -2476, pos_y: 3239, scale: 4.4 },
  de_mirage:   { pos_x: -3230, pos_y: 1713, scale: 5.0 },
  de_inferno:  { pos_x: -2087, pos_y: 3870, scale: 4.9 },
  de_ancient:  { pos_x: -2953, pos_y: 2164, scale: 5.0 },
  de_anubis:   { pos_x: -2796, pos_y: 3328, scale: 5.22 },
  de_nuke:     { pos_x: -3453, pos_y: 2887, scale: 7.0 },
  de_overpass: { pos_x: -4831, pos_y: 1781, scale: 5.2 },
  de_vertigo:  { pos_x: -3168, pos_y: 1762, scale: 4.0 },
  de_cache:    { pos_x: -2000, pos_y: 3250, scale: 5.5 },
  de_train:    { pos_x: -2477, pos_y: 2392, scale: 4.7 },
};

export function gameToRadarPercent(gameX, gameY, meta) {
  const px = (gameX - meta.pos_x) / meta.scale;
  const py = (meta.pos_y - gameY) / meta.scale;
  return {
    x: (px / 1024) * 100,
    y: (py / 1024) * 100,
  };
}

export function gameToRadarPixel(gameX, gameY, meta, canvasSize = 1024) {
  const ratio = canvasSize / 1024;
  return {
    x: ((gameX - meta.pos_x) / meta.scale) * ratio,
    y: ((meta.pos_y - gameY) / meta.scale) * ratio,
  };
}

export function getRadarImageUrl(mapName) {
  return `/images/radars/${mapName}/radar.png`;
}

export const AVAILABLE_MAPS = Object.keys(MAP_META);
