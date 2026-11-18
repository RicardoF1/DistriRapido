# Entrega pública de avances del Sprint 3

Versión: V_1_1_0. Fecha: 2026-10-29, America/Lima. Rama: `feature/sprint-3-avances`; base `origin/main` en `128af98b7021655c39160a92121087023ed3f931`. La entrega se prepara para Pull Request en borrador, sin merge ni cierre de historias pendientes.

## Alcance compartido

- Persistencia del correo del login sin almacenar contraseña ni token en almacenamiento web.
- Panel personal del conductor con identidad verificada, navegación por rol y secciones operativas futuras claramente identificadas. El panel no presenta asignaciones ficticias ni implementa US-016/017.
- Gestión administrativa de cuentas vinculadas: selección de cuentas elegibles, creación/vinculación transaccional, prevención de duplicados, permisos y concurrencia.
- Restablecimiento administrativo de contraseñas y cambio propio con contraseña actual, Argon2id, versión de credenciales en JWT, revocación y límites de intentos.
- Incremento parcial HGR-32/US-013: preparación explícita de origen/orden/finalización, adaptador OSRM privado configurable, persistencia versionada y consulta de rutas, paradas y geometría. No hay algoritmo genético ni asignación a conductores.

## Documentación original y seguridad

Se conservan íntegros los informes técnicos 01–07, los diseños, planes, comandos de PowerShell, nombres de cuentas locales de prueba e identificadores técnicos. Su publicación fue autorizada expresamente. Una referencia documental a un archivo local no incluye ese archivo ni permite descifrarlo sin los recursos privados y contexto de Windows correspondiente.

Existe una copia privada de los originales y cambios previos con manifiesto SHA-256 en `.local/sprint3-publication-*`, ignorada por Git. No se publican los archivos cifrados de credenciales, contraseñas reales, secretos de entorno, tokens, dumps, cachés, dependencias ni compilaciones. Las carpetas antiguas backend/frontend de raíz permanecen locales; sus archivos nuevos son informes/caché generados, no módulos fuente omitidos. La arquitectura compartida permanece en src/backend y src/frontend.

La cobertura GeoJSON v1.0.0 conserva sus condiciones de redistribución pendientes: los recursos INEI de geodata/coverage/v1 y las imágenes privadas que los contienen no se publican. El código usa fail-closed si esos recursos no están aprovisionados; los fixtures sintéticos pertenecen exclusivamente a pruebas. Tampoco se publican PBF, grafos OSRM ni temporales.

## Pruebas y alcance de las evidencias

Antes de publicar se repiten typecheck, lint, pruebas completas con cobertura y builds locales de backend/frontend, además de git diff --check, control geodata y revisión del índice e historial. Los resultados definitivos se consignan en la descripción de la PR; no se presupone que GitHub Actions esté aprobado antes de ejecutarse.

Evidencias ya ejecutadas y documentadas en los informes 06 y 07: 443 pruebas backend, 294 frontend, 120 de integración PostgreSQL aislada, 94 E2E con API simulada; después del despliegue local se repitieron 14 pruebas aisladas de credenciales. Se comprobaron los accesos reales del Administrador y del conductor, sin cambiar automáticamente su contraseña. Las pruebas de API simulada no equivalen a una prueba vial real.

Durante la preparación de esta publicación no se ejecutan migraciones, pruebas con escrituras PostgreSQL ni reconstrucciones Docker. Se mantienen los umbrales de cobertura y las auditorías de CI. No se afirma que las dependencias carezcan de vulnerabilidades; continúa la deuda de auditoría identificada previamente.

## Migraciones y requisitos para otros entornos

- `202610300001_driver_credentials_version`: incluida y aplicada únicamente en el desarrollo local autorizado; cada entorno debe revisar y gestionar su aplicación antes de desplegar autenticación que lea la columna. No copiar datos o credenciales locales.
- `202610290001_planificacion_rutas`: incluida como migración aditiva revisable, pero continúa pendiente en public de desarrollo. El despliegue de credenciales no la aplicó.
- migrate deploy ejecuta todas las pendientes: no utilizarlo indiscriminadamente en una base existente si se pretende habilitar solo credenciales. Consultar el procedimiento dirigido y verificaciones del informe 07.
- No volver a un backend que ignore la versión de credenciales después de restablecer contraseñas: podría aceptar sesiones revocadas.

## Pendientes de HGR-32 / US-013

1. Aprobar y aplicar la migración de rutas en el entorno donde se hará la demostración, con respaldo y verificación previa.
2. Aprovisionar un OSRM privado autorizado, imagen/revisión fijadas y grafo vial real con capacidad de almacenamiento y memoria comprobadas. El overlay no descarga grafos ni configura por sí solo un proveedor listo.
3. Disponer de vehículo, disponibilidad, pedidos válidos y origen operativo explícito, sin alterar datos reales sin autorización.
4. Ejecutar desde el navegador un recorrido real por calles y revisar geometría, métricas, procedencia, persistencia e historial.
5. Revisar criterios de aceptación y evidencias antes de declarar US-013 terminada. Esta publicación no cierra US-013 ni habilita US-014/015/016/017.

## Siguiente documento / Siguiente trabajo recomendado

Revisar la PR en borrador y los resultados de CI. Autorizar por separado el aprovisionamiento OSRM y la migración de rutas para completar la prueba funcional real de US-013, sin mezclarla con la entrega del código.

[← Volver al README principal](../../../README.md)
