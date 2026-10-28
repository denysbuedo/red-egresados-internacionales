# Correo de CONECTA mediante Interoperabilidad

## Alcance

Administración → Notificaciones permite preparar un aviso para una cuenta aprobada, revisarlo y enviarlo una sola vez. Roles editor, institución y miembro no tienen acceso. No se incorporan todavía envíos automáticos de eventos, recuperación de contraseña, campañas, cc/bcc ni adjuntos.

El formulario admite asunto hasta 200 caracteres y texto hasta 20 000. Genera HTML escapado, solo si cabe en 50 000 caracteres; en otro caso envía texto. La identidad del remitente corresponde al servicio externo.

Límites propios: 5 operaciones por minuto por administrador y 100 diarias para toda la plataforma. Los fallos también consumen cuota. El historial muestra las últimas 50 operaciones; la base conserva metadatos y referencias, pero no el cuerpo ni credenciales.

## Conexión segura

- Token: https://identidad.reduniv.edu.cu/realms/interoperabilidad/protocol/openid-connect/token
- Envío: https://api.reduniv.edu.cu/api/v1/notifications/email
- Cliente confirmado en las credenciales y autenticación real: `conecta` (minúsculas).
- Audiencia `mes-api`, rol `notification-sender`; autenticación Client Credentials form-urlencoded. Caché del token en memoria con margen de expiración.
- Configuración privada: `/etc/red-egresados/notifications.env`, root:root 0600, cargada por systemd. NOTIFICATION_EMAIL_ENABLED controla habilitación; NOTIFICATION_CLIENT_ID y NOTIFICATION_CLIENT_SECRET nunca pasan al navegador.
- Archivo local `interoperabilidad/acceso-interoperabilidad.txt` excluido de Git y con ACL restringida.

La salida de la VM a la IP pública 190.6.81.66:443 rechaza la conexión. HAProxy interno 10.46.4.22:443 responde por ambos nombres con TLS válido. La unidad usa un archivo hosts privado mediante `BindReadOnlyPaths=/etc/red-egresados/notification-hosts:/etc/hosts`. Solo cambia la resolución dentro del servicio; no se altera el DNS global ni se conecta al backend 8004. Confirmar esta ruta interna con infraestructura para su mantenimiento.

## Resultados y duplicados

`accepted` significa HTTP202 y accepted_by_relay: no confirma recepción en el buzón. `failed` identifica rechazo o falta de autenticación/configuración. `unknown` señala timeout, error interno o respuesta no reconocida; se consulta por la referencia antes de preparar otro aviso.

Cada operación reserva un UUID en SQLite antes de consultar al proveedor. Repetir el UUID con el mismo contenido consulta el registro; cambiar el contenido con ese UUID devuelve 409. El identificador local no es una Idempotency-Key del proveedor. No se reintenta ni siquiera tras 401; la siguiente operación nueva podrá solicitar otro token. Un proceso interrumpido deja una operación incierta y nunca se reenvía en segundo plano.

## Prueba autorizada

El operador autoriza un correo a **dinfo@mes.gob.cu**. Único envío controlado desde desarrollo: asunto «CONECTA · Prueba del servicio de notificaciones», HTTP202 accepted_by_relay, correlación `eca895ae-40cd-4ca8-9823-bfc588ad6004`. No reenviar este ensayo. Pendiente confirmar llegada al buzón.

Posteriormente se valida OAuth HTTP200 en la VM con el entorno y resolución de servicio, comprobando audiencia y rol sin enviar otro correo.

## Validación

21 pruebas HTTP con proveedor simulado y 14 unitarias; los tests no contactan al relay real. Cubren CSRF/roles, reserva concurrente, deduplicación, límites, errores OAuth, rechazo, timeout, resultado incierto y secreto ausente en respuestas. Chrome verifica vista previa escapada, historial, bloqueo, cinco tamaños de pantalla y ausencia de errores JS.

Migración aditiva 0018_add_email_dispatches.sql. Conservar todas las cuentas, contenido e imágenes actuales. El script histórico de reinicio solo se adapta al nuevo esquema para mantener sus pruebas: **no se ejecuta en producción**. Respaldo: `/var/backups/red-egresados/pre-conecta-email-20261027`.


- Publicado como `ea51024`. Linux: build/typecheck/lint sin errores, 21 pruebas HTTP y 14 unitarias correctas. Chrome: creación/vista previa/aceptación y fallo simulado, historial, bloqueo, 320–1440px sin overflow ni errores JS.
- Correo manual habilitado después de la prueba autorizada y OAuth200 con Node de producción. Verificados por HTTPS /admin/notificaciones y /api/admin/notifications: enabled=true, destinatarios aprobados, sin secreto/token expuestos. Historial inicial vacío porque el único correo controlado salió desde desarrollo, no desde esta API.
- Todos los valores anteriores conservados en las 19 tablas existentes; solo se añade email_dispatches y una entrada al registro de migraciones (19 migraciones en total). Cuentas, perfiles, aporte, conexiones, comunidad, imágenes y credenciales anteriores intactos. No se ejecutó el reinicio de datos.
- Manifiesto de 183 archivos coincide con la compilación Linux y la VM. Servicio activo y NRestarts=0. Secreto de Interoperabilidad escaneado contra fuentes rastreadas sin coincidencias. Namespace del servicio utiliza HAProxy interno; no se modifica la resolución global.


## Avisos automáticos del ciclo de acceso

Se incorporan tres avisos, únicamente para operaciones nuevas:

1. **Solicitud recibida:** al crear la cuenta pendiente, con enlace a consultar su estado.
2. **Cuenta aprobada:** al guardar una aprobación válida, con enlace de entrada e invitación a completar el perfil.
3. **Solicitud rechazada:** al guardar un rechazo válido, con el motivo y enlace de Ayuda.

Los textos usan la identidad CONECTA/MES; el proveedor se denomina simplemente **servicio de notificaciones**. El operador confirmó la recepción del correo controlado con referencia eca895ae-40cd-4ca8-9823-bfc588ad6004. No se repite ese ensayo ni se avisa retroactivamente a las cuentas existentes.

La cuenta o decisión y la reserva del aviso se guardan en la misma transacción SQLite. Solo después de confirmar la transacción se intenta el envío. Se reclama la reserva una sola vez con un cambio condicional de estado. La creación repetida de cuenta devuelve conflicto; la decisión repetida/concurrente se rechaza sin generar otro aviso. Una revisión futura legítima de la misma cuenta puede producir su propio aviso.

Si falla el proveedor, el registro/aprobación/rechazo se conserva. El historial distingue solicitud recibida, cuenta aprobada, solicitud rechazada y aviso manual. El panel de aprobaciones informa el resultado del correo sin confundirlo con el resultado de la decisión, tanto para administración como responsables institucionales.

Los límites globales siguen siendo 100 intentos diarios de plataforma. Los automáticos tienen además máximo de 5 intentos por destinatario cada 24 horas; el límite por minuto de administración se aplica a los avisos manuales. Un aviso bloqueado por configuración o cuota se registra como **No enviado**, sin contactar al proveedor y sin impedir la operación de cuenta.

No hay cola de reintentos. Si el proceso se interrumpe antes de reclamar la reserva, el historial mostrará No enviado tras dos minutos; si se interrumpe durante el envío, mostrará Resultado incierto. No se almacena el cuerpo, no se recuperan automáticamente mensajes interrumpidos y no se permite reenvío directo desde el historial.

Migración aditiva 0019_email_dispatch_kind.sql: añade kind con valor manual para operaciones previas. Se conservan todos los datos y metadatos existentes. Validación Windows: build/typecheck/lint sin errores, 25 pruebas HTTP y 15 unitarias correctas, con proveedor simulado. Chrome recorre formularios reales de registro/aprobación/rechazo, caída simulada y consulta del historial, sin emitir correos reales.


- Publicado como `209589e`. Linux: compilación/typecheck/lint sin errores, 25 pruebas HTTP y 15 unitarias correctas; proveedor de prueba simulado sin nuevos correos reales.
- HTTPS/producción: panel de aprobaciones, notificaciones habilitadas, historial con tipo y APIs protegidas verificados sin registrar cuentas ni resolver solicitudes reales. Ningún correo generado por el despliegue ni aviso retroactivo.
- Conservados todos los valores anteriores de las 20 tablas, incluido el historial de correo; solo columna kind y una entrada técnica de migración adicionales (20 migraciones en total). Estado observado: 5 cuentas/perfiles, 1 aporte, 8 conexiones y 2 comunidades. Imágenes, secretos y resolución privada de HAProxy preservados.
- Manifiesto de 187 archivos verificado contra la compilación Linux y la VM. Servicio activo y NRestarts=0. Snapshot pre-cutover y compilación anterior disponibles en /var/backups/red-egresados/pre-conecta-access-email-20261027.
