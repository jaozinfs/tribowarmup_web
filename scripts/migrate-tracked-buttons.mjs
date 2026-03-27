/**
 * One-shot: replace <button> with <TrackedButton> and add import.
 * Run from cs2-browser/: node scripts/migrate-tracked-buttons.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'src');

function relImport(fromFile, toTracked) {
  const dir = path.dirname(fromFile);
  let rel = path.relative(dir, toTracked).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel.replace(/\.jsx$/i, '');
}

const trackedPath = path.join(root, 'components', 'TrackedButton.jsx');

const files = [];
function walk(d) {
  for (const name of fs.readdirSync(d)) {
    const p = path.join(d, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(jsx|tsx)$/.test(name)) files.push(p);
  }
}
walk(root);

let changed = 0;
for (const file of files) {
  if (file.replace(/\\/g, '/').endsWith('TrackedButton.jsx')) continue;
  let s = fs.readFileSync(file, 'utf8');
  if (!s.includes('<button') && !s.includes('<button\n')) continue;
  if (s.includes('TrackedButton') && !s.includes('<button')) continue;

  const impPath = relImport(file, trackedPath);
  const importLine = `import { TrackedButton } from '${impPath}';`;

  if (!s.includes('TrackedButton')) {
    const lines = s.split('\n');
    let insertAt = 0;
    for (let i = 0; i < lines.length; i++) {
      if (/^import\s/.test(lines[i])) insertAt = i + 1;
      else if (lines[i].trim() !== '' && !/^import\s/.test(lines[i])) break;
    }
    lines.splice(insertAt, 0, importLine);
    s = lines.join('\n');
  }

  s = s.replace(/<button\b/g, '<TrackedButton');
  s = s.replace(/<\/button>/g, '</TrackedButton>');

  fs.writeFileSync(file, s, 'utf8');
  changed += 1;
  console.log('updated', path.relative(root, file));
}

console.log('done, files:', changed);
