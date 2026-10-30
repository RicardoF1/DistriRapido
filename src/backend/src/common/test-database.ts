/** Shared test guard: an explicit disposable database or an isolated test schema. */
export function assertIsolatedDatabase(value?: string): string {
  try {
    const url = new URL(value ?? ''); const database = decodeURIComponent(url.pathname.slice(1)); const schema = url.searchParams.get('schema');
    const testSchema = /^distrirapido_[a-z0-9_]+_test$/.test(schema ?? '');
    const testDatabase = /^[a-zA-Z0-9_-]+_test$/.test(database) && (schema === null || schema === 'public' || testSchema);
    if (!['postgresql:', 'postgres:'].includes(url.protocol) || !(testDatabase || testSchema)) throw new Error();
    return url.toString();
  } catch { throw new Error('Se requiere PostgreSQL aislado: base terminada en _test o schema distrirapido_*_test.'); }
}
