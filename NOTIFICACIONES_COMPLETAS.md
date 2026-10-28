# Notificaciones y seguridad de CONECTA

## Funciones disponibles

- Recuperar contraseña desde /recuperar-acceso y enlace temporal a /restablecer-acceso. Cambio de contraseña autenticado en /preferencias.
- Preferencias por categoría: conexiones, comunidades, eventos y actividad. Cada persona elige No recibir, Inmediato o Resumen diario. Las categorías opcionales empiezan desactivadas para cuentas existentes y nuevas; los correos de acceso y seguridad se mantienen independientes.
- Conexiones: solicitud nueva y aceptación, con avisos únicos por transición y descarte de invitaciones ya canceladas/resueltas.
- Comunidades: responsables/administración invitan a personas aprobadas; el destinatario acepta o rechaza en la lista de comunidades. Avisos importantes por responsables, visibles en el detalle y enviados a miembros según preferencias. Sin añadir miembros automáticamente al invitar.
- Eventos: confirmación de inscripción, cambios y cancelación por administración o editor propietario, recordatorios de próximas 24 horas y últimos 15 minutos. Edición/cancelación desde el detalle, sin borrar evento ni asistentes. Repetir una confirmación o cancelación no duplica avisos.
- Actividad: respuesta a tu aporte y menciones @usuario en aportes/comentarios; menciones de grupos solo a miembros. No hay correo por cada reacción o publicación. Una respuesta que menciona al autor genera un solo aviso.
- Los enlaces de conversación abren el aporte concreto y sus comentarios mediante /?post=ID. Preferencias accesibles desde menú personal, inicio y editor de perfil.

## Recuperación segura

Tokens aleatorios de 256 bits, hashes SHA-256 en SQLite, uso único, caducidad 30 minutos. El enlace usa fragmento #token, no query: no se envía al servidor al abrir la página. El cliente retira el fragmento de la barra y la página declara no-referrer y noindex. Solo el POST explícito cambia la contraseña; abrir el enlace no lo consume.

La respuesta pública es la misma para cuenta existente/inexistente y el envío se prepara con after de Next.js una vez respondido el HTTP. Se limita a 10 solicitudes/hora por IP, hasta tres enlaces activos recientes por cuenta y 20 intentos de restablecimiento/15 minutos/IP. Rechazados no reciben enlaces; pendientes pueden recuperarse sin ser aprobados. Nueva contraseña de 12 caracteres y máximo 72 bytes; se guarda con bcrypt.

Cambiar/restablecer contraseña invalida todas las sesiones y enlaces pendientes de esa cuenta, sin iniciar sesión automáticamente ni alterar rol/estado. Envía aviso de seguridad obligatorio. No se registran tokens o contraseñas en logs ni en la cola de actividad.

## Cola y proceso programado

Migración aditiva 0020 crea notification_preferences, notification_queue, notification_worker_state, password_reset_tokens, community_invitations y community_announcements; añade cancelled_at/revision a events. No elimina datos previos.

Un evento único se inserta al guardar la acción de negocio. El proceso reclama la cola y reserva email_dispatches antes de contactar al servicio de notificaciones. No reintenta envíos reclamados, incluidos timeout/500; quedan inciertos o fallidos para revisión. Tras procesar, elimina el texto de la cola; los pendientes caducan a los siete días y metadatos de cola terminados se purgan a los treinta días. El historial de email_dispatches conserva la referencia y metadatos sin cuerpo.

Se releen preferencias, aprobación, pertenencia/inscripción y vigencia antes del envío. Desactivar una categoría descarta pendientes; volver a activarla no recupera actividad anterior. Un resumen diario combina categorías a partir de las 09:00, hora America/Havana, como máximo uno por persona y día. No se envía un resumen vacío ni recordatorios de eventos ya comenzados/cancelados.

Ejecutor: scripts/process-notification-mail.cjs, con mismo OAuth/HTTPS de la aplicación. Un lease en SQLite evita dos procesos simultáneos. Cada ejecución procesa hasta cinco envíos; un digest puede agrupar varios avisos. Mantiene el límite global de 100 intentos diarios. Una cola grande puede requerir varios ciclos y los avisos bloqueados por cuota no se reenvían automáticamente.

Unidades versionadas en deploy/systemd: conecta-notification-mail.service (oneshot como red-egresados, timeout 240s) y conecta-notification-mail.timer (cada minuto, persistente). EnvironmentFile privados existentes y resolución de nombres aislada hacia HAProxy interno, sin secretos en Git. El panel Administración → Notificaciones muestra cola pendiente y última ejecución.

Invitaciones de comunidad limitadas a 20 por responsable/día, reenvío tras rechazo a partir de 24h; hasta cinco avisos importantes por responsable/día. Las operaciones registradas históricamente no producen correos retroactivos. Los avisos automáticos del ciclo de acceso y el correo manual anteriores se conservan.

## Verificación

Windows: compilación/typecheck, 31 pruebas HTTP con proveedor simulado y 25 unitarias. Incluyen permisos/CSRF, preferencias propias, trabajador programado, rechazos/timeouts sin reintento, digest/zonas horarias, invitación/aceptación/avisos, RSVP/cambios/cancelación, respuesta+mención deduplicada, token hasheado/expirado/reutilizado, consumo concurrente, cierre de sesiones y conservación de estado.

Chrome real: preferencias, invitación, aviso importante, inscripción/edición/cancelación, recuperación/cambio de contraseña y nuevo login. Siete rutas a cinco anchos de 320 a 1440 px, sin overflow ni errores JS. Todos los envíos de prueba simulan el servicio: no se mandan mensajes a usuarios reales ni se cambian sus contraseñas.

Respaldo previo: /var/backups/red-egresados/pre-conecta-notification-suite-20261027. Se conservan datos, imágenes, credenciales y correos anteriores. El script de reinicio se adapta solo para sus fixtures; no se ejecuta en producción.

Referencias técnicas: [Next after](https://nextjs.org/docs/app/api-reference/functions/after), [autoalojamiento](https://nextjs.org/docs/app/guides/self-hosting) y [recuperación de acceso OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).


### Verificación final — 2026-10-28

- Publicado como `8aa5798`. Linux: build/typecheck/lint sin errores, 31 pruebas HTTP y 25 unitarias correctas; 35 vistas de navegador verificadas con proveedor simulado, sin correos reales durante las pruebas.
- Producción/HTTPS: recuperación pública, preferencias privadas, invitaciones, panel de correo y APIs protegidas comprobados. Timer conecta-notification-mail activo y habilitado; primer proceso Result=success/ExecMainStatus=0 como red-egresados, con heartbeat visible. Cero preferencias activadas y cero avisos opcionales en cola al desplegar.
- Todas las filas y columnas previas conservadas en las 20 tablas originales; seis tablas nuevas y metadatos de evento adicionales, 26 tablas de aplicación y 21 migraciones en total. Estado observado: 5 cuentas/perfiles, 1 aporte, 8 conexiones y 2 comunidades. Sin altas de prueba, cambios de contraseña/decisiones reales ni correos retroactivos.
- Manifiesto de 213 archivos coincide con compilación Linux y VM. Servicio principal activo y NRestarts=0. Imágenes, historial de correo, secretos y resolución privada de HAProxy intactos. Snapshot pre-cutover y compilación anterior conservados en /var/backups/red-egresados/pre-conecta-notification-suite-20261027.
