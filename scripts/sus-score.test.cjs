// Pruebas del cálculo SUS (node --test scripts/sus-score.test.cjs).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { score, summarize, parseCsv, markdown, grade, adjective } = require('./sus-score.cjs');

test('aplica la fórmula estándar: impares (r − 1), pares (5 − r), suma × 2,5', () => {
  assert.deepEqual(score([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]), { odd: 20, even: 20, sum: 40, sus: 100 });
  assert.deepEqual(score([1, 5, 1, 5, 1, 5, 1, 5, 1, 5]), { odd: 0, even: 0, sum: 0, sus: 0 });
  assert.deepEqual(score([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]), { odd: 10, even: 10, sum: 20, sus: 50 });
  assert.equal(score([4, 2, 4, 1, 4, 2, 5, 2, 4, 2]).sus, 80);
});

test('rechaza respuestas fuera de la escala o incompletas', () => {
  assert.throws(() => score([0, 1, 1, 1, 1, 1, 1, 1, 1, 1]), /entero de 1 a 5/);
  assert.throws(() => score([3, 3, 3]), /10 respuestas/);
  assert.throws(() => score([3.5, 3, 3, 3, 3, 3, 3, 3, 3, 3]), /entero de 1 a 5/);
});

test('clasifica la nota y el adjetivo en los límites', () => {
  assert.equal(grade(84.1), 'A+'); assert.equal(grade(68), 'C'); assert.equal(grade(51.6), 'F');
  assert.equal(adjective(85.5), 'Excelente'); assert.equal(adjective(71.4), 'Bueno'); assert.equal(adjective(50.9), 'Aceptable (OK)'); assert.equal(adjective(10), 'Terrible');
});

test('resume la muestra: promedio, desviación, nota y umbral de 68', () => {
  const result = summarize([
    { participante: 'P1', perfil: 'Operador', answers: [4, 2, 4, 1, 4, 2, 5, 2, 4, 2] },
    { participante: 'P2', perfil: 'Conductor', answers: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3] },
  ]);
  assert.equal(result.n, 2); assert.equal(result.mean, 65); assert.equal(result.accepted, false); assert.equal(result.grade, 'C');
  assert.ok(Math.abs(result.sd - 21.2132) < 1e-3);
  assert.throws(() => summarize([]), /No hay participantes/);
});

test('lee el CSV, ignora comentarios y valida la cabecera', () => {
  const rows = parseCsv('participante,perfil,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10\n# comentario\nP1,Operador,4,2,4,1,4,2,5,2,4,2\n');
  assert.deepEqual(rows, [{ participante: 'P1', perfil: 'Operador', answers: [4, 2, 4, 1, 4, 2, 5, 2, 4, 2] }]);
  assert.throws(() => parseCsv('a,b\n1,2'), /Cabecera esperada/);
  assert.throws(() => parseCsv('participante,perfil,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10\nP1,Op,1,2'), /12 columnas/);
});

test('genera el Markdown con el cálculo paso a paso', () => {
  const text = markdown(summarize([{ participante: 'P1', perfil: 'Operador', answers: [4, 2, 4, 1, 4, 2, 5, 2, 4, 2] }]));
  assert.match(text, /\(4−1\) \+ \(4−1\) \+ \(4−1\) \+ \(5−1\) \+ \(4−1\) = 16/);
  assert.match(text, /16 × 2,5 = \*\*80,0\*\*|32 × 2,5 = \*\*80,0\*\*/);
  assert.match(text, /\| SUS promedio \| \*\*80,0\*\* \|/);
  assert.match(text, /Umbral de aceptación \(≥ 68\) \| Cumple/);
});
