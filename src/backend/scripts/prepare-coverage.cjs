const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const release = JSON.parse(fs.readFileSync(path.join(root, 'geodata/coverage-release.json'), 'utf8'));
const source = path.join(root, 'geodata/coverage.ts');
const generated = path.resolve(__dirname, '../src/coverage/generated');
if (release.version !== '1.0.0') throw new Error('Versión de cobertura no aprobada.');
fs.mkdirSync(generated, { recursive: true });
// Copy the canonical source exactly; never maintain this artifact manually.
fs.writeFileSync(path.join(generated, 'coverage.ts'), fs.readFileSync(source));
fs.writeFileSync(path.join(generated, 'release.ts'), '// Generated from geodata/coverage-release.json.\nexport const coverageRelease = ' + JSON.stringify(release) + ' as const;\n');
console.log('Política canónica preparada: ' + crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'));
