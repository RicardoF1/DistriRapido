import { evaluateRoute, makeHash, routeCandidates, validateSequence, type PreparedSnapshot } from './planning-domain';
const order = (id: string, latitud: number, longitud: number, ventana_inicio: string, ventana_fin: string) => ({ pedido_id: id, cliente_id: 'c-' + id, direccion: 'Destino ' + id, latitud, longitud, peso_kg: 1, volumen_m3: 1, ventana_inicio, ventana_fin, service_minutes: 5 });
const snapshotWithOrders = (orders: PreparedSnapshot['orders']): PreparedSnapshot => ({ origin: { latitud: -12, longitud: -75, label: 'Origen' }, return_to_origin: false, inicio: '2030-01-01T12:00:00Z', fin: '2030-01-01T20:00:00Z', orders, vehicle: { vehiculo_id: 'v', capacidad_carga_kg: 100, capacidad_volumen_m3: 10 }, drivers: [{ conductor_id: 'd', intervals: [{ disponibilidad_id: 'i', inicio: '2030-01-01T00:00:00Z', fin: '2030-01-02T00:00:00Z' }] }], source_hash: 'source', coverage: { version: 'test', hash: makeHash({}) } });
const ids = (value: { orders: { pedido_id: string }[] }) => value.orders.map(o => o.pedido_id);
it('propone orden confirmado, ventana límite y vecino más cercano sin inventar distancias', () => {
  const s = snapshotWithOrders([
    order('lejos-temprano', -12.2, -75.2, '2030-01-01T12:00:00Z', '2030-01-01T13:00:00Z'),
    order('cerca-tarde', -12.001, -75, '2030-01-01T12:00:00Z', '2030-01-01T18:00:00Z'),
    order('medio', -12.1, -75.1, '2030-01-01T12:00:00Z', '2030-01-01T15:00:00Z'),
  ]);
  const [confirmado, ventana, cercano] = routeCandidates(s);
  expect(confirmado).toMatchObject({ codigo: 'ORDEN_CONFIRMADO', metodo: 'SECUENCIAL_ORDEN' });
  expect(ids(confirmado)).toEqual(['lejos-temprano', 'cerca-tarde', 'medio']);
  expect(ids(ventana)).toEqual(['lejos-temprano', 'medio', 'cerca-tarde']);
  expect(ids(cercano)).toEqual(['cerca-tarde', 'medio', 'lejos-temprano']);
  expect(new Set(routeCandidates(s).map(c => c.metodo)).size).toBe(3);
});
it('deduplica estrategias que producen el mismo orden y no duplica el orden confirmado', () => {
  const s = snapshotWithOrders([order('unico', -12, -75, '2030-01-01T12:00:00Z', '2030-01-01T18:00:00Z')]);
  const candidates = routeCandidates(s); expect(candidates).toHaveLength(1); expect(candidates[0].codigo).toBe('ORDEN_CONFIRMADO');
  const repetido = routeCandidates(snapshotWithOrders([order('b', -12.2, -75.2, '2030-01-01T12:00:00Z', '2030-01-01T14:00:00Z'), order('a', -12.001, -75, '2030-01-01T12:00:00Z', '2030-01-01T13:00:00Z')]));
  expect(repetido).toHaveLength(2); expect(repetido.map(c => c.codigo)).toEqual(['ORDEN_CONFIRMADO', 'VENTANA_LIMITE']); expect(ids(repetido[0])).toEqual(['b', 'a']); expect(ids(repetido[1])).toEqual(['a', 'b']);
});
it('no propone alternativas sin pedidos', () => { expect(routeCandidates(snapshotWithOrders([]))).toEqual([]); });
const snapshot: PreparedSnapshot = { origin: { latitud: -12, longitud: -75, label: 'Origen sintético' }, return_to_origin: false, inicio: '2030-01-01T12:00:00.000Z', fin: '2030-01-01T15:00:00.000Z', orders: [{ pedido_id: 'a', cliente_id: 'c', direccion: 'Sintética', latitud: -12.01, longitud: -75, peso_kg: 2, volumen_m3: null, ventana_inicio: '2030-01-01T12:30:00.000Z', ventana_fin: '2030-01-01T14:00:00.000Z', service_minutes: 5 }], vehicle: { vehiculo_id: 'v', capacidad_carga_kg: 10, capacidad_volumen_m3: 5 }, drivers: [{ conductor_id: 'd', intervals: [{ disponibilidad_id: 'i', inicio: '2030-01-01T12:00:00.000Z', fin: '2030-01-01T15:00:00.000Z' }] }], source_hash: 'source', coverage: { version: '1.0.0', hash: 'hash' } };
it('huella independiente del orden de claves y sensible a datos', () => { expect(makeHash({ a: 1, b: 2 })).toBe(makeHash({ b: 2, a: 1 })); expect(makeHash({ a: 1 })).not.toBe(makeHash({ a: 2 })); });
it('exige permutación completa, no repetidos ni más de 30', () => { expect(() => validateSequence(['a', 'a'])).toThrow(); expect(() => validateSequence([])).toThrow(); expect(() => validateSequence(Array.from({ length: 31 }, (_, i) => String(i)))).toThrow(); expect(() => validateSequence(['a', 'b'])).not.toThrow(); });
it('separa viaje, espera y atención sin convertir volumen desconocido en cero', () => { const result = evaluateRoute(snapshot, [{ distance_m: 1000, duration_s: 600 }]); expect(result.stops[0]).toMatchObject({ arrival: '2030-01-01T12:10:00.000Z', service_start: '2030-01-01T12:30:00.000Z', departure: '2030-01-01T12:35:00.000Z' }); expect(result.confirmable).toBe(false); expect(result.warnings).toContain('VOLUMEN_NO_EVALUABLE'); });
it('evalúa regreso, capacidades, ventanas y jornada con duración vial del proveedor', () => { const result = evaluateRoute({ ...snapshot, return_to_origin: true, fin: '2030-01-01T12:34:00.000Z', vehicle: { ...snapshot.vehicle, capacidad_carga_kg: 1 } }, [{ distance_m: 1, duration_s: 600 }, { distance_m: 1, duration_s: 600 }]); expect(result.warnings).toContain('CAPACIDAD_PESO'); expect(result.warnings).toContain('JORNADA_EXCEDIDA'); expect(result.end).toBe('2030-01-01T12:45:00.000Z'); });
