# Imágenes y reinicio de la red

## Publicaciones e imágenes

Los aportes profesionales y las noticias administrativas admiten subir una imagen del dispositivo o pegar un enlace de imagen. El enlace al recurso del aporte sigue siendo opcional y puede coexistir con una imagen subida. No se descargan automáticamente páginas o recursos de terceros: para conservar una imagen, debe subirse su archivo.

- JPG, PNG y WebP, hasta 8 MB y 25 megapíxeles. Comprobación de firma y decodificación real; se rechazan SVG y archivos disfrazados.
- Sharp 0.35.5 como dependencia directa, misma versión que ya usaba Next. Rotación, reducción hasta 2048px y conversión a WebP sin metadatos EXIF.
- `POST /api/media`: cuenta aprobada, origen válido, flujo acotado y límite de 20 intentos por cuenta/hora.
- `GET /api/media/[nombre]`: cuenta aprobada, identificador aleatorio validado, respuesta privada sin caché pública.
- `UPLOADS_PATH=/var/lib/red-egresados/uploads` en producción. Archivos fuera de Git y de `.next`; permisos del servicio y persistencia entre despliegues. Desarrollo: `./uploads`, excluido de Git. Los respaldos posteriores deben incluir esta carpeta junto a SQLite.
- Imagen enlazada no disponible: aviso visible y texto de publicación conservado. Las URL aceptadas son http/https o las imágenes internas.
- Nginx ya permite cuerpos de 10 MB, suficiente para 8 MB más multipart. No modificar DNS, TLS ni HAProxy.

## Reinicio solicitado por el operador

El operador solicita vaciar los datos y conservar únicamente su cuenta `dinfo`, sin publicaciones. Se conserva también su perfil asociado, su contraseña, rol y sesiones vigentes. Se eliminan las demás cuentas y perfiles, todos los aportes/noticias/comentarios/reacciones, conexiones, grupos, eventos, notificaciones y listas de correo. Se conserva la estructura y el historial técnico de migraciones.

Respaldo verificado: `/var/backups/red-egresados/pre-conecta-uploads-reset-20261027`. Se toma una segunda copia `pre-cutover.db` inmediatamente antes del reinicio. El borrado se ejecuta transaccionalmente mediante `scripts/reset-network.cjs`, con nombre de cuenta y confirmación explícitos de CLI. Exige administrador aprobado, tablas conocidas e integridad válida; comprueba que la cuenta y su perfil permanezcan exactamente iguales. No exponer este procedimiento como API pública.

Pruebas: vaciado sobre base aislada y copia real; conservación exacta de cuenta/perfil/sesiones/migraciones; subida válida y rechazo de acceso anónimo, cuenta pendiente, origen externo, SVG, archivo disfrazado y exceso de tamaño; imagen adjunta a noticia y lectura privada. Navegador real para publicar aporte y noticia con imagen local.
