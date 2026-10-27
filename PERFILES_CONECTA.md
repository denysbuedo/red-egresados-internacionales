# Perfiles profesionales de CONECTA

Vista `/miembros/[id]`, compatible con `/egresados/[id]`, renovada con los colores, tipografía y tarjetas institucionales de CONECTA. Cabecera profesional, avatar con iniciales como alternativa, navegación por secciones, trayectoria, habilidades, intereses, idiomas, contacto y aportes. Los apartados vacíos orientan al propietario a completarlos; no se inventan datos, insignias de verificación ni métricas de popularidad.

## Edición

`/miembros/[id]/editar` solo permite abrir el perfil propio con una cuenta aprobada. Acceso desde el botón «Editar perfil» y enlaces de cada sección. Permite editar nombre, presentación, cargo, unidad de trabajo, ubicación, formación opcional, año, habilidades, idiomas, intereses, correo de contacto, teléfono, web, LinkedIn y foto. Se reutiliza la carga de imágenes de CONECTA; también permite quitar la foto o usar una URL.

Se guarda mediante la API existente `PUT /api/members/[id]`. Se conserva la autorización del servidor, se aceptan fotos internas, se rechazan valores inválidos y se informa del conflicto de correo. Cambiar el correo del perfil no cambia las credenciales de acceso; se explica junto al campo. El formulario omite institución, tipo de vínculo y privilegios: los cambios de vínculo continúan por `/completar-perfil` con su validación institucional.

Los perfiles completos mantienen acceso para propietario, conexiones aceptadas y administración. Otros miembros aprobados ven una cabecera pública básica y una invitación a conectar, sin contactos ni editor ajeno. Se corrige la vista administrativa para que corresponda con los permisos que ya tenía la API.

## Validación y despliegue

Chrome con base efímera: editar, guardar, recargar, cancelar cambios, subir/quitar foto y estados vacíos/con datos. Sin desbordamiento entre 320 y 1440px. Prueba HTTP adicional: persistencia del perfil, carga de foto interna, privacidad, editor ajeno 404, conservación exacta de cuenta/permisos/vínculo, email inválido/duplicado y rechazo de cambios institucionales por este formulario.

Respaldo previo: `/var/backups/red-egresados/pre-conecta-profile-20261027`, fuentes, SQLite y carpeta de imágenes verificados. Este cambio no migra ni reinicia la base: conserva la cuenta, perfil, aportes e imágenes existentes.
