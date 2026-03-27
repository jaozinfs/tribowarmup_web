/**
 * Baixa os ÍCONES dos mapas (MurkyYT/cs2-map-icons) para public/images/maps/
 * Usados no veto PUG (pick/ban) e na Performance PUG. NÃO confundir com fundos (backgrounds/).
 *
 * Cache: não está no repositório; use o ícone incluído no projeto (public/images/maps/de_cache.png).
 *
 * Uso: node scripts/download-map-icons.js
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../public/images/maps');

const GITHUB_RAW = 'https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images';

const MAPS = [
  { id: 'de_anubis', name: 'de_anubis.png', url: `${GITHUB_RAW}/de_anubis.png` },
  { id: 'de_ancient', name: 'de_ancient.png', url: `${GITHUB_RAW}/de_ancient.png` },
  { id: 'de_dust2', name: 'de_dust2.png', url: `${GITHUB_RAW}/de_dust2.png` },
  { id: 'de_inferno', name: 'de_inferno.png', url: `${GITHUB_RAW}/de_inferno.png` },
  { id: 'de_mirage', name: 'de_mirage.png', url: `${GITHUB_RAW}/de_mirage.png` },
  { id: 'de_nuke', name: 'de_nuke.png', url: `${GITHUB_RAW}/de_nuke.png` },
  { id: 'de_overpass', name: 'de_overpass.png', url: `${GITHUB_RAW}/de_overpass.png` },
  // de_cache: ícone fornecido manualmente (não está no MurkyYT); já está em public/images/maps/de_cache.png
];

function getClient(url) {
  return url.startsWith('https') ? https : http;
}

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = getClient(url);
    const request = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MapIconsDownload/1.0)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`${url} => ${res.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
      file.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
    request.on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
  console.log('Salvando em:', OUT_DIR);
  for (const map of MAPS) {
    const dest = path.join(OUT_DIR, map.name);
    try {
      await download(map.url, dest);
      console.log('OK:', map.name);
    } catch (err) {
      console.error('ERRO', map.name, err.message);
    }
  }
  console.log('Concluído.');
}

main();
