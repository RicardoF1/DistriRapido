# Verificación de navegación US-004 — 2026-10-01

## Diagnóstico antes de modificar archivos

Se inspeccionaron AdminLayout, OrderLayout, AccessPage, AppRoutes, ProtectedRoute y el proceso Vite de localhost:5173. El proceso original PID 18192 correspondía a C:\Users\HP\Desktop\DistriRapido\frontend\node_modules\vite\bin\vite.js y era el único listener en 5173.

AdminLayout ya incluía Acceso, Usuarios y Registrar pedido sin una condición que ocultara este último al Administrador. OrderLayout y AccessPage también tenían acceso al registro para los roles permitidos. AppRoutes definía /pedidos/nuevo y ProtectedRoute autorizaba Administrador y Operador / Técnico. El código transformado servido por Vite contenía el enlace y la ruta antes del reinicio.

En un navegador nuevo contra la aplicación real, antes de reiniciar, el Administrador autenticado veía el enlace en /usuarios y accedía al formulario al pulsarlo. El operador existente también veía el enlace en su área y carecía de acceso a Usuarios. No se reprodujo un fallo del código de navegación vigente ni del código servido por Vite.

La vista descrita por el usuario corresponde a una navegación anterior, distinta de la que sirve actualmente el repositorio. No fue posible inspeccionar la pestaña original: la conexión de inspección del navegador no pudo inicializarse. Por tanto, no se puede afirmar como hecho cuál fue el mecanismo exacto que mantuvo esa vista anterior (actualización HMR no recibida, página no recargada o caché del cliente). Tampoco se afirma que el servidor Vite estuviera sirviendo código antiguo: la comprobación HTTP mostró código actualizado antes de reiniciarlo.

## Acción y archivos

Se reinició exclusivamente el Vite identificado de DistriRapido en 5173, desde frontend con el comando equivalente a npm run dev. La aplicación quedó disponible en el mismo puerto y se volvió a verificar en navegador. No se modificaron layouts, permisos, rutas, formulario, backend, .env o dependencias.

- frontend/src/features/users/users.test.tsx: nueva regresión del menú común de /usuarios → Registrar pedido → formulario.
- frontend/e2e/order-navigation.spec.ts: nueva regresión de navegación de cuatro roles en móvil/desktop, con contratos API interceptados. No crea datos en PostgreSQL.
- implementation/US-004-navegacion.md: este registro.

## Verificación ejecutada

- 83 pruebas frontend, 7 archivos: aprobadas; incluye regresiones de US-001/002/003/004 y conservación de borradores.
- TypeScript frontend y lint: aprobados.
- 8 E2E de navegación: aprobados en Edge móvil/desktop. Cubren login simulado, Administrador desde Usuarios, Operador sin Usuarios, acciones ocultas y redirección para Conductor/Auditor, campos documentados, foco, F5 y logout. Son pruebas de interfaz con API interceptada, no pruebas de autenticación backend real.
- Flujo adicional contra backend real: Administrador con login por contraseña existente → Usuarios → enlace visible → /pedidos/nuevo → diez campos visibles → foco/F5/logout y eliminación de cookie → rutas protegidas bloqueadas.
- Operador existente con cookie JWT válida de prueba firmada en memoria con la configuración local: área de Operador → Registrar pedido visible → formulario, sin Usuarios; GET /users=403. No se conoció, cambió ni se probó por contraseña la cuenta real del operador. El login frontend para ese rol se verificó con contratos API interceptados.

El primer intento de E2E tenía una interceptación demasiado amplia que capturaba archivos fuente de autenticación y carecía de encabezados CORS; se corrigió el test y los ocho casos finales pasaron. Ese error era de la prueba añadida y no explica la pantalla reportada por el usuario.

No se guardaron formularios, no se modificó PostgreSQL, no se ejecutó bootstrap y no se tocaron /docs, /prototypes ni Optica_Banglor. El script temporal de comprobación real estuvo en backend/.local, ignorado por Git, y fue retirado. No se repitieron builds o cobertura: el código de aplicación no cambió. US-004 sigue pendiente de validación manual; no se inició US-005.

## Repetir manualmente

1. El Vite ya quedó reiniciado en http://localhost:5173. En tu pestaña de /usuarios presionar Ctrl+F5 para cargar la aplicación actual. Si la sesión expiró naturalmente, volver a iniciar sesión.
2. Como Administrador, comprobar Acceso, Usuarios, Registrar pedido y Cerrar sesión en el menú de /usuarios.
3. Pulsar Registrar pedido: debe navegar a /pedidos/nuevo y mostrar nombre, dirección, latitud, longitud, peso, volumen, inicio/fin de ventana, prioridad y tipo de producto.
4. Completar parcialmente, cambiar de pestaña/aplicación y volver: conservar los valores. F5 conserva sesión, aunque puede limpiar el borrador no guardado. Cerrar sesión debe bloquear las rutas protegidas.
5. Como Operador / Técnico, iniciar sesión con su contraseña actual: Registrar pedido visible, sin Usuarios y roles. Como Conductor/Auditor, no debe aparecer Registrar pedido.

Si necesitas reiniciar otra vez: detener con Ctrl+C únicamente la terminal cuya salida corresponde a DistriRapido frontend y http://localhost:5173; desde C:\Users\HP\Desktop\DistriRapido\frontend ejecutar npm run dev. Si npm global falla, usar node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run dev. No reiniciar backend, Docker ni otros proyectos para esta comprobación.
