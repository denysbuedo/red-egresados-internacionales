# Navegación y conexiones de CONECTA

## Cambio visible

La cabecera autenticada muestra **Comunidades → Eventos → Directorio → Conexiones**, seguidas de Noticias y, para el rol correspondiente, Mi institución. El logo lleva al inicio. Se retiran los enlaces Ciencia y Proyectos que repetían el mismo destino. El menú móvil conserva ese orden.

Comunidades, Eventos, Directorio y Conexiones usan el mismo ancho máximo de 1280 px y los mismos márgenes adaptables. El espacio reservado para la barra de desplazamiento evita cambios horizontales entre páginas largas y cortas. En pantallas pequeñas el contenido se ajusta al ancho disponible.

## Solicitudes

- Directorio y perfil comparten `ConnectionAction`: enviar, aceptar, rechazar, cancelar y consultar estado. Errores visibles, botones bloqueados durante el envío y recuperación sin alertas emergentes.
- Una consulta anterior no sobrescribe el resultado de una acción posterior. El estado se toma de la API, incluso cuando la solicitud ya existe o llegó en sentido contrario.
- `connection-service.ts` ejecuta cada cambio en una transacción SQLite inmediata. Repetir el envío o la aceptación conserva la relación y no duplica notificaciones. Las solicitudes rechazadas se reutilizan respetando la restricción única existente por sentido.
- Las lecturas seleccionan una relación por pareja, priorizando aceptadas y después pendientes. No se borran registros históricos durante el despliegue.
- Conexiones mantiene recibidas, enviadas y contactos en memoria, con contadores y actualización discreta. El header actualiza los indicadores sin refrescar la página completa periódicamente.

## Validación

Windows: compilación, 18 pruebas HTTP y lint sin errores. La prueba de regresión cubre solicitudes concurrentes/cruzadas, reenvío tras rechazo, doble aceptación, permisos, conteos y relaciones antiguas en ambos sentidos.

Chrome real con dos cuentas aisladas: envío y aceptación desde el directorio; respuesta GET atrasada; error temporal al aceptar y reintento desde Conexiones; contacto final visible. Cuatro páginas con anchos iguales en cinco tamaños de 320 a 1440 px, sin desbordamiento ni errores JavaScript.

Sin migraciones, cambio de credenciales ni reinicio de datos. Respaldo de fuente, base e imágenes: `/var/backups/red-egresados/pre-conecta-navigation-connections-20261027`.
