const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const release = JSON.parse(fs.readFileSync(path.join(root, 'geodata/coverage-release.json'), 'utf8'));
const files = cp.execFileSync('git', ['ls-files', '-z', '--cached'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const forbidden = files.filter(file => file.startsWith('geodata/coverage/v1/') || /\.(?:geojson|gpkg|shp|shx|dbf|rar)$/i.test(file));
if (release.redistribution.status !== 'confirmed' || release.redistribution.publicReleaseAllowed !== true || !release.redistribution.evidence) {
  if (forbidden.length) { console.error('Publicación bloqueada: recursos geográficos en el índice:\n' + forbidden.join('\n')); process.exitCode = 1; }
  else console.log('Índice sin derivados geográficos; permisos pendientes. Esto no autoriza publicar imágenes ni desplegar públicamente.');
} else console.log('Permiso documentado; revisar manualmente su alcance antes de publicar.');
