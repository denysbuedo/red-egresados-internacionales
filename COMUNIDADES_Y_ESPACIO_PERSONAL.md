# Comunidades, espacio personal y registro

## Comunidades

La lista y el detalle consultan la pertenencia real de la sesión. El botón Unirse se sustituye por «Ya eres miembro» cuando corresponde, incluso después de recargar. Unión/salida usa una transacción SQLite inmediata y los reintentos no duplican miembros. Los filtros utilizan texto y la paleta institucional, sin emojis.

Administración → Comunidades permite editar nombre, descripción, tipo y categoría de cualquier comunidad. El servidor permite al administrador global o al creador editar esos campos. No cambia la propiedad ni se añade al administrador al grupo. No se incorpora borrado de comunidades.

## Presentación

El inicio coloca la foto, el cargo, la institución y el acceso al perfil junto al saludo. Retira la columna izquierda; amplía el contenido y conserva personas, agenda y actualidad en la columna derecha. Se mantienen las cuatro tarjetas decorativas aprobadas.

El directorio muestra tarjetas más compactas, hasta cuatro por fila, sin franja superior ni sombras. Se retira el selector construido con textos libres de formación. La búsqueda por texto incluye formación y habilidades, sin perder datos históricos. Noticias usa el mismo ancho máximo de 1280 px que las otras secciones.

El perfil presenta las áreas de conocimiento como etiquetas, separando comas, punto y coma o saltos de línea. El editor ofrece un campo de varias líneas con indicaciones para separar áreas, habilidades e intereses.

## Acceso

Solo se piden Datos de Acceso e Información Personal, con declaración de trabajo en MES o sus instituciones. Se crea una cuenta pendiente y un perfil básico; no se concede ningún privilegio solicitado por el cliente. Sin institución declarada, la revisión corresponde a la administración global; los responsables institucionales mantienen su alcance.

Tras aprobar la solicitud se completan cargo, formación, presentación, enlaces e institución desde el perfil. Completar por primera vez una afiliación vacía de una cuenta básica ya aprobada conserva el acceso. Cambiar posteriormente una afiliación existente sigue requiriendo validación, como antes. Estudiantes continúan excluidos de esta etapa.

## Verificación y conservación

20 pruebas HTTP de autenticación, permisos, perfiles y negocio, incluyendo pertenencia persistente, reintentos, edición administrativa de comunidades ajenas y registro/aprobación/completado. Sin migraciones ni reinicio de datos.

Respaldo: `/var/backups/red-egresados/pre-conecta-refinements-20261027`.


- Desplegado como `9b088df`. Linux: compilación/typecheck/lint y 20 pruebas HTTP correctas. Navegador: ocho rutas y cinco tamaños, gestión admin de comunidad ajena, pertenencia persistente y controles de presentación correctos.
- Producción/HTTPS: perfil/editor, registro reducido, cabecera personal, gestión de comunidades, ancho de Noticias y membresía real verificados sin modificar datos de negocio. La comunidad existente conserva sus miembros; no se crearon usuarios ni solicitudes de prueba.
- Las 19 tablas conservan todas sus filas y valores durante el corte; estado observado: 4 cuentas, 4 perfiles, 1 aporte, 6 conexiones y 1 comunidad. Imágenes y credenciales preservadas. Servicio activo con NRestarts=0. Manifiesto de 174 archivos coincide con la compilación Linux y la VM; respaldo pre-cutover y compilación anterior disponibles.
