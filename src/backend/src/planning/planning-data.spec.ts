import { Prisma } from '@prisma/client';
import { compareLockIds, lockSnapshot, period, sources } from './planning-data';
const input = { inicio: '2030-01-01T12:00:00Z', fin: '2030-01-01T15:00:00Z', orders: [{ pedido_id: 'o', service_minutes: 0 }], vehiculo_id: 'v', conductor_ids: ['d'] };
const order = { pedido_id: 'o', estado: 'PENDIENTE', peso_kg: 1, volumen_m3: 1, ventana_inicio: new Date(input.inicio), ventana_fin: new Date(input.fin), cliente: { estado: 'ACTIVO' } };
const db = { pedido: { findMany: jest.fn() }, vehiculo: { findUnique: jest.fn() }, conductor: { findMany: jest.fn() } };
beforeEach(() => { db.pedido.findMany.mockResolvedValue([order]); db.vehiculo.findUnique.mockResolvedValue({ estado: 'DISPONIBLE', capacidad_carga_kg: 10, capacidad_volumen_m3: 5 }); db.conductor.findMany.mockResolvedValue([{ estado: 'ACTIVO', disponibilidades: [{}] }]); });
it('requiere zona horaria explícita', () => { expect(() => period('2030-01-01T12:00:00', input.fin)).toThrow(); });
it.each([0, -1, NaN])('rechaza volumen informado no positivo/finito %s', async value => { db.pedido.findMany.mockResolvedValue([{ ...order, volumen_m3: value }]); await expect(sources(db as unknown as Prisma.TransactionClient, input)).rejects.toThrow(); });
it('rechaza capacidad volumétrica negativa', async () => { db.vehiculo.findUnique.mockResolvedValue({ estado: 'DISPONIBLE', capacidad_carga_kg: 10, capacidad_volumen_m3: -1 }); await expect(sources(db as unknown as Prisma.TransactionClient, input)).rejects.toThrow(); });
it('conserva volumen desconocido como NULL', async () => { db.pedido.findMany.mockResolvedValue([{ ...order, volumen_m3: null }]); expect((await sources(db as unknown as Prisma.TransactionClient, input)).orders[0].volumen_m3).toBeNull(); });
it('ordena identificadores de bloqueo por código, sin depender del locale', () => {
  expect(['c', 'a', 'B', 'b'].sort(compareLockIds)).toEqual(['B', 'a', 'b', 'c']);
  expect(compareLockIds('a', 'b')).toBe(-1);
  expect(compareLockIds('b', 'a')).toBe(1);
  expect(compareLockIds('x', 'x')).toBe(0);
});
it('bloquea por grupo en orden fijo, sin duplicados, ids ordenados y grupos vacíos omitidos', async () => {
  const queries: Prisma.Sql[] = [];
  const lockDb = { $queryRaw: jest.fn(async (query: Prisma.Sql) => { queries.push(query); return []; }) };
  const snapshot = { orders: [{ pedido_id: 'p2', cliente_id: 'c1' }, { pedido_id: 'p1', cliente_id: 'c1' }], vehicle: { vehiculo_id: 'v1' }, drivers: [{ conductor_id: 'd1', intervals: [] }] } as unknown as Parameters<typeof lockSnapshot>[1];
  await lockSnapshot(lockDb as unknown as Prisma.TransactionClient, snapshot);
  expect(queries.map(q => [q.sql, q.values])).toEqual([
    ['SELECT pedido_id FROM pedidos WHERE pedido_id IN (?::uuid,?::uuid) ORDER BY pedido_id FOR SHARE', ['p1', 'p2']],
    ['SELECT cliente_id FROM clientes WHERE cliente_id IN (?::uuid) ORDER BY cliente_id FOR SHARE', ['c1']],
    ['SELECT vehiculo_id FROM vehiculos WHERE vehiculo_id IN (?::uuid) ORDER BY vehiculo_id FOR SHARE', ['v1']],
    ['SELECT conductor_id FROM conductores WHERE conductor_id IN (?::uuid) ORDER BY conductor_id FOR SHARE', ['d1']],
  ]);
});
