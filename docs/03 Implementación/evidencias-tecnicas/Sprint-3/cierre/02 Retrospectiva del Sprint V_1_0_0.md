# 02 Retrospectiva del Sprint V_1_0_0

## Identificación

- Fecha de generación: 2026-10-30 15:55:51 -05:00
- Rama: main
- Commit corto: debc2e7
- Commit completo: debc2e7893863c64111586a32fd9a955b88c8da2
- Pull Request final: #12
- Commit de integración en main: debc2e7

## Qué funcionó bien

- Integración progresiva mediante ramas y Pull Requests.
- Uso de pruebas automatizadas para detectar duplicaciones y regresiones.
- Reconciliación de HGR-33 con HGR-34, HGR-35 y HGR-36 sin perder funcionalidad previa.
- Validación de cobertura mínima antes de fusionar a main.
- Uso de migraciones aditivas y bootstrap seguro para la cuenta administrativa local.
- Conservación de datos geográficos privados fuera de Git.

## Dificultades encontradas

- El squash de HGR-33 produjo bloques, tipos y pruebas duplicadas durante la integración.
- Una prueba de mapa fue sensible a tiempos distintos entre entorno local y GitHub Actions.
- La cobertura de ramas quedó inicialmente por debajo del umbral de 80%.
- main y la rama de integración compartían cambios equivalentes con historiales distintos, generando conflictos.
- Docker no podía construir sin el paquete privado geodata/coverage/v1.
- El puerto 5173 estaba ocupado por otro contenedor.

## Acciones de mejora

1. Evitar integrar ramas squash sobre ramas que ya contienen partes del mismo incremento sin comparar ancestros.
2. Dividir archivos extensos de planificación y páginas en módulos más pequeños.
3. Mantener pruebas asíncronas con waitFor cuando el resultado depende del ciclo de renderizado.
4. Documentar desde el inicio los prerrequisitos privados y el procedimiento de aprovisionamiento.
5. Reservar puertos por proyecto mediante variables configurables.
6. Mantener un checklist de cierre con migraciones, Docker, CI, seguridad y evidencia.

## Compromisos para el siguiente Sprint

- Aprovisionar OSRM real antes de validar rutas viales de extremo a extremo.
- Reducir advertencias de act(...) en pruebas React.
- Revisar el tamaño del bundle y aplicar división de código cuando corresponda.
- Atender dependencias con vulnerabilidades bajas sin usar actualizaciones forzadas no controladas.
