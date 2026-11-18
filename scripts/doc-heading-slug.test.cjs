const test = require('node:test');
const assert = require('node:assert/strict');
const { headingSlug } = require('./doc-heading-slug.cjs');

const cases = [
  ['texto y acentos', 'Problemática y PMV', 'problemática-y-pmv'],
  ['versiones y guiones', 'API-v2 V_1_1_0', 'api-v2-v_1_1_0'],
  ['puntuación y espacios consecutivos', 'Sprint 3 — ubicación oficial', 'sprint-3--ubicación-oficial'],
  ['etiquetas completas', 'Proyecto <strong>EcoRuta</strong>', 'proyecto-ecoruta'],
  ['atributos de etiquetas', '<span class="estado">Estado</span> actual', 'estado-actual'],
  ['etiquetas anidadas', '<strong><em>Revisión</em></strong>', 'revisión'],
  ['enlaces Markdown', 'Ver [documentación](README.md)', 'ver-documentación'],
  ['énfasis Markdown', '**Revisión** del _Sprint_', 'revisión-del-_sprint_'],
  ['cadena vacía', '', ''],
  ['etiquetas sin texto', '<span></span>', ''],
  ['menor que literal sin cierre', '2 < 3', '2--3'],
  ['apertura script incompleta de la alerta', '<script', 'script'],
  ['script incompleto tras texto', 'Estado <script', 'estado-script'],
  ['aperturas anidadas malformadas', '<<script>alert(1)</script>', 'alert1'],
];

for (const [description, heading, expected] of cases) {
  test(`genera un anchor compatible: ${description}`, () => {
    const slug = headingSlug(heading);
    assert.equal(slug, expected);
    assert.doesNotMatch(slug, /[<>]/);
  });
}

test('extrae texto para un identificador, sin ejecutar ni sanear HTML para renderizado', () => {
  assert.equal(headingSlug('<script>alert(1)</script>'), 'alert1');
});

test('procesa aperturas incompletas repetidas y conserva el texto literal', () => {
  assert.equal(headingSlug('<'.repeat(10000) + 'script'), 'script');
});
