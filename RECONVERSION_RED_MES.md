# Red MES: red profesional y académica

La plataforma pasa de una red para egresados internacionales a una red del
Ministerio de Educación Superior. Su primera etapa está dirigida a trabajadores
del MES y de sus instituciones: docentes, investigadores, especialistas, técnicos,
personal administrativo, directivos y otros trabajadores.

La referencia funcional es una combinación de conexión profesional, colaboración
académica y comunicación institucional. El objetivo no es construir una red de
entretenimiento ni un sistema de popularidad.

## Implementado en esta primera etapa

- Identidad Red MES, portada, navegación, textos de registro, directorio y perfiles institucionales.
- Declaración obligatoria del vínculo laboral en el registro. La institución o la administración verifica y aprueba cada solicitud. No basta con marcar una casilla para obtener acceso.
- Tipos profesionales diferenciados del rol de autorización: declarar ser directivo o investigador no otorga privilegios administrativos.
- Estudiantes no habilitados para registro. El catálogo conserva categorías futuras, pero el backend también bloquea el alta como estudiante.
- Institución y cargo/actividad laboral obligatorios. Área de conocimiento y año de graduación opcionales: ser egresado ya no es un requisito de participación.
- Vínculo laboral actualizable en /completar-perfil. Para miembros ordinarios, el cambio de institución o perfil profesional requiere nueva aprobación; el usuario nunca puede cambiar sus permisos ni su institución de gestión por esta vía.
- Aportes clasificados: actualización profesional, publicación científica, proyecto, convocatoria o consulta profesional. Incluyen enlace opcional al recurso original y filtros por tipo.
- Conversaciones alrededor de los aportes y contactos profesionales. Se retiraron del componente de aportes los botones/contadores de likes y la barra que sugería completar una cuota diaria de publicaciones. Se conserva el límite como medida antispam.

## Datos y compatibilidad

La migración 0017 es aditiva: member_type y employment_confirmed en graduates;
post_type y reference_url en user_posts. No elimina perfiles, publicaciones,
conexiones, cuentas, contraseñas ni sesiones. Los perfiles históricos quedan
como vínculo por actualizar, sin atribuirles un empleo que no se haya declarado.
Los aportes antiguos se conservan como actualizaciones profesionales, sin
reclasificarlos automáticamente como artículos científicos o proyectos.

La decisión sobre revalidar los estados de aprobación de los perfiles históricos
se mantiene separada de la migración: requiere la elección del operador. La
migración por sí sola no cambia esos estados ni los roles de operación.

Las rutas públicas nuevas son /miembros/[id], /miembros/registro, /institucion
y /api/members. Las rutas anteriores /egresados, /universidad y /api/graduates
siguen funcionando como compatibilidad, conservando IDs y controles de acceso.
Los nombres internos graduateId/university/pendingUniversity se mantienen para
no romper las relaciones existentes; su significado funcional es miembro,
institución de vinculación e institución que revisa la solicitud.

El campo SQL heredado graduation_year sigue siendo NOT NULL. Para perfiles
nuevos sin ese dato se usa 0 exclusivamente como marca interna de dato ausente;
la API devuelve null y la interfaz no muestra ese valor como año. No se inventa
una fecha de graduación. career puede quedar vacío cuando no se proporciona
formación académica.

## Límites de esta entrega

Una contribución marcada como publicación científica es un aporte de su autor
con un enlace de referencia. No constituye un registro bibliográfico verificado
ni acredita revisión por pares. Una contribución marcada como proyecto tampoco
crea todavía un expediente con equipo, etapas o presupuesto.

Una etapa posterior puede incorporar fichas de proyectos y resultados,
bibliografía estructurada, ORCID, DOI con metadatos, repositorios documentales,
búsquedas por líneas de investigación y seguimiento profesional. No se
implementan métricas de citas, impacto o reputación inventadas. La apertura a
estudiantes requerirá habilitar su categoría y definir su proceso de admisión.

## Validación y operación

npm run typecheck, npm run lint, npm test y npm run test:http validan el código.
Las pruebas HTTP usan cuentas y bases efímeras, no la base de producción.
La nueva cobertura prueba rechazo de estudiantes, declaración laboral,
registro sin graduación, revalidación de vínculo, compatibilidad de rutas y
tipos/enlaces de aportes profesionales.

Antes de actualizar la VM se verifica respaldo de fuentes, configuración y copia
consistente de la base. Las migraciones se prueban sobre una copia. La base real
se migra en su ubicación actual, sin restaurarla desde el snapshot de pruebas.
Los procedimientos de acceso y seguridad siguen en SEGURIDAD_DESPLIEGUE.md.


Validación previa al despliegue: siete pruebas unitarias y trece pruebas HTTP
correctas, compilación y typecheck correctos en Windows/Linux, y lint sin errores
(44 advertencias heredadas). Sobre la copia real se verificó la conservación de
todos los valores originales de las 19 tablas, con integridad y claves foráneas
correctas. El cambio de aprobación de cuentas históricas no forma parte de estas
pruebas ni se aplica por defecto.
