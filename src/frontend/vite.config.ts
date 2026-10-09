import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { coverageAssets } from './coverage-assets';
import { fileURLToPath } from 'node:url';
export default defineConfig({ plugins: [react(), coverageAssets()], envDir: '../..', server: { port: 5173, strictPort: true, fs: { allow: [fileURLToPath(new URL('../..', import.meta.url))] } } });
