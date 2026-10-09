import { BadRequestException, Logger, ServiceUnavailableException } from '@nestjs/common';
import { readFileSync, writeFileSync, unlinkSync, copyFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { CoverageService, readCoverage } from './coverage.service';
import { synthetic, syntheticPackage } from '../../test/synthetic-coverage';
const coverageRelease = synthetic.release;
import { districtAt, normalizePoint, validateCoverage, type Coverage } from './generated/coverage';
const root = resolve(__dirname, '../../../..');
const directory = syntheticPackage();
const fixtures = { points: synthetic.points };
const sandbox = mkdtempSync(join(tmpdir(), 'distrirapido-coverage-tests-'));
let serial = 0;
function damaged(change: (dir: string) => void) {
  const dir = join(sandbox, String(++serial)); mkdirSync(dir);
  for (const name of ['manifest.json', ...Object.keys(coverageRelease.files_sha256)]) copyFileSync(join(directory, name), join(dir, name));
  change(dir); return dir;
}
beforeEach(() => jest.spyOn(Logger, 'warn').mockImplementation(() => undefined));
afterEach(() => jest.restoreAllMocks());
it.each(fixtures.points)('v1.0.0: $id', item => {
  const service = new CoverageService(); service.load(directory, coverageRelease);
  const point = normalizePoint({ longitud: item.coordinates[0], latitud: item.coordinates[1] })!;
  if (item.expected_covered) {
    expect(service.assertDelivery(point)).toEqual(point);
    expect(districtAt(readCoverage(directory, coverageRelease), point)?.id).toBe(item.expected_district);
  } else expect(() => service.assertDelivery(point)).toThrow(BadRequestException);
});
it('rechaza un punto ficticio exterior', () => {
  const service = new CoverageService(); service.load(directory, coverageRelease);
  expect(() => service.assertDelivery({ latitud: 20, longitud: 40 })).toThrow(BadRequestException);
});
it.each([{latitud:NaN,longitud:0},{latitud:Infinity,longitud:0},{latitud:91,longitud:0},{latitud:0,longitud:-181},{latitud:2.0000001,longitud:2}])('rechaza coordenadas inválidas %j', point => {
  const service=new CoverageService(); service.load(directory, coverageRelease); expect(()=>service.assertDelivery(point)).toThrow(BadRequestException);
});
it('sin inicialización falla cerrada', () => {
  expect(()=>new CoverageService().assertDelivery({latitud:2,longitud:2})).toThrow(ServiceUnavailableException);
});
it.each(['manifest.json', ...Object.keys(coverageRelease.files_sha256)])('recurso ausente %s impide confirmación', name => {
  // Own temp package only; original resources remain untouched.
  const dir=damaged(dir=>unlinkSync(join(dir,name))); const service=new CoverageService(); service.load(dir, coverageRelease);
  expect(()=>service.assertDelivery({latitud:2,longitud:2})).toThrow(ServiceUnavailableException);
});
it('directorio ausente y recarga corrupta invalidan el snapshot anterior', () => {
  const service=new CoverageService();service.load(directory, coverageRelease);expect(service.assertDelivery({latitud:2,longitud:2})).toBeDefined();
  service.load(join(sandbox,'absent'));expect(()=>service.assertDelivery({latitud:2,longitud:2})).toThrow(ServiceUnavailableException);
});
it.each(['version','enabled','files_sha256'])('rechaza manifiesto manipulado: %s', field=>{
  const dir=damaged(dir=>{const p=join(dir,'manifest.json');const m=JSON.parse(readFileSync(p,'utf8'));m[field]=field==='version'?'2.0.0':{};writeFileSync(p,JSON.stringify(m));});
  expect(()=>readCoverage(dir, coverageRelease)).toThrow('Manifiesto');
});
it('rechaza hash incorrecto aun si el GeoJSON conserva JSON válido',()=>{
  const dir=damaged(dir=>{const p=join(dir,'coverage.geojson');writeFileSync(p,readFileSync(p,'utf8')+' ');});expect(()=>readCoverage(dir, coverageRelease)).toThrow('Integridad');
});
it('valida códigos, departamento, provincia y estructura sin cambiar geometrías',()=>{
  for(const modify of [(c:Coverage)=>{c.features[0].properties.ubigeo='999999';},(c:Coverage)=>{c.features[0].properties.nombprov='JAUJA';},(c:Coverage)=>{c.features[0].properties.nombdep='OTRO';},(c:Coverage)=>{c.features[0].geometry.coordinates=[];}]){
    const c=readCoverage(directory, coverageRelease);modify(c);expect(()=>validateCoverage(c,coverageRelease.enabled)).toThrow();
  }
});
const square = (x:number) => [[[x,0],[x+4,0],[x+4,4],[x,4],[x,0]]] as [number,number][][];
const example:Coverage={type:'FeatureCollection',features:[{type:'Feature',id:'120101',properties:{ubigeo:'120101',nombdist:'HUANCAYO',nombprov:'HUANCAYO',nombdep:'JUNIN'},geometry:{type:'Polygon',coordinates:[...square(0),[[1,1],[3,1],[3,3],[1,3],[1,1]]]}}]};
it('Polygon: interior de hueco excluido y bordes incluidos',()=>{
  expect(districtAt(example,{latitud:2,longitud:2})).toBeNull();
  for(const point of [{latitud:0,longitud:0},{latitud:2,longitud:0},{latitud:2,longitud:1},{latitud:.5,longitud:.5}])expect(districtAt(example,point)?.id).toBe('120101');
});
it('MultiPolygon: partes y bordes incluidos, espacio intermedio excluido',()=>{
  const c=structuredClone(example);c.features[0].geometry={type:'MultiPolygon',coordinates:[square(0),square(6)]};
  for(const x of [0,2,4,6,8,10])expect(districtAt(c,{latitud:2,longitud:x})?.id).toBe('120101');expect(districtAt(c,{latitud:2,longitud:5})).toBeNull();
});
it('generación reproducible desde la política canónica, sin divergencia manual',()=>{
  const script=resolve(__dirname,'../../scripts/prepare-coverage.cjs');const destination=join(__dirname,'generated/coverage.ts');
  execFileSync(process.execPath,[script]);const first=readFileSync(destination);execFileSync(process.execPath,[script]);expect(readFileSync(destination)).toEqual(first);expect(first).toEqual(readFileSync(join(root,'geodata/coverage.ts')));
});

it('producción no admite el manifiesto sintético sin referencia de prueba explícita',()=>{const service=new CoverageService();service.load(directory);expect(()=>service.assertDelivery({latitud:2,longitud:2})).toThrow(ServiceUnavailableException);});
it('inicio conserva el cargador de producción por defecto',()=>{const service=new CoverageService();const load=jest.spyOn(service,'load').mockImplementation(()=>undefined);service.onModuleInit();expect(load).toHaveBeenCalledWith();});
