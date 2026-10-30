# 03 Calidad de código V_1_0_0

## Identificación

- Fecha de generación: 2026-10-30 15:55:51 -05:00
- Rama: main
- Commit corto: debc2e7
- Commit completo: debc2e7893863c64111586a32fd9a955b88c8da2
- Pull Request final: #12
- Commit de integración en main: debc2e7

## Resultados de pruebas

### Backend

42 suites aprobadas.
463 pruebas aprobadas.
Resultado obtenido durante la reconciliación final del Sprint 3.

### Frontend

37 archivos de pruebas aprobados.
306 pruebas aprobadas.
Cobertura: statements 87.04%, branches 80.09%, functions 83.89%, lines 92.15%.

## Métricas de cobertura frontend

| Métrica | Resultado |
|---|---:|
| Statements | 87.04% |
| Branches | 80.09% |
| Functions | 83.89% |
| Lines | 92.15% |

## Controles aplicados

- ESLint en backend y frontend.
- TypeScript build sin errores.
- Pruebas unitarias y de componentes.
- Cobertura mínima global de ramas de 80%.
- git diff --check antes de commits de reconciliación.
- Prisma validate y migrate status.
- GitHub Actions para push y pull_request.
- CodeQL y code scanning.

## Hallazgos técnicos

- Vite advierte un chunk JavaScript superior a 500 KB.
- Algunas pruebas React emiten advertencias por actualizaciones no envueltas en ct(...).
- La instalación del backend reportó seis vulnerabilidades de severidad baja.
- No se aplicó
pm audit fix --force para evitar cambios mayores no controlados.

## SonarQube

El análisis definitivo debe ejecutarse sobre main y el commit final. Registrar aquí Quality Gate, bugs, vulnerabilidades, code smells, hotspots, duplicación y deuda técnica cuando el reporte esté disponible.

## Conclusión

El incremento cumple lint, build, pruebas y cobertura mínima. Los hallazgos restantes son oportunidades de mejora y no bloquearon la entrega funcional.
<!-- SPRINT3-OSRM-STATUS -->
## Validación funcional local

Se verificó localmente el flujo de administración hasta la preparación de una planificación con dos pedidos:

- inicio de sesión administrativo;
- registro de vehículo disponible;
- registro de conductor activo;
- vinculación de cuenta de acceso del conductor;
- registro de disponibilidad;
- registro de dos pedidos con ubicación confirmada;
- selección de vehículo, conductor, origen, orden y tiempos de atención;
- preparación correcta de la planificación.

El intento de generar alternativas mostró el resultado **“La ejecución no produjo un recorrido disponible”**. La planificación funciona, pero el cálculo vial y el registro del recorrido permanecen bloqueados hasta aprovisionar y configurar OSRM con su grafo de red. Por esta razón, la consulta de rutas muestra cero recorridos registrados.
