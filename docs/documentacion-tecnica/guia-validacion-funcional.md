# Guía de validación funcional

Recorrido de revisión técnica del sistema. Preparar una cuenta propia y datos de demostración autorizados; no mostrar contraseñas, clientes reales ni trazas privadas.

1. **Problema (1 min):** centralizar pedidos y recursos reduce la dispersión de información y permite preparar recorridos trazables. No afirmar ahorros medidos: no hay medición de negocio en esta auditoría.
2. **Arquitectura (2 min):** presentar React → API NestJS → Prisma/PostgreSQL. Separar mapa visual, cobertura administrativa, búsqueda de direcciones y cálculo OSRM.
3. **Funciones implementadas (2 min):** login, permisos, pedidos, vehículos, conductores y disponibilidad. Mostrar el código de módulos y modelo como evidencia; explicar diferencias de acceso por rol.
4. **Sprint 3 (2 min):** cuentas vinculadas, credenciales con revocación, portal personal y planificación versionada. Mostrar cronología y referencias del documento Sprint 3.
5. **HGR-32 (3 min):** explicar preparación, origen, orden, cálculo, consulta/historial y mapa. Identificar el estado parcial y los requisitos pendientes antes de abrir la pantalla.
6. **Pruebas (2 min):** presentar tabla de resultados históricos; distinguir mocks, PostgreSQL aislado y proveedor real. Exponer los fallos detectados y las correcciones del informe 05.
7. **Pendientes (1 min):** completar habilitación y aceptación de HGR-32; historias siguientes pendientes y sin optimización genética acreditada.

## Secuencia práctica

- Abrir la aplicación del entorno acordado y verificar que la versión desplegada corresponde al commit que se revisará. Esta auditoría no ha certificado ese despliegue.
- Iniciar sesión con cuenta propia; mostrar navegación y consultas de pedidos/recursos sin crear datos en public.
- En otro perfil de navegador, mostrar el portal de conductor y denegación de administración. Las pestañas del mismo perfil comparten cookies.
- Abrir `/planificacion` y `/rutas`. Si faltan migración o proveedor, explicar el error de infraestructura y mostrar controladores/tests como evidencia del avance; no improvisar una ruta.
- Solo si se completó previamente la habilitación autorizada en un entorno de demostración: seleccionar pedidos y recursos válidos, jornada, origen, orden y retorno; confirmar y calcular. Verificar distancia/tiempo/paradas/geometría y abrir detalle e historial. Registrar procedencia real del proveedor y SHA revisado.
- Si se usa el perfil Playwright mock o capturas de fixtures, rotular claramente «API y recorrido simulados para pruebas». No presentarlos como integración vial real.

Antes de la validación falta comprobar commits del compañero, disponibilidad de OSRM, migración, recursos, conectividad para teselas y reporte nuevo con fecha/commit. Si no se cumplen, documentar el incremento parcial y sus pruebas históricas. No ejecutar migraciones, restablecimientos ni altas operativas durante una revisión técnica.
