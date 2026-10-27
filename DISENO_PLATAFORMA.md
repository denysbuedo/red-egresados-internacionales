# Sistema visual de CONECTA

Se extiende la identidad institucional a todas las familias de páginas, conservando la portada y el espacio personal ya aprobados. Azul profundo, acento menta, fondos claros, Inter e IBM Plex Mono. No se modifican permisos ni operaciones de negocio.

## Elementos compartidos

- `PageHeader`: título, contexto, descripción y acciones con contraste claro. Geometría de la marca sin imágenes externas.
- `AdminNav`: navegación por rol, sección activa y distribución adaptable. Administración de cuentas y aprobaciones solo para administradores; editores conservan sus funciones de contenido.
- `PageFooter`: ayuda, privacidad, términos y estatutos. La portada conserva su pie propio.
- Clases `ui-*`: tarjetas, filtros, formularios, tablas, pestañas, estados vacíos y avisos. Los estados de espera y las acciones destructivas siguen siendo distinguibles.
- Directorio: tarjetas profesionales, filtros y enlace al perfil propio en lugar de conectar consigo mismo. La protección de conexiones permanece en el servidor.
- Tablas con desplazamiento local y filtros adaptables; navegación y controles con foco visible.

## Cobertura

| Familia | Páginas |
| --- | --- |
| Comunidad | Directorio, conexiones, comunidades y detalle, noticias |
| Agenda | Listado de eventos, detalle, participación y gestión de asistentes |
| Identidad personal | Perfil y edición, registro del perfil y vínculo laboral |
| Acceso | Login, solicitud de acceso y espera de aprobación |
| Gestión | Resumen, usuarios, aprobaciones, noticias y creación, eventos y creación, listas de correo |
| Instituciones | Panel institucional y alias histórico universidad |
| Información | Ayuda, privacidad, términos y estatutos |
| Estados | Página no encontrada, error recuperable, detalles no disponibles y listas vacías |

Las rutas históricas de perfiles, registro e institución heredan sus vistas canónicas. Se conserva la funcionalidad de carga de imágenes, los formularios y la validación laboral existentes.

## Comprobaciones

Chrome real sobre una base efímera con miembros, solicitudes, conexiones, comunidad, noticias y evento: 44 vistas y variantes revisadas entre 320 y 1440px, sin desbordamiento horizontal ni errores JavaScript. Incluye sesiones de administrador, editor, institución, cuenta pendiente, cuenta sin perfil y miembro regular. Apertura de creación de comunidad/lista de correo, búsqueda sin resultados, detalles no disponibles y estados vacíos comprobados. Capturas de escritorio y móvil revisadas.

Respaldo previo verificado de fuentes, SQLite e imágenes en `/var/backups/red-egresados/pre-conecta-platform-20261027`. Cambio visual sin migraciones ni reinicio de datos; todos los datos actuales y nuevos registros deben conservarse en el corte.
