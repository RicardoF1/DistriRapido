import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { coverageAssets } from './coverage-assets';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { constants, gzipSync } from 'node:zlib';

// Green IT (área 8): precompresión gzip (nivel 9) en el build de los recursos de texto mayores de 1 KB.
// nginx los sirve con gzip_static, sin coste de CPU por petición. Las imágenes ya están comprimidas.
const COMPRESSIBLE = /\.(js|css|html|svg|json|geojson)$/;
function precompressAssets(): Plugin {
  return {
    name: 'green-it-precompress',
    apply: 'build',
    writeBundle(options, bundle) {
      const outDir = options.dir ?? 'dist';
      for (const [fileName, output] of Object.entries(bundle)) {
        if (!COMPRESSIBLE.test(fileName)) continue;
        const source = output.type === 'chunk' ? output.code : output.source;
        const bytes = typeof source === 'string' ? Buffer.from(source) : Buffer.from(source);
        if (bytes.length < 1024) continue;
        writeFileSync(join(outDir, `${fileName}.gz`), gzipSync(bytes, { level: constants.Z_BEST_COMPRESSION }));
      }
    },
  };
}

// Green IT / estabilidad visual (CLS): precarga de las dos fuentes de título (woff2) para que no
// lleguen después del primer pintado y desplacen el contenido al sustituir la fuente de respaldo.
const PRELOAD_FONTS = /outfit-latin-(600|700)-normal-[\w-]+\.woff2$/;
function preloadHeadingFonts(): Plugin {
  return {
    name: 'green-it-preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, context) {
        return Object.keys(context.bundle ?? {}).filter(fileName => PRELOAD_FONTS.test(fileName)).sort().map(fileName => ({
          tag: 'link', injectTo: 'head' as const,
          attrs: { rel: 'preload', href: `/${fileName}`, as: 'font', type: 'font/woff2', crossorigin: '' },
        }));
      },
    },
  };
}

export default defineConfig({ plugins: [react(), coverageAssets(), preloadHeadingFonts(), precompressAssets()], envDir: '../..', server: { port: 5173, strictPort: true, fs: { allow: [fileURLToPath(new URL('../..', import.meta.url))] } } });
