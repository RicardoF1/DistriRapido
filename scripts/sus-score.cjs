#!/usr/bin/env node
// Cálculo de la System Usability Scale (SUS) para el informe «04 Usabilidad» del Sprint 4.
// Uso: node scripts/sus-score.cjs <respuestas.csv>
// CSV: participante,perfil,p1,...,p10 (Likert 1–5). Imprime el detalle en Markdown.
'use strict';
const fs = require('node:fs');

const ITEMS = 10;
const THRESHOLD = 68; // promedio de referencia de la industria (Sauro, 2011)

// Escala de notas curvada de Sauro y Lewis (2016), de A+ a F.
const GRADES = [
  [84.1, 'A+'], [80.8, 'A'], [78.9, 'A-'], [77.2, 'B+'], [74.1, 'B'], [72.6, 'B-'],
  [71.1, 'C+'], [65.0, 'C'], [62.7, 'C-'], [51.7, 'D'], [0, 'F'],
];
// Adjetivos de Bangor, Kortum y Miller (2009), por límite inferior aproximado.
const ADJECTIVES = [[85.5, 'Excelente'], [71.4, 'Bueno'], [50.9, 'Aceptable (OK)'], [35.7, 'Pobre'], [0, 'Terrible']];

/** Puntaje SUS de un participante: impares (ítem − 1), pares (5 − ítem), suma × 2,5. */
function score(answers) {
  if (!Array.isArray(answers) || answers.length !== ITEMS) throw new Error(`Se esperan ${ITEMS} respuestas.`);
  answers.forEach((value, index) => {
    if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error(`La respuesta ${index + 1} debe ser un entero de 1 a 5 (recibido: ${value}).`);
  });
  const odd = answers.filter((_, index) => index % 2 === 0).reduce((sum, value) => sum + (value - 1), 0);
  const even = answers.filter((_, index) => index % 2 === 1).reduce((sum, value) => sum + (5 - value), 0);
  return { odd, even, sum: odd + even, sus: (odd + even) * 2.5 };
}

const grade = value => GRADES.find(([min]) => value >= min)[1];
const adjective = value => ADJECTIVES.find(([min]) => value >= min)[1];

function summarize(participants) {
  if (!participants.length) throw new Error('No hay participantes.');
  const scored = participants.map(participant => ({ ...participant, ...score(participant.answers) }));
  const mean = scored.reduce((sum, row) => sum + row.sus, 0) / scored.length;
  const sd = scored.length > 1 ? Math.sqrt(scored.reduce((sum, row) => sum + (row.sus - mean) ** 2, 0) / (scored.length - 1)) : 0;
  return { scored, n: scored.length, mean, sd, grade: grade(mean), adjective: adjective(mean), accepted: mean >= THRESHOLD };
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  const [header, ...rows] = lines;
  const columns = header.split(',').map(column => column.trim().toLowerCase());
  const expected = ['participante', 'perfil', ...Array.from({ length: ITEMS }, (_, index) => `p${index + 1}`)];
  if (columns.join(',') !== expected.join(',')) throw new Error(`Cabecera esperada: ${expected.join(',')}`);
  return rows.map((row, index) => {
    const cells = row.split(',').map(cell => cell.trim());
    if (cells.length !== expected.length) throw new Error(`La fila ${index + 2} debe tener ${expected.length} columnas.`);
    return { participante: cells[0], perfil: cells[1], answers: cells.slice(2).map(Number) };
  });
}

const fmt = (value, digits = 1) => value.toFixed(digits).replace('.', ',');

function markdown(result) {
  const head = `| Participante | Perfil | ${Array.from({ length: ITEMS }, (_, index) => `P${index + 1}`).join(' | ')} |`;
  const sep = `|---|---|${'---|'.repeat(ITEMS)}`;
  const raw = result.scored.map(row => `| ${row.participante} | ${row.perfil} | ${row.answers.join(' | ')} |`);
  const steps = result.scored.map(row => {
    const odd = row.answers.filter((_, index) => index % 2 === 0).map(value => `(${value}−1)`).join(' + ');
    const even = row.answers.filter((_, index) => index % 2 === 1).map(value => `(5−${value})`).join(' + ');
    return `| ${row.participante} | ${odd} = ${row.odd} | ${even} = ${row.even} | ${row.sum} × 2,5 = **${fmt(row.sus)}** | ${grade(row.sus)} |`;
  });
  return [
    '### Respuestas brutas (Likert 1–5)', '', head, sep, ...raw, '',
    '### Cálculo del puntaje SUS individual', '',
    '| Participante | Ítems impares (respuesta − 1) | Ítems pares (5 − respuesta) | Suma × 2,5 | Nota |', '|---|---|---|---|---|', ...steps, '',
    '### Resultado global', '',
    `| Indicador | Valor |`, `|---|---|`,
    `| Participantes (n) | ${result.n} |`,
    `| SUS promedio | **${fmt(result.mean)}** |`,
    `| Desviación estándar | ${fmt(result.sd)} |`,
    `| Nota (Sauro y Lewis) | ${result.grade} |`,
    `| Adjetivo (Bangor et al.) | ${result.adjective} |`,
    `| Umbral de aceptación (≥ ${THRESHOLD}) | ${result.accepted ? 'Cumple' : 'No cumple'} |`,
  ].join('\n');
}

module.exports = { score, summarize, parseCsv, markdown, grade, adjective, THRESHOLD };

if (require.main === module) {
  const file = process.argv[2];
  if (!file) { console.error('Uso: node scripts/sus-score.cjs <respuestas.csv>'); process.exit(2); }
  try { console.log(markdown(summarize(parseCsv(fs.readFileSync(file, 'utf8'))))); }
  catch (error) { console.error(error.message); process.exit(1); }
}
