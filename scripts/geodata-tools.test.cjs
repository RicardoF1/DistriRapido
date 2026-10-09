const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const release = JSON.parse(fs.readFileSync(path.join(root, 'geodata/coverage-release.json'), 'utf8'));
function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'distrirapido-geodata-tools-'));
  fs.mkdirSync(path.join(dir, 'scripts')); fs.mkdirSync(path.join(dir, 'geodata'));
  for (const file of ['check-geodata-publication.cjs', 'provision-coverage.cjs']) fs.copyFileSync(path.join(root, 'scripts', file), path.join(dir, 'scripts', file));
  fs.writeFileSync(path.join(dir, 'geodata/coverage-release.json'), JSON.stringify(release));
  return dir;
}
function run(dir, script, args = []) { return cp.spawnSync(process.execPath, [path.join(dir, 'scripts', script), ...args], { encoding: 'utf8' }); }
function source(dir) {
  const from = path.join(dir, 'private'); fs.mkdirSync(from);
  for (const file of ['manifest.json', ...Object.keys(release.files_sha256)]) fs.copyFileSync(path.join(root, 'geodata/coverage/v1', file), path.join(from, file));
  return from;
}
test('detecta GeoJSON indexado en un repositorio temporal, sin tocar el índice real', () => {
  const dir = fixture(); cp.execFileSync('git', ['init', '--quiet', dir]);
  fs.mkdirSync(path.join(dir, 'assets')); fs.writeFileSync(path.join(dir, 'assets/district.geojson'), '{"type":"FeatureCollection","features":[]}');
  assert.equal(run(dir, 'check-geodata-publication.cjs').status, 0);
  cp.execFileSync('git', ['-C', dir, 'add', 'assets/district.geojson']);
  const result = run(dir, 'check-geodata-publication.cjs'); assert.equal(result.status, 1); assert.match(result.stderr, /district.geojson/);
});
test('aprovisiona bytes privados aprobados y es idempotente', () => {
  const dir = fixture(); const from = source(dir);
  assert.equal(run(dir, 'provision-coverage.cjs', ['--source', from]).status, 0);
  const target = path.join(dir, 'geodata/coverage/v1/coverage.geojson'); const before = fs.readFileSync(target);
  assert.equal(run(dir, 'provision-coverage.cjs', ['--source', from]).status, 0); assert.deepEqual(fs.readFileSync(target), before);
});
test('paquete corrupto falla antes de crear el destino', () => {
  const dir = fixture(); const from = source(dir); fs.writeFileSync(path.join(from, 'coverage.geojson'), '{}');
  assert.equal(run(dir, 'provision-coverage.cjs', ['--source', from]).status, 1); assert.equal(fs.existsSync(path.join(dir, 'geodata/coverage/v1')), false);
});
test('no sobrescribe un recurso distinto ya existente', () => {
  const dir = fixture(); const from = source(dir); const destination = path.join(dir, 'geodata/coverage/v1'); fs.mkdirSync(destination, { recursive: true });
  fs.writeFileSync(path.join(destination, 'coverage.geojson'), 'preserve');
  assert.equal(run(dir, 'provision-coverage.cjs', ['--source', from]).status, 1); assert.equal(fs.readFileSync(path.join(destination, 'coverage.geojson'), 'utf8'), 'preserve');
});
