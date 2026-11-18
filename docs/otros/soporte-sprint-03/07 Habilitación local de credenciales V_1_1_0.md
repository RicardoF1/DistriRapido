# Habilitación local de credenciales de conductores

Versión: V_1_1_0. Fecha local: 2026-10-29. Autorización: habilitar etapa 2 en desarrollo local, sin ejecutar rutas ni cambiar automáticamente la contraseña de Juan. Complementa el informe 06, que documentó el estado anterior al despliegue.

## Resultado

Disponible en http://localhost:5173: Administrador → Conductores → Juan → Cuenta de acceso → Restablecer contraseña. Se abrió y canceló el formulario real con campos de contraseña vacíos; no se envió una contraseña nueva. Juan conserva correo, rol, estado, vínculo, hash y versión cero.

Se reconstruyeron y recrearon exclusivamente backend/frontend. PostgreSQL permanece en el mismo contenedor, con el mismo inicio y volumen; no se ejecutó down, reset, limpieza Docker ni eliminación de archivos del proyecto. No se aprovisionó OSRM.

## Respaldo actualizado

Ruta privada: `C:\Users\HP\Desktop\DistriRapido\.local\credential-deployment-2026-10-30T03-01-43-089Z\before-credentials.dump`.

- Formato pg_dump custom, base completa, 142344 bytes.
- SHA-256: `1fd3a2af6567c6c6fc6d2c01c9a27f57a883c96a62262e160929f23cf314d234`.
- pg_restore --list y decodificación --file=/dev/null correctos. No se restauró sobre desarrollo.
- Snapshot de conteos/hash de las ocho tablas public estable antes/después del respaldo; columnas originales registradas para comparación después del DDL.
- La carpeta permanece ignorada por Git. Contiene datos privados y nunca debe publicarse. La sesión previa usada para probar compatibilidad se conservó cifrada mediante DPAPI, sin exponer token ni contraseña.

## Migración aplicada de forma independiente

Se aplicó únicamente `202610300001_driver_credentials_version`:

```sql
ALTER TABLE "usuarios" ADD COLUMN "credentials_version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_credentials_version_nonnegative" CHECK ("credentials_version" >= 0);
```

SHA-256 del archivo: `2aa8ab5b76fb9bc84efbcd7542f06ae59a8c3e7cb079d36efa702aba3b8ab0f9`.

Antes del DDL se verificaron seis migraciones completadas, ausencia de rutas y de la columna. Cuatro migraciones antiguas tenían checksum distinto por CRLF/LF: se comprobó igualdad del contenido normalizando exclusivamente finales de línea, sin editar ninguno de esos archivos ni alterar sus registros.

El SQL exacto de credenciales se ejecutó mediante psql ON_ERROR_STOP=1 dentro de una transacción con search_path public, lock_timeout 5s y statement_timeout 30s. Un guard comprobó el estado esperado antes de ambos ALTER. Se confirmó COMMIT; después se registró el SQL ya aplicado, sin ejecutar otras migraciones:

```powershell
docker compose run --rm --no-deps backend node node_modules/prisma/build/index.js migrate resolve --applied 202610300001_driver_credentials_version
```

No se ejecutó migrate deploy, migrate dev ni el servicio de mantenimiento que aplica toda la cadena. La base tiene siete migraciones registradas; `prisma migrate status` devuelve código 1 esperado porque conserva pendiente únicamente `202610290001_planificacion_rutas`. Las tablas de rutas no existen en public; su funcionalidad no queda habilitada por este despliegue. El código compartido de rutas está incluido en las imágenes del árbol local, pero carece de tablas y OSRM configurado; no se generó ningún recorrido.

## Actualización Docker y espacio

Espacio inicial C: 2,88 GiB; después del build 2,41 GiB; al terminar aproximadamente 2,29 GiB. Se utilizó caché existente, incluidos npm ci; no se descargaron grafos ni se hizo limpieza. El espacio continúa limitado para futuras operaciones grandes.

Las imágenes se construyeron antes de tocar el esquema para detectar fallos de compilación/espacio sin afectar la base. Ambas compilaciones pasaron. Frontend mantiene la advertencia de bundle mayor de 500 kB. Las imágenes con geodata permanecen locales y privadas.

Durante la ventana se pausaron solo las aplicaciones:

```powershell
docker compose build backend frontend
# Tras build correcto y respaldo verificado:
docker compose stop backend frontend
# Aplicación dirigida y registro descritos arriba; verificación de invariantes.
docker compose up -d --no-deps --no-build backend frontend
```

Imágenes activadas:

- Backend: `sha256:de5ae959eb722d3d1c75bd98461265c347d56a724fc8ad838b9b55150a18ba90`.
- Frontend: `sha256:5df3cd2778598dc175c32e3d6163cf011e09e94b34ad86f1f49bbbf3e377f58c`.

PostgreSQL conservado: contenedor `b9412bfd92d508d4a7fd393857bd826d549e0561bd83b938cb118e21c5c18415`, inicio `2026-10-29T20:31:24.243960322Z`, volumen `distrirapido_postgres-data`. Se mantiene healthy y puerto local 5433; backend 3000 y frontend 5173. Credenciales y archivos .env intactos.

Las imágenes anteriores se conservaron con etiquetas before-credentials-20261030. **No deben usarse como rollback normal después de un restablecimiento**, porque ignoran cv y podrían reaceptar tokens revocados. Mantener una versión compatible con cv o suspender el acceso mientras se corrige; no retirar la columna ni restaurar datos sin autorización separada.

## Verificaciones posteriores

| Comprobación | Resultado |
|---|---|
| Login real Administrador y acceso a ficha/formulario | Aprobado en navegador con Docker actualizado |
| Formulario vacío, destinatario correcto y cancelar sin enviar | Aprobado |
| Anchos 390, 768, 1366 y 1440 | Sin desplazamiento horizontal |
| Login real Juan | Aprobado con su contraseña existente |
| Sesión anterior al despliegue de Juan | HTTP200; compatible con versión cero |
| Cookie HttpOnly, recarga y logout de Juan | Aprobados |
| Siete endpoints administrativos para Juan | HTTP403 |
| Juan: metadatos y reset administrativo | HTTP403 |
| Cambio propio con cuerpo vacío | HTTP400; sin cambio de contraseña |
| Hash existente de Juan | Argon2id; íntegro según snapshot de campos originales |
| Integración aislada de credenciales repetida | 14 pruebas aprobadas |
| git diff --check | Correcto; aviso previo LF/CRLF en DeliveryMap.test.tsx |

Las 14 pruebas con escrituras se ejecutaron únicamente en `distrirapido_credentials_20261030_test`, no en public. Comprueban contraseña anterior/nueva, hash Argon2id real, revocación de cookie/Bearer/JWT legado, cuatro roles, origen, límite HTTP, versiones/vínculos, concurrencia y rollback. No se repitieron innecesariamente las suites completas ya documentadas en el informe 06. La revocación real de Juan no se provocó porque su contraseña queda reservada al cambio manual del usuario.

Se compararon todas las filas usando los campos originales y excluyendo solo la nueva fila de historial: mismos hashes y conteos anteriores de usuarios, roles, conductores, clientes, pedidos, vehículos, disponibilidades y seis registros originales de migración. `credentials_version` es cero en las cuatro cuentas; la séptima fila de migración coincide con el checksum aprobado. Hubo un error de lectura regclass en el verificador, corregido con cast a texto; no fue un cambio ni un fallo de integridad de datos.

## Uso manual y comprobación de revocación

1. Administrador: abrir http://localhost:5173, iniciar sesión y entrar a Conductores → Juan → Cuenta de acceso → Restablecer contraseña. Confirmar correo `juan.conductor@ecoruta.test`, estado y destinatario.
2. Elegir una frase de contraseña de 12–128 caracteres, escribirla idéntica en ambos campos, confirmar el cierre de sesiones y enviar una sola vez. No se requiere la contraseña anterior. Este paso no lo ejecutó Codex.
3. Comunicarla mediante un canal seguro acordado; no introducirla en Git, informes, logs o mensajes públicos. No hay envío automático por correo/WhatsApp. Es definitiva, no temporal.
4. Para comprobar revocación, dejar previamente a Juan conectado en otro perfil de navegador. Tras el reset, una nueva solicitud protegida de esa sesión debe recibir 401; al enfocar/revalidar se debe solicitar login. No se promete cancelar solicitudes ya autorizadas antes del cambio.
5. El login de Juan con la contraseña anterior debe rechazarse y el nuevo admitirse; no repetir intentos innecesariamente. El Administrador conserva su sesión. Juan puede después elegir otra contraseña desde Mi cuenta con la actual.
6. Usar perfiles o contextos separados para Administrador/Juan: las pestañas de un mismo perfil comparten cookie. No guardar tokens en almacenamiento web para simular sesiones independientes.

## Git y pendientes

Rama main, HEAD `128af98b7021655c39160a92121087023ed3f931`, sin cambios de rama, staging, commit, push ni merge. Se conserva el árbol local previo; este despliegue no modificó código de aplicación ni archivos SQL existentes. Se añadió este informe y herramientas privadas de respaldo/verificación en .local. Las carpetas antiguas, recursos privados, datos y volúmenes permanecen conservados.

Pendientes: cambio manual de la contraseña de Juan cuando lo decida el usuario; migración e infraestructura de rutas por autorización separada; margen de disco para futuros builds/grafos; cupos distribuidos si se desplegaran varias réplicas.

## Siguiente documento / Siguiente trabajo recomendado

Utilizar el formulario administrativo y comprobar la revocación con Juan desde un perfil separado. Registrar solo el resultado, nunca la contraseña. La continuación de US-013 y cualquier publicación siguen siendo tareas independientes.

[← Volver al README principal](../../../README.md)
