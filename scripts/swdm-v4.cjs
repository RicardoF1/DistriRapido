#!/usr/bin/env node
// Green IT: cálculo de emisiones con el Sustainable Web Design Model v4 (SWDM v4).
// Fuente de coeficientes: https://sustainablewebdesign.org/estimating-digital-emissions/
// Uso: node scripts/swdm-v4.cjs <resumen-antes.json> <resumen-despues.json> [visitas_anuales]
// Los resúmenes son los JSON consolidados de Lighthouse (campo peso_KB por informe).
'use strict';
const fs = require('node:fs');

// Intensidad energética por segmento (kWh/GB), SWDM v4.
const OPERATIONAL = { centroDatos: 0.055, red: 0.059, dispositivo: 0.080 };
const EMBODIED = { centroDatos: 0.012, red: 0.013, dispositivo: 0.081 };
// Intensidad de carbono de la red eléctrica: media mundial (Ember), 494 gCO2e/kWh.
const GRID_G_PER_KWH = 494;
// Supuestos explícitos de este cálculo (primera visita, sin hosting verde certificado).
const GREEN_HOSTING_FACTOR = 0;
const BYTES_PER_GB = 1e9; // GB decimal, coherente con la transferencia de datos del modelo (ZB/GB del ITU).

const sum = values => Object.values(values).reduce((total, value) => total + value, 0);
const round = (value, digits) => Number(value.toFixed(digits));

function estimate(bytes) {
  const gb = bytes / BYTES_PER_GB;
  const operationalKwh = gb * (OPERATIONAL.centroDatos * (1 - GREEN_HOSTING_FACTOR) + OPERATIONAL.red + OPERATIONAL.dispositivo);
  const embodiedKwh = gb * sum(EMBODIED);
  const kwh = operationalKwh + embodiedKwh;
  return { gb, operationalKwh, embodiedKwh, kwh, gCO2e: kwh * GRID_G_PER_KWH };
}

function main() {
  const [beforeFile, afterFile, visitsArg] = process.argv.slice(2);
  if (!beforeFile || !afterFile) { console.error('Uso: node scripts/swdm-v4.cjs <antes.json> <despues.json> [visitas_anuales]'); process.exit(1); }
  const visits = Number(visitsArg ?? 500000);
  const load = file => JSON.parse(fs.readFileSync(file, 'utf8'));
  const key = name => name.replace(/^(antes|despues)-/, '');
  const before = new Map(load(beforeFile).map(row => [key(row.informe), row]));
  const after = new Map(load(afterFile).map(row => [key(row.informe), row]));
  const rows = [];
  for (const [name, b] of before) {
    const a = after.get(name);
    if (!a) continue;
    const eb = estimate(b.peso_KB * 1024);
    const ea = estimate(a.peso_KB * 1024);
    rows.push({
      pagina: name,
      antes_KB: b.peso_KB, despues_KB: a.peso_KB,
      antes_kWh: round(eb.kwh, 7), despues_kWh: round(ea.kwh, 7),
      antes_gCO2e: round(eb.gCO2e, 4), despues_gCO2e: round(ea.gCO2e, 4),
      reduccion_pct: round((1 - ea.gCO2e / eb.gCO2e) * 100, 1),
      anual_antes_kgCO2e: round(eb.gCO2e * visits / 1000, 2), anual_despues_kgCO2e: round(ea.gCO2e * visits / 1000, 2),
      ahorro_anual_kgCO2e: round((eb.gCO2e - ea.gCO2e) * visits / 1000, 2),
    });
  }
  const intensity = sum(OPERATIONAL) + sum(EMBODIED);
  console.log(JSON.stringify({
    modelo: 'Sustainable Web Design Model v4',
    coeficientes: { operacional_kWh_GB: OPERATIONAL, incorporado_kWh_GB: EMBODIED, total_kWh_GB: round(intensity, 3), red_gCO2e_kWh: GRID_G_PER_KWH, gCO2e_por_GB: round(intensity * GRID_G_PER_KWH, 1) },
    supuestos: { visitas_anuales: visits, green_hosting_factor: GREEN_HOSTING_FACTOR, visita: 'primera visita (sin caché)', bytes_por_GB: BYTES_PER_GB },
    resultados: rows,
  }, null, 1));
}

if (require.main === module) main();
module.exports = { estimate, OPERATIONAL, EMBODIED, GRID_G_PER_KWH };
