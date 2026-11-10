// Pruebas del cálculo SWDM v4 (node --test scripts/swdm-v4.test.cjs).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { estimate, OPERATIONAL, EMBODIED, GRID_G_PER_KWH } = require('./swdm-v4.cjs');

const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test('usa los coeficientes oficiales de SWDM v4', () => {
  assert.deepEqual(OPERATIONAL, { centroDatos: 0.055, red: 0.059, dispositivo: 0.080 });
  assert.deepEqual(EMBODIED, { centroDatos: 0.012, red: 0.013, dispositivo: 0.081 });
  assert.equal(GRID_G_PER_KWH, 494);
});

test('1 GB equivale a 0,300 kWh y 148,2 gCO2e', () => {
  const result = estimate(1e9);
  close(result.operationalKwh, 0.194);
  close(result.embodiedKwh, 0.106);
  close(result.kwh, 0.3);
  close(result.gCO2e, 148.2, 1e-6);
});

test('login antes de optimizar: 2.599,8 KiB → 0,3945 gCO2e', () => {
  const result = estimate(2599.8 * 1024);
  close(result.gb, 0.0026621952);
  close(result.kwh, 0.00079865856, 1e-12);
  close(result.gCO2e, 0.394537, 1e-6);
});
