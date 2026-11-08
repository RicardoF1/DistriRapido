# Inventario de capturas del cierre del Sprint 3

Capturas generadas el 2026-11-07 a partir de fuentes reales: SonarQube local en solo lectura, logs de las ejecuciones de pruebas sobre `33e7601`, registros e informes de la auditoría de accesibilidad y el frontend desplegado desde `33e7601`. Ninguna captura realizó escrituras en el backend, PostgreSQL, Jira ni SonarQube.

| Archivo | Fuente | Evidencia | Documento donde se utiliza | Datos ocultados | Observación |
|---|---|---|---|---|---|
| [calidad/01-sonarqube-quality-gate.png](calidad/01-sonarqube-quality-gate.png) | SonarQube 10.5.1 local, resumen del proyecto (Overall Code) y fila del análisis en Actividad | Análisis 9 sobre `33e7601`: Quality Gate Passed, 0 issues de seguridad, cobertura 86.8%, duplicación 0.0%, 0 Security Hotspots | 03 Calidad de código V_1_1_0, Figura 3 | Barra superior con el avatar de la cuenta (recortada) | Composición de dos recortes de la misma página; los 17 issues de Reliability son code smells (bugs = 0) |
| [calidad/02-backend-498-pruebas.png](calidad/02-backend-498-pruebas.png) | Log de `npm run test:coverage` en src/backend, 2026-11-07 14:58 -05:00 | 43/43 suites, 498/498 pruebas y fila global de cobertura | 03 Calidad de código V_1_1_0, Figura 1 | Ninguno | Extracto literal; se omiten las líneas de cobertura por archivo |
| [calidad/03-frontend-362-pruebas.png](calidad/03-frontend-362-pruebas.png) | Log de `npm run test:coverage` en src/frontend, 2026-11-07 14:58 -05:00 | 38/38 archivos, 362/362 pruebas y resumen de cobertura | 03 Calidad de código V_1_1_0, Figura 2 | Ruta local del repositorio, sustituida por [repositorio] | Extracto literal; se omite el detalle por archivo |
| [accesibilidad/01-axe-cero-violaciones.png](accesibilidad/01-axe-cero-violaciones.png) | Registro de la auditoría axe-core 4.11.3, 2026-11-07 13:42 -05:00 | 0 violaciones en 54/54 combinaciones; 0 escrituras y 0 llamadas sin simular | 05 WCAG V_1_1_0, Figura 1 | Ninguno | API simulada y guarda de red; bundle con las correcciones publicadas en `935e8c3` |
| [accesibilidad/02-lighthouse-100.png](accesibilidad/02-lighthouse-100.png) | Informe HTML de Lighthouse 13.1.0 y resumen JSON de las 18 ejecuciones, 2026-11-07 13:43-13:45 -05:00 | Accesibilidad 100 y 0 auditorías fallidas en 18/18 | 05 WCAG V_1_1_0, Figura 2 | Ninguno | API simulada; en modo snapshot el informe muestra 22/22 auditorías aprobadas |
| [accesibilidad/03-teclado-foco-zoom.png](accesibilidad/03-teclado-foco-zoom.png) | Frontend desplegado desde `33e7601`, Playwright con Microsoft Edge | Foco visible de 3 px en «Ver entregas» a 1280×900 al 200 %, sin scroll horizontal | 05 WCAG V_1_1_0, Figura 3 | Ninguno; los datos mostrados son sintéticos | API simulada con datos sintéticos y 0 escrituras |

Ninguna captura constituye una certificación WCAG 2.1 AA.

---

[← Volver al README principal](../../../../../../README.md) · [Índice documental](../../../../../README.md)
