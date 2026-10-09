# Fixtures geográficos sintéticos

`coverage-synthetic.json` es exclusivamente material de prueba. Polígonos construidos aritméticamente en una cuadrícula de coordenadas cerca de 0,0, con hueco y MultiPolygon. Los puntos se eligieron dentro/fuera de esas figuras inventadas. No se copió, simplificó ni derivó ninguna geometría INEI.

Los UBIGEO y nombres permiten probar el contrato de cinco distritos; las figuras no representan límites administrativos ni cobertura operativa. El campo `notice` identifica esta restricción. `files` contiene bytes JSON sintéticos y `release` sus SHA-256 reales, calculados con Node crypto; los tests ejercitan la verificación normal y los fallos por ausencia/corrupción.

Consumidores: helper backend de pruebas, setup/tests de Vitest y tests del script de aprovisionamiento en directorios temporales. No se importa en producción, no se aprovisiona en `geodata/coverage/v1/` del repositorio y no se emite al compilar la aplicación. Producción mantiene su referencia de integridad y falla cerrada si falta cobertura autorizada.

La cuadrícula tiene cinco áreas separadas, una con hueco y otra con dos partes. Los nueve puntos incluyen uno por área y cuatro exteriores. Los tests adicionales comprueban bordes, huecos, precisión, rangos, HTTP 400/503 y ausencia de transacciones/escrituras rechazadas mediante Prisma simulado.

## Siguiente documento / Siguiente trabajo recomendado

Mantener estos fixtures independientes de fuentes reales y comprobar que futuras pruebas no incorporen dependencias privadas. La validación territorial real debe verificarse separadamente en un entorno privado autorizado.
