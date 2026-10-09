const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const release = JSON.parse(fs.readFileSync(path.join(root, 'geodata/coverage-release.json'), 'utf8'));
const target = path.join(root, 'geodata/coverage/v1');
function verify(directory) {
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
  for (const key of ['version', 'enabled', 'files_sha256']) if (JSON.stringify(manifest[key]) !== JSON.stringify(release[key])) throw new Error('Paquete no aprobado: ' + key);
  for (const [name, hash] of Object.entries(release.files_sha256)) {
    if (!/^[a-zA-Z0-9.-]+$/.test(name)) throw new Error('Nombre de recurso no permitido.');
    if (crypto.createHash('sha256').update(fs.readFileSync(path.join(directory, name))).digest('hex') !== hash) throw new Error('Hash incorrecto: ' + name);
  }
}
try {
  const sourceIndex = process.argv.indexOf('--source');
  if (sourceIndex >= 0) {
    if (!process.argv[sourceIndex + 1]) throw new Error('Indica el directorio privado de origen.');
    const source = path.resolve(process.argv[sourceIndex + 1]); verify(source);
    const files = ['manifest.json', ...Object.keys(release.files_sha256)];
    // Check all collisions before writing anything. Never replace existing bytes.
    for (const name of files) if (fs.existsSync(path.join(target, name)) && !fs.readFileSync(path.join(target, name)).equals(fs.readFileSync(path.join(source, name)))) throw new Error('Recurso existente distinto; no se sobrescribe: ' + name);
    fs.mkdirSync(target, { recursive: true });
    for (const name of files) if (!fs.existsSync(path.join(target, name))) fs.copyFileSync(path.join(source, name), path.join(target, name), fs.constants.COPYFILE_EXCL);
  }
  verify(target); console.log('Cobertura privada v1.0.0 verificada; no concede permisos de publicación.');
} catch (cause) { console.error(cause.message); process.exitCode = 1; }
module.exports = { verify };
