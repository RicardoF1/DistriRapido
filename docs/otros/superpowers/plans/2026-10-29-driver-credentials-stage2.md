# Etapa 2: credenciales de conductores

Especificación aprobada: diseño de credenciales V_1_1_0 y solicitud de implementación de etapa 2. Se conserva todo el trabajo previo, sin commits ni despliegue en desarrollo.

## Contrato y decisiones

- Contraseña definitiva, no temporal: 12–128 caracteres, frases admitidas, sin exigencia de combinaciones arbitrarias. No recortar ni normalizar; rechazar blanco, confirmación distinta y reutilización inmediata.
- Administrador: consulta versión mínima y restablece exclusivamente la cuenta actualmente vinculada mediante conductor + usuario/version esperados + confirmación explícita.
- Conductor: cambio propio con contraseña actual y nueva confirmada. No admite identificadores suministrados por el navegador. Cierra también su sesión actual y requiere nuevo login.
- Hash Argon2id, versión incremental atómica, CAS y transacción Serializable sin reintentos. JWT antiguo sin cv solo válido con versión cero. No revertir a un backend que ignore cv.
- Limitación por IP existente más límite por actor y cuenta objetivo para cambios. Primera implementación mono-instancia; no promete cupos distribuidos.
- Migración independiente y aditiva, posterior a rutas; aplicación exclusiva en esquema PostgreSQL de pruebas. No migrate deploy en desarrollo porque aplicaría también rutas pendientes.

## Secuencia TDD y verificación

1. Respaldo del código y estado previo; RED de JWT/versiones.
2. Migración, autenticación, servicio/DTO/controladores, permisos y concurrencia.
3. RED de formularios; interfaz administrativa y Mi cuenta sin persistencia de secretos.
4. PostgreSQL aislado: migración, Argon2 real, sesiones, carreras y permisos HTTP.
5. Suites completas, tipos, lint, builds, E2E simulada y regresión real sin modificar credenciales.
6. Informe y revisión final; detener antes de migrar desarrollo.

## Registro

- Respaldo de 380 archivos en carpeta privada `.local/credential-stage2-*`; no se incluyen en Git.
- RED JWT: 7 fallos esperados (cv ausente, inválido y legado revocado).
- Las cuentas y contraseñas reales permanecen intactas; las escrituras de prueba quedan aisladas.
- Implementados servicio, DTO, guards y endpoints; migración aplicada solo en esquema de prueba. Integración completa: 120 pruebas, incluido rollback y concurrencia reales.
- Backend final: 443 pruebas; frontend: 294; E2E simulada: 94. Tipos/lint/builds/Prisma válidos. Umbrales de cobertura conservados.
- Revisión final independiente detectó truncamiento Unicode: RED de pegado de 65 caracteres suplementarios, corrección y suites aprobadas. Sin bloqueos adicionales en la revisión.
- E2E reprodujo pérdida del mensaje al cerrar sesión propia: indicador no sensible de un solo uso conserva el aviso; no persiste credenciales.
- Informe de resultados 06 completado. No migrar desarrollo ni cambiar la contraseña de Juan sin autorización adicional.

## Siguiente documento / Siguiente trabajo recomendado

Registrar evidencias y revisar la autorización específica de migración y despliegue antes de habilitar las operaciones reales.

[← Volver al README principal](../../../../README.md)
