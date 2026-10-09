"""Exporta cobertura administrativa INEI sin simplificar ni reparar geometrías.
Uso: python prepare_coverage.py DISTRITO.gpkg Distrito.rar
Requiere Shapely 2.2; herramienta de preparación, no dependencia de la app.
"""
import hashlib, itertools, json, math, sqlite3, struct, sys
from pathlib import Path
from shapely import from_wkb, orient_polygons, union_all
from shapely.geometry import shape, mapping, Point
from shapely.validation import explain_validity

EXPECTED = {'120101': 'HUANCAYO', '120107': 'CHILCA', '120114': 'EL TAMBO', '120119': 'HUANCAN', '120125': 'PILCOMAYO'}
RESERVED = {'120129': 'SAN AGUSTIN', '120133': 'SAPALLANGA', '120134': 'SICAYA'}
ROOT = Path(__file__).resolve().parents[1] / 'coverage' / 'v1'
SOURCE = 'https://ide.inei.gob.pe/files/Distrito.rar'
def digest(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def write(name, data):
    path = ROOT / name
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    return digest(path)
def decode(blob):
    assert blob[:2] == b'GP' and blob[2] == 0
    flags = blob[3]
    assert not (flags & 0x30), 'Geometría vacía o extendida'
    endian = '<' if flags & 1 else '>'
    assert struct.unpack(endian + 'i', blob[4:8])[0] == 4326
    envelope = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[(flags >> 1) & 7]
    geom = from_wkb(blob[8 + envelope:])
    assert geom.geom_type in ('Polygon', 'MultiPolygon') and not geom.is_empty
    assert geom.is_valid, explain_validity(geom)
    return orient_polygons(geom)
def check_geometry(g):
    polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
    count = 0
    for p in polys:
        for ring in [p.exterior, *p.interiors]:
            coords = list(ring.coords)
            assert len(coords) >= 4 and coords[0] == coords[-1]
            for x, y in coords:
                assert math.isfinite(x) and math.isfinite(y) and -180 <= x <= 180 and -90 <= y <= 90
            count += len(coords)
    return count

def main():
    gpkg, archive = map(Path, sys.argv[1:3])
    c = sqlite3.connect(f'file:{gpkg.as_posix()}?mode=ro', uri=True)
    assert c.execute('pragma integrity_check').fetchone()[0] == 'ok'
    assert c.execute('select srs_id from gpkg_geometry_columns where table_name="DISTRITO"').fetchone()[0] == 4326
    c.row_factory = sqlite3.Row
    rows = {r['ubigeo']: r for r in c.execute('select * from DISTRITO where ccdd="12" and ccpp="01"')}
    features, geometries, reports = [], {}, []
    for code, name in EXPECTED.items():
        r = rows[code]
        assert r['nombdist'] == name and r['nombprov'] == 'HUANCAYO' and r['nombdep'] == 'JUNIN'
        assert r['ccdd'] + r['ccpp'] + r['ccdi'] == code
        g = decode(r['geom']); vertices = check_geometry(g); geometries[code] = g
        properties = {k: r[k] for k in r.keys() if k != 'geom'}
        features.append({'type': 'Feature', 'id': code, 'properties': properties, 'geometry': mapping(g)})
        reports.append({'ubigeo': code, 'district': name, 'geometry_type': g.geom_type, 'valid': True, 'parts': len(g.geoms) if g.geom_type == 'MultiPolygon' else 1, 'vertices_including_closure': vertices, 'bbox': list(g.bounds)})
    for a, b in itertools.combinations(geometries, 2):
        assert geometries[a].intersection(geometries[b]).area == 0, f'Solapamiento {a}/{b}'
    union = union_all(list(geometries.values()))
    fixtures = []
    for code, g in geometries.items():
        p = g.representative_point()
        assert g.contains(p)
        fixtures.append({'id': 'inside-' + code, 'coordinates': [p.x, p.y], 'expected_covered': True, 'expected_district': code, 'origin': 'Punto interior calculado; no representa dirección ni cliente real'})
    for code, name in RESERVED.items():
        assert rows[code]['nombdist'] == name
        g = decode(rows[code]['geom']); p = g.representative_point()
        assert not union.covers(p)
        fixtures.append({'id': 'outside-reserved-' + code, 'coordinates': [p.x, p.y], 'expected_covered': False, 'expected_district': code, 'origin': 'Punto interior calculado de distrito reservado'})
    p = Point(-75.50, -11.75)
    assert not union.covers(p)
    fixtures.append({'id': 'outside-northwest', 'coordinates': [p.x, p.y], 'expected_covered': False, 'origin': 'Punto numérico exterior; no se atribuye a un distrito'})
    ROOT.mkdir(parents=True, exist_ok=True)
    hashes = {}
    for f in features:
        filename = f['id'] + '.geojson'
        hashes[filename] = write(filename, {'type': 'FeatureCollection', 'features': [f]})
    hashes['coverage.geojson'] = write('coverage.geojson', {'type': 'FeatureCollection', 'bbox': list(union.bounds), 'features': features})
    hashes['test-points.json'] = write('test-points.json', {'coordinate_order': 'longitude,latitude', 'points': fixtures})
    hashes['validation.json'] = write('validation.json', {'sqlite_integrity': 'ok', 'district_count': 5, 'geometries': reports, 'pairwise_area_overlaps': 0, 'fixture_count': len(fixtures), 'roundtrip_geojson': all(shape(f['geometry']).equals(geometries[f['id']]) for f in features), 'validator': 'Shapely 2.2.0 / GEOS'})
    write('manifest.json', {'version': '1.0.0', 'status': 'prepared-awaiting-user-approval', 'consulted_on': '2026-10-08', 'timezone': 'America/Lima', 'provider': 'INEI', 'source_url': SOURCE, 'catalog_url': 'https://ide.inei.gob.pe/', 'catalog_label': 'Distrital (Actualizado al 2023)', 'source_attribute': 'V Censo Nacional Economico', 'gpkg_last_change': c.execute('select last_change from gpkg_contents where table_name="DISTRITO"').fetchone()[0], 'crs': 'EPSG:4326 / WGS 84', 'coordinate_order': 'longitude,latitude', 'enabled': EXPECTED, 'reserved_not_in_coverage': RESERVED, 'archive_sha256': digest(archive), 'gpkg_sha256': digest(gpkg), 'files_sha256': hashes, 'processing': 'Extracción por UBIGEO y orientación de anillos; sin simplificación, redondeo, recorte, reparación ni exclusión rural.'})
    print(json.dumps({'districts': reports, 'fixture_count': len(fixtures), 'output': str(ROOT)}, ensure_ascii=False))
if __name__ == '__main__': main()
