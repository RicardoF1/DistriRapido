import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
// Optional private assets; absent resources never cause a synthetic production fallback.
export function coverageAssets(): Plugin {
  const resource = fileURLToPath(new URL('../../geodata/coverage/v1/coverage.geojson', import.meta.url));
  const release = JSON.parse(readFileSync(fileURLToPath(new URL('../../geodata/coverage-release.json', import.meta.url)), 'utf8'));
  const route = '/geodata/coverage/v1/coverage.geojson';
  const read = () => {
    if (!existsSync(resource)) return null;
    const bytes = readFileSync(resource);
    if (createHash('sha256').update(bytes).digest('hex') !== release.files_sha256['coverage.geojson']) throw new Error('Integridad de cobertura privada incorrecta.');
    return bytes;
  };
  return {
    name: 'private-coverage-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== route) return next();
        try {
          const bytes = read();
          if (!bytes) { res.statusCode = 404; res.end('Cobertura no aprovisionada.'); return; }
          res.setHeader('Content-Type', 'application/geo+json'); res.end(bytes);
        } catch { res.statusCode = 503; res.end('Cobertura no verificable.'); }
      });
    },
    generateBundle() {
      const bytes = read();
      if (bytes) this.emitFile({ type: 'asset', fileName: route.slice(1), source: bytes });
    },
  };
}
