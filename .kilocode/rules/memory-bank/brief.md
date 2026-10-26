# Proyecto: Red MES

## Propósito

Red profesional y académica del Ministerio de Educación Superior y sus instituciones.
Conecta trabajadores para compartir conocimientos, resultados científicos,
proyectos, convocatorias y oportunidades de colaboración.

## Primera etapa

- Público: docentes, investigadores, especialistas, técnicos, administrativos,
  directivos y otros trabajadores del MES y sus instituciones.
- Admisión mediante declaración de vínculo laboral y aprobación institucional.
- Estudiantes fuera del registro inicial; ampliación futura prevista, no habilitada.
- Referencia: conexiones profesionales y colaboración científica, con comunicación
  institucional. No se busca replicar una red de entretenimiento.

## Funciones

Perfiles profesionales, directorio, contactos, comunidades, aportes clasificados,
noticias, eventos, notificaciones, listas de correo restringidas y administración.
Los aportes pueden enlazar resultados o proyectos; aún no hay repositorio científico
ni expedientes de proyectos independientes.

## Restricciones

Conservar datos y relaciones existentes, sesiones seguras, autorización en servidor,
aprobación por institución y despliegue sincronizado. Las credenciales y las bases
no se versionan. Cualquier revalidación masiva de cuentas históricas se decide
explícitamente; no se deduce de un cambio de nombre de la plataforma.

## Tecnología

Next.js 16, React 19, TypeScript, Tailwind 4, Drizzle y SQLite. Instalación con npm ci.
Producción mediante systemd bajo usuario sin root, Nginx y frontal HTTPS externo.
