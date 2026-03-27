/**
 * Baixa imagens de fundo dos mapas (estilo HLTV) de ghostcap-gaming/cs2-map-images
 * para public/images/maps/backgrounds/ — usadas na lista de servidores e fundo da arena PUG.
 * Não sobrescreve os ícones em public/images/maps/ (veto e Performance usam ícones).
 *
 * Uso: node scripts/download-cs2-map-backgrounds.js
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../public/images/maps/backgrounds');

const GITHUB_RAW = 'https://raw.githubusercontent.com/ghostcap-gaming/cs2-map-images/main/cs2';

const MAPS = [
  'de_ancient', 'de_anubis', 'de_brewery', 'de_cache', 'de_dogtown', 'de_dust2',
  'de_grail', 'de_inferno', 'de_jura', 'de_mills', 'de_mirage', 'de_nuke',
  'de_overpass', 'de_thera', 'de_train', 'de_vertigo',
];

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CS2MapBackgrounds/1.0)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`${url} => ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
  console.log('Salvando em:', OUT_DIR);
  for (const mapId of MAPS) {
    const name = `${mapId}.png`;
    const url = `${GITHUB_RAW}/${name}`;
    const dest = path.join(OUT_DIR, name);
    try {
      const buf = await download(url);
      fs.writeFileSync(dest, buf);
      console.log('OK:', name);
    } catch (err) {
      console.error('ERRO', name, err.message);
    }
  }
  console.log('Concluído.');
}

main();
