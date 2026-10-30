import { makeHash, routeCandidates, type PreparedSnapshot } from './planning-domain';
const order = (id: string, latitud: number, longitud: number, ventana_inicio: string, ventana_fin: string) => ({ pedido_id: id, cliente_id: 'c-' + id, direccion: 'Destino ' + id, latitud, longitud, peso_kg: 1, volumen_m3: 1, ventana_inicio, ventana_fin, service_minutes: 5 });
const snapshot = (orders: PreparedSnapshot['orders']): PreparedSnapshot => ({ origin: { latitud: -12, longitud: -75, label: 'Origen' }, return_to_origin: false, inicio: '2030-01-01T12:00:00Z', fin: '2030-01-01T20:00:00Z', orders, vehicle: { vehiculo_id: 'v', capacidad_carga_kg: 100, capacidad_volumen_m3: 10 }, drivers: [{ conductor_id: 'd', intervals: [{ disponibilidad_id: 'i', inicio: '2030-01-01T00:00:00Z', fin: '2030-01-02T00:00:00Z' }] }], source_hash: 'source', coverage: { version: 'test', hash: makeHash({}) } });
const ids = (value: { orders: { pedido_id: string }[] }) => value.orders.map(o => o.pedido_id);
it('propone orden confirmado, ventana límite y vecino más cercano sin inventar distancias', () => {
  const s = snapshot([
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
  const s = snapshot([order('unico', -12, -75, '2030-01-01T12:00:00Z', '2030-01-01T18:00:00Z')]);
  const candidates = routeCandidates(s); expect(candidates).toHaveLength(1); expect(candidates[0].codigo).toBe('ORDEN_CONFIRMADO');
  const repetido = routeCandidates(snapshot([order('b', -12.2, -75.2, '2030-01-01T12:00:00Z', '2030-01-01T14:00:00Z'), order('a', -12.001, -75, '2030-01-01T12:00:00Z', '2030-01-01T13:00:00Z')]));
  expect(repetido).toHaveLength(2); expect(repetido.map(c => c.codigo)).toEqual(['ORDEN_CONFIRMADO', 'VENTANA_LIMITE']); expect(ids(repetido[0])).toEqual(['b', 'a']); expect(ids(repetido[1])).toEqual(['a', 'b']);
});
it('no propone alternativas sin pedidos', () => { expect(routeCandidates(snapshot([]))).toEqual([]); });
