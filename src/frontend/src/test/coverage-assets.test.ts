// @vitest-environment node
import { vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import synthetic from '../../../../test-fixtures/coverage-synthetic.json';
import { coverageAssets } from '../../coverage-assets';
vi.mock('node:fs', () => { const mocks = { existsSync: vi.fn(), readFileSync: vi.fn() }; return { ...mocks, default: mocks }; });
function configured(bytes = JSON.stringify(synthetic.coverage)) {
  vi.mocked(readFileSync).mockReset().mockReturnValueOnce(JSON.stringify(synthetic.release)).mockReturnValue(Buffer.from(bytes));
  return coverageAssets();
}
function bundle(plugin: ReturnType<typeof coverageAssets>, emitFile: ReturnType<typeof vi.fn>) {
  const hook = plugin.generateBundle as unknown as (this: { emitFile: typeof emitFile }) => void;
  hook.call({ emitFile });
}
it('build sin paquete privado no emite cobertura ni fixtures de prueba', () => {
  vi.mocked(existsSync).mockReturnValue(false); const emit = vi.fn(); bundle(configured(), emit); expect(emit).not.toHaveBeenCalled();
});
it('emite únicamente bytes que coinciden con el hash esperado', () => {
  vi.mocked(existsSync).mockReturnValue(true); const emit = vi.fn(); bundle(configured(), emit);
  expect(emit).toHaveBeenCalledExactlyOnceWith({ type: 'asset', fileName: 'geodata/coverage/v1/coverage.geojson', source: Buffer.from(JSON.stringify(synthetic.coverage)) });
});
it('paquete corrupto impide emitir un recurso no verificado', () => {
  vi.mocked(existsSync).mockReturnValue(true); const emit = vi.fn(); expect(() => bundle(configured('{}'), emit)).toThrow('Integridad'); expect(emit).not.toHaveBeenCalled();
});
