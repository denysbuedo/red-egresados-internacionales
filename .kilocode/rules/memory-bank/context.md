# Active Context: Egresados Cuba - Red Internacional

## Current State

**Status**: Red MES profesional y académica activa en https://conecta.reduniv.edu.cu; registro inicial para trabajadores y estudiantes deshabilitados. Cuentas históricas conservan su aprobación mientras el operador decide su revalidación.

Red social para egresados internacionales de la educación superior cubana. Permite gestionar perfiles, conectar egresados por criterios de afinidad, y crear listas de distribución de correo.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] Database setup with Drizzle ORM + SQLite
- [x] Schema: graduates, connections, posts, email_lists
- [x] API routes for CRUD operations
- [x] Navbar component with responsive mobile menu
- [x] GraduateCard component for listing
- [x] Home page with stats, recent graduates, activity feed
- [x] Registration form with all fields
- [x] Graduate profile page with full details
- [x] Directory page with search and multi-criteria filtering
- [x] Connections page with send/accept/reject workflow
- [x] Email distribution lists with preview and copy
- [x] 404 and error pages

## Current Structure

| File/Directory | Purpose |
|----------------|---------|
| `src/db/schema.ts` | Database schema (graduates, connections, posts, email_lists) |
| `src/db/index.ts` | Database client |
| `src/db/migrate.ts` | Migration script |
| `src/app/page.tsx` | Home page with stats and feed |
| `src/app/layout.tsx` | Root layout with Navbar |
| `src/app/egresados/registro/page.tsx` | Registration form |
| `src/app/egresados/[id]/page.tsx` | Graduate profile |
| `src/app/directorio/page.tsx` | Directory with filters |
| `src/app/conexiones/page.tsx` | Connections management |
| `src/app/listas-correo/page.tsx` | Email distribution lists |
| `src/app/api/graduates/route.ts` | Graduates API |
| `src/app/api/graduates/[id]/route.ts` | Single graduate API |
| `src/app/api/connections/route.ts` | Connections API |
| `src/app/api/posts/route.ts` | Posts API |
| `src/app/api/email-lists/route.ts` | Email lists API |
| `src/app/api/stats/route.ts` | Statistics API |
| `src/components/Navbar.tsx` | Navigation bar |
| `src/components/GraduateCard.tsx` | Graduate card component |

## Database Schema

### graduates
- id, name, email (unique), country, city, university, career, graduationYear
- currentProfession, currentCompany, bio, photoUrl, phone, linkedin
- skills, languages, interests, website, createdAt, updatedAt

### connections
- id, senderId (FK graduates), receiverId (FK graduates)
- status (pending/accepted/rejected), createdAt

### posts
- id, graduateId (FK graduates), content, createdAt

### email_lists
- id, name, description
- filterUniversity, filterCareer, filterCountry, filterYearFrom, filterYearTo
- createdAt

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| Current | Full Egresados Cuba social network implemented |
| Current | Primary color changed from red to blue across all components |
| Current | Navbar logo gradient changed from red-500 to blue-800 |

## Revisión de despliegue — 2026-10-25

- Auditoría de solo lectura de VM vmredegresados (10.46.4.75), proyecto en /var/www/red-egresados-internacionales, accediendo por bastión SSH y validando host conocido.
- HEAD local 5717917; HEAD remoto 1294541, dos commits por detrás. VM con 10 archivos versionados modificados y 4 sin seguimiento. Falta AppShell.tsx; múltiples fuentes difieren.
- Nginx activo en 80, sin listener 3000 ni proceso Next.js observado. Consulta directa sin proxy con Host correcto devuelve 502. BUILD_ID fechado 2026-04-11.
- Hallazgos: cookie de sesión Base64 sin firma en local y VM; API de listas de correo sin autenticación; SQLite usa dev.db fijo, pese a DATABASE_URL documentada.
- Sin cambios remotos ni reinicios. Informe: REVISION_DESPLIEGUE_2026-10-25.md. Comparación contra checkout local, sin actualizar GitHub ni ejecutar build/tests.

## Sincronización realizada — 2026-10-25

- GitHub/main confirmado en 5717917 mediante fetch. Revisados los cambios de la VM frente al ancestro 1294541; no se encontraron funciones exclusivas más avanzadas en la VM.
- Respaldo completo verificado en /var/backups/red-egresados/pre-sync-20261025 (tar, configuración, patch Git y copias SQLite con integridad OK).
- Datos válidos en dev.db: 8 usuarios, 7 perfiles, 8 noticias, 2 eventos. prod.db vacía. No sustituir por la base del repositorio.
- Integrados valores por defecto del perfil y validación de roles; conservadas correcciones más completas del repositorio para reacciones y eventos. Lock npm y configuración PM2/optimización proceden de la VM, revisados.
- Reparado migrador transaccional/idempotente con checksums y añadidas migraciones institution_name/pending_university. Pruebas sobre copia real: todos los valores originales de 16 tablas conservados.
- dev.db deja de versionarse; notas de acceso y bases excluidas de Git. DATABASE_PATH permite probar copias sin tocar datos reales.
- Estado operativo y publicación pendientes de endurecimiento de sesiones/API y revisión funcional. Dominio previsto: conecta.reduniv.edu.cu.
- Ver SINCRONIZACION_DESPLIEGUE.md para decisiones de reconciliación y procedimiento.

- Reconciliación funcional publicada en GitHub como 2ca5531 y aplicada a la VM por fast-forward mediante bundle SSH. Cambios previos preservados en stash pre-sync-20261025, además del respaldo.
- npm ci y build correctos también en el directorio real de despliegue. Migración aplicada a dev.db real, con todos los valores anteriores de las 16 tablas conservados e integridad OK.
- Typecheck y cuatro pruebas pasan en Windows/Linux. Lint local: 0 errores y 27 advertencias existentes. Pruebas HTTP temporales correctas; servicio permanente sigue detenido y la ruta /pendiente sigue pendiente.

## Sesiones y permisos — 2026-10-25

- Implementadas sesiones opacas con hashes, expiración y revocación (migración 0016). Cookie __Host-session en producción. Cookies antiguas invalidadas.
- API de negocio requiere cuenta aprobada; mutations verifican Origin. Propiedad de perfiles/conexiones y alcance institucional verificados. Listas de correo solo admin; editores gestionan contenido.
- Creado register-complete transaccional, /pendiente sin bucle de redirección y /universidad. Registro público nunca asigna roles solicitados por el cliente.
- Next 16.4.3 y React 19.3.1 fijados; npm audit --omit=dev sin hallazgos. Cuatro avisos moderados de herramientas de desarrollo pendientes; no aplicar audit --force. Se retira bun.lock para mantener npm ci como único lock de despliegue.
- Servicio systemd activo y habilitado con usuario red-egresados y datos en /var/lib/red-egresados/dev.db; runtime Node 22.23.4 verificado por SHA-256 oficial. Validación Linux, build y pruebas HTTP completados.
- Respaldo previo verificado en /var/backups/red-egresados/pre-security-20261025. Se detectó y rotó la contraseña histórica de un administrador antes del arranque; nueva credencial únicamente en credenciales-rotadas.json dentro del respaldo, accesible solo por root.
- Ver SEGURIDAD_DESPLIEGUE.md para diseño, pruebas y operación. DNS/TLS/HAProxy del dominio nuevo permanecen pendientes.

- Verificación real por Nginx: inicio/login/registro 200, API privadas anónimas 401, contraseña antigua rechazada, nueva válida, cookie segura y logout revocado. systemd running/enabled, NRestarts=0, escucha exclusiva 127.0.0.1:3000.
- Integridad y claves foráneas OK. Conservados 8 usuarios, 7 perfiles y datos de negocio; único cambio deliberado en cuentas: hash/fecha de la contraseña expuesta. Los datos usados por pruebas permanecieron separados.
- Se conserva el código root-owned; el usuario de servicio no puede modificarlo ni leer credenciales de respaldo. Secretos y bases fuera de Git. Implementación publicada como 5c37255; documentación final se sincroniza por separado.

## Recuperación de acceso administrador — 2026-10-26

- A petición del operador, se verificó en modo de solo lectura la cuenta administradora aprobada y la vigencia de la credencial rotada, comparándola con su hash actual.
- Se entregó una copia local en acceso-admin-recuperado-20261026.txt, excluida mediante .git/info/exclude y con ACL limitada al usuario Windows actual y SYSTEM. No publicar su contenido en el chat ni versionarlo.
- No se modificaron contraseñas, usuarios, base de datos ni servicios de la VM durante esta recuperación.

## Reconversión a Red MES — 2026-10-26

- Objetivo confirmado: red profesional y académica para trabajadores del MES y sus instituciones. No replicar Facebook; combinar contactos profesionales y colaboración científica. Estudiantes fuera de la primera etapa, con posibilidad de inclusión futura.
- Implementados: identidad institucional, perfiles laborales, institución libre con validación, formación opcional, directorio por tipo profesional y rutas /miembros y /institucion con compatibilidad de las rutas históricas.
- Registro exige tipo laboral habilitado y declaración de empleo; aprobar exige completar el vínculo. Nuevas categorías no conceden permisos administrativos. Implementado /completar-perfil para revalidar afiliación sin perder datos.
- Aportes clasificados por actualización, publicación científica, proyecto, convocatoria o consulta; enlaces a recursos y filtros. Sin fingir bibliografía verificada ni expedientes de proyectos completos.
- Migración 0017 aditiva. Perfiles históricos sin tipo ni empleo declarado se marcan por actualizar; no se modifica su aprobación automáticamente. Pendiente la elección del operador sobre la revalidación de las siete cuentas históricas de miembros.
- Respaldo verificado en /var/backups/red-egresados/pre-red-mes-20261026. Snapshot: 8 usuarios, 7 perfiles, 5 aportes, 8 noticias y 8 conexiones. El servicio continúa activo durante preparación y pruebas.
- Pruebas Windows: typecheck/build correctos, siete pruebas unitarias y trece HTTP correctas; lint con cero errores y 44 advertencias. Validación sobre copia real en Linux correcta: valores originales de las 19 tablas conservados, integridad y claves foráneas OK. Desplegado como c6bf55c; servicio activo y verificación pública HTTPS 200.
- Ver RECONVERSION_RED_MES.md para alcance, conservación de datos y límites de esta etapa.

- Corte del 26 de octubre: compilación Linux prevalidada y manifiesto de 117 fuentes verificado; se migró la base real en su ubicación, sin sustituirla por una copia. Snapshot adicional pre-cutover.db antes de la migración.
- Conservados todos los valores anteriores de las 19 tablas, incluyendo contraseñas, roles y estados de aprobación. Permanecen 8 cuentas, 7 perfiles, 5 aportes, 8 noticias y 8 conexiones. No se crearon usuarios de prueba ni se reclasificó a antiguos miembros como trabajadores verificados.
- Verificación real: portada/formulario nuevos 200, API /members privada, API canónica y heredada equivalentes, credencial admin válida y logout revocado. Servicio sin reinicios inesperados. DNS, TLS y HAProxy no se modificaron; comprobada portada pública HTTPS con Red MES.
- Pendiente de elección del operador la revalidación de las siete cuentas históricas. Hasta recibirla, se conserva su estado actual y se permite completar el vínculo laboral desde el menú/perfil.

## Identidad CONECTA — 2026-10-26

- Adoptados nombre, logos originales, favicon, imagen social, colores y tipografías del paquete `diseño/`. Ver IDENTIDAD_CONECTA.md.
- Portada institucional adaptable, login compartido, navegación y paleta privada actualizados; ayuda y privacidad reales. Código/repositorios claramente futuro.
- Sin cambios de esquema ni datos: trabajadores solamente, aprobación institucional y cuentas históricas conservadas.
- Windows: typecheck/build y 21 pruebas correctas; lint sin errores. Capturas y flujos en Chrome real sobre base efímera. Respaldo de VM verificado.

- Identidad desplegada como 98c36c5. Linux: compilación, typecheck y 21 pruebas correctas; lint sin errores. Manifiesto de 156 fuentes/recursos validado contra la VM. Navegación institucional con nombre largo comprobada a 1280px.
- Producción HTTPS 200 con CONECTA; páginas públicas y logos correctos. Credencial admin vigente y logout revocado. Servicio activo, NRestarts=0.
- Snapshot pre-cutover adicional y compilación anterior respaldados. Conservados todos los valores de las 19 tablas, incluidos usuarios, contraseñas, roles y aprobaciones; cuentas y contenido sin cambios. Sin migraciones ni modificación de DNS/TLS/HAProxy.

## Interior de CONECTA — 2026-10-26

- Inicio privado convertido en espacio de trabajo profesional: cabecera personal, métricas reales, accesos temáticos, perfil y navegación por rol; actividad central y formulario desplegable.
- Descubrimiento basado en datos existentes: perfiles aprobados sin contactos privados, próximos eventos y resumen de noticias. Sin recomendaciones algorítmicas ni contenido de demostración en producción.
- Windows: typecheck/build y 15 pruebas HTTP correctas; lint sin errores (42 advertencias existentes). Chrome: publicar y filtrar, estados vacíos/con contenido, tamaños 320–1440px sin desbordamiento.
- Respaldo verificado en /var/backups/red-egresados/pre-conecta-workspace-20261026. Desplegado como aa76efb; sin migración ni cambios de cuentas.

- Linux: typecheck, lint sin errores, build y 22 pruebas correctas (7 unitarias, 15 HTTP). Producción: inicio autenticado 200, administrador y cierre de sesión verificados; portada pública HTTPS conservada.
- Manifiesto de 156 archivos coincide con la versión validada. Todas las filas de las 19 tablas conservadas durante el corte; servicio activo y sin reinicios inesperados. Respaldo de compilación y snapshot pre-cutover disponibles.

## Cabecera personal ilustrada — 2026-10-27

- Sustituidas las cifras del banner privado por ilustración original generada con imagegen integrado: profesionales colaborando, conocimiento compartido y ciencia abierta, en azul y menta.
- Recurso en public/brand/conecta-colaboracion-personal.png; prompt y procedencia en diseño/07_Desarrollo/ilustracion-cabecera.md. Imagen original, adaptación CSS y optimización Next Image; saludo accesible conservado.
- Retiradas consultas de conteo usadas exclusivamente por la cabecera. Sin cambios de datos, permisos o esquema.
- Respaldo verificado en /var/backups/red-egresados/pre-conecta-personal-banner-20261027; desplegado como d7f49ef.

- Windows: build/typecheck, lint sin errores y navegador real a 320–1440px correctos. Linux: build/typecheck/lint y 15 pruebas HTTP correctas. Cabecera autenticada sin cifras y con ilustración verificada en producción.
- Recurso optimizado WebP de 640px: 27 930 bytes, HTTPS 200. Manifiesto de 157 archivos coincide con la compilación validada. Servicio activo; todas las filas de las 19 tablas conservadas, sin migraciones.

## Rechazo de la ilustración — 2026-10-27

- El operador rechaza expresamente la ilustración figurativa de profesionales. Se retira del banner personal; permanece la cabecera con saludo y paleta, sin cifras.
- El operador indica reutilizar las mismas tarjetas de la portada pública. Se extrae EcosystemMosaic para compartir Personas, Ciencia, Proyectos y Código entre ambas cabeceras, con tamaño adaptado a la zona personal y móvil. Sin cifras ni nueva imagen.
- Recurso generado conservado sin referencia en la interfaz como historial; no reutilizarlo como propuesta aprobada.

- Tarjetas originales publicadas como 2cd3cb8. Navegador real: cuatro tarjetas visibles entre 320 y 1440px, sin desbordamiento ni ilustración en la cabecera. Linux: compilación/typecheck/lint y 15 pruebas HTTP correctas.
- Producción: inicio autenticado 200 con las cuatro tarjetas, sin imagen generada ni cifras. Portada pública HTTPS 200 conservada. Manifiesto de 158 archivos verificado; todas las filas de las 19 tablas conservadas. Respaldo: /var/backups/red-egresados/pre-conecta-clean-banner-20261027.

## Imágenes locales y reinicio solicitado — 2026-10-27

- El operador autoriza expresamente vaciar los datos de la red y conservar solo dinfo, sin publicaciones. Se conserva también su perfil asociado y credencial actual. Esta decisión sustituye la consulta pendiente de revalidación de cuentas históricas.
- Implementada carga directa de imágenes y alternativa URL en aportes y noticias, con vista previa, errores y WebP optimizado. Nuevas rutas privadas /api/media, directorio persistente UPLOADS_PATH y Sharp como dependencia directa; sin migraciones.
- Script transaccional reset-network.cjs conserva exactamente cuenta/perfil/sesiones de dinfo y migraciones, elimina los demás datos. Prueba aislada y ensayo sobre copia antes de producción.
- Respaldo verificado: /var/backups/red-egresados/pre-conecta-uploads-reset-20261027. Implementación y reinicio completados como 5c4aa66; ver IMAGENES_Y_REINICIO.md.

- Estado actual de producción tras reinicio: solo dinfo y su perfil; cero aportes/noticias/comentarios/reacciones/conexiones/grupos/eventos/notificaciones/listas. Contraseña, rol y sesiones previas de dinfo conservados exactamente. Se mantienen esquema y 18 migraciones técnicas.
- Validación Windows/Linux: compilación, typecheck y 24 pruebas correctas; lint sin errores. Ensayo sobre copia real y reversión ante fallo comprobados. Chrome: publicar aporte y noticia con imágenes locales. Manifiesto de 165 archivos verificado contra producción.
- Prueba pública HTTPS de imagen >1 MB correcta; almacenamiento persistente propiedad del servicio, lectura privada y logout verificados. Imágenes temporales eliminadas; no se crearon usuarios ni publicaciones de prueba en producción. Servicio activo y NRestarts=0.
- Respaldo adicional pre-cutover.db y compilación/dependencias anteriores conservados. DNS/TLS/HAProxy/Nginx sin cambios; el límite existente de Nginx de 10 MB admite estas cargas.

## Perfil profesional y edición — 2026-10-27

- Rediseñada la vista del perfil con identidad CONECTA y secciones de presentación, trayectoria, conocimientos, intereses, idiomas, contacto y aportes. Avatar con foto privada o iniciales; estados vacíos útiles y accesos por sección.
- Nuevo editor propio /miembros/[id]/editar, con persistencia por API existente, cancelación, mensaje de éxito y subida/eliminación de foto. Correo de contacto independiente de credenciales. Institución/tipo de vínculo conservan el flujo de validación existente.
- Propietario, conexiones y administración ven el perfil completo; contactos y editor ajeno protegidos. Se adapta la vista admin a permisos ya existentes de API.
- Windows: compilación y 17 pruebas HTTP correctas. Chrome real: guardar/recargar/cancelar/foto y tamaños 320–1440px. Respaldo de fuentes, SQLite e imágenes verificado en /var/backups/red-egresados/pre-conecta-profile-20261027. Publicado como ccef14d; no volver a ejecutar el reinicio de datos anterior.

- Linux: compilación/typecheck/lint y 17 pruebas HTTP correctas. Manifiesto de 168 archivos validado. HTTPS público: perfil propio y editor 200; anónimo dirigido al login. No se modificó el perfil real para las pruebas.
- Corte: todos los valores de las 19 tablas y las imágenes persistentes conservados. Se mantiene una cuenta, un perfil y el aporte nuevo que el operador publicó después del reinicio anterior. Servicio activo y NRestarts=0; respaldo pre-cutover y compilación anterior disponibles.

## Diseño de toda la plataforma — 2026-10-27

- Extendida identidad CONECTA a comunidad, agenda, detalle, registro/vínculo, espera, información institucional, administración y correo. Componentes compartidos PageHeader/AdminNav/PageFooter y reglas ui-* de tarjetas/formularios/tablas/estados.
- Panel de gestión renovado con navegación activa por rol y presentación adaptable. Eliminado el tema oscuro aislado de listas de correo. Directorio con acceso al perfil propio, sin botón de conexión consigo mismo.
- Se conservan portada, espacio de trabajo y perfil aprobados. Sin cambios de API, permisos, esquema ni operaciones de negocio.
- Chrome real: 44 vistas/variantes, tamaños 320–1440px y roles admin/editor/institución/pendiente/sin perfil, sin desbordamiento ni errores JS. Windows: build y 17 pruebas HTTP correctas; lint sin errores.
- Respaldo verificado en /var/backups/red-egresados/pre-conecta-platform-20261027, incluidas imágenes. Publicado como 8d3e7e9. Conservar todos los datos actuales; no ejecutar nuevamente el reinicio de base solicitado anteriormente.

- Linux: build/typecheck/lint y 17 pruebas HTTP correctas. 44 vistas y variantes comprobadas con Chrome, incluidos miembros regulares y estados vacíos, sin desbordamiento entre 320–1440px.
- HTTPS real: diseño compartido en público/comunidad/gestión; perfil y editor propios disponibles; admin y logout verificados. Manifiesto de 171 archivos coincide con la compilación validada.
- Conservados todos los valores de las 19 tablas durante el corte y las imágenes persistentes. Estado observado: 4 cuentas, 4 perfiles, 1 aporte y 6 conexiones. Snapshot pre-cutover y compilación anterior respaldados. Servicio activo y NRestarts=0; sin pruebas con datos nuevos en producción.


## Navegación y solicitudes de conexión — 2026-10-27

- Cabecera privada: Comunidades, Eventos, Directorio y Conexiones, seguidas de Noticias y acceso institucional cuando corresponde. Retirados los enlaces redundantes Ciencia/Proyectos; el logo conserva acceso al inicio. Mismo orden en móvil. «Personas» pasa a «Directorio» en accesos y migas; tarjetas decorativas aprobadas sin cambios.
- Las cuatro páginas principales comparten un contenedor adaptable de máximo 1280 px y márgenes/padding iguales. Gutter estable de desplazamiento para evitar saltos horizontales al cambiar de sección.
- Unificados botones del directorio y perfil en ConnectionAction: estado devuelto por servidor, bloqueo inmediato de doble clic, protección frente a respuestas GET atrasadas, errores inline y reintentos. Aceptación desde el perfil actualiza la vista protegida.
- Servicio SQLite transaccional para enviar/aceptar/rechazar/cancelar: reintentos idempotentes, reutilización de solicitudes rechazadas respetando UNIQUE(sender_id,receiver_id), solicitudes cruzadas coherentes y una sola notificación de aceptación. Lecturas canónicas por pareja sin limpieza masiva de datos históricos.
- Conexiones carga las tres pestañas juntas y actualiza en segundo plano; el header actualiza contadores sin refrescar toda la página cada 30 segundos. Contador pendiente incluye solo invitaciones recibidas.
- Windows: build y 18 pruebas HTTP correctas; lint sin errores (38 advertencias existentes). Chrome con dos cuentas: envío/aceptación, respuesta atrasada y reintento tras fallo; ancho idéntico en cuatro rutas a 320/390/768/1024/1440 px, sin overflow ni errores JS.
- Respaldo previo verificado en /var/backups/red-egresados/pre-conecta-navigation-connections-20261027. Conservar cuentas, aportes e imágenes actuales; no ejecutar el reinicio histórico.


- Desplegado como `8ae3dd7`. Linux: build/typecheck/lint y 18 pruebas HTTP correctas. Suite adicional de 8 pruebas de sesión/datos correcta en Windows; revisión general de páginas y roles con Chrome sin errores.
- Producción y HTTPS público: cuatro contenedores comunes, perfil/editor, administración y APIs de conexiones comprobados sin crear solicitudes ni usuarios de prueba. Manifiesto de 172 archivos validado contra la compilación Linux y la VM.
- Todas las filas de las 19 tablas preservadas durante el corte; estado observado: 4 cuentas, 4 perfiles, 1 aporte y 6 conexiones. Imágenes y credenciales intactas, sin migraciones. Servicio activo, NRestarts=0; pre-cutover.db y compilación anterior disponibles en el respaldo.


## Comunidades, espacio personal y acceso simplificado — 2026-10-27

- La lista de comunidades recibe isMember/canEdit del servidor: muestra «Ya eres miembro» y evita repetir Unirse tras recargar. Unión/salida transaccional e idempotente; el creador permanece en su comunidad. Filtros y categorías sin emojis ajenos a la marca.
- Nueva gestión exclusiva de administración en /admin/comunidades: editar nombre, descripción, categoría y tipo de comunidades de cualquier creador. Permiso PATCH comprobado en servidor; no cambia propietario ni añade al administrador como miembro. Editor y miembro sin propiedad no reciben ese permiso.
- Inicio privado de dos columnas: avatar/foto, cargo e institución junto al saludo; retirada la columna izquierda. Conservada la columna derecha con personas, agenda y noticias, las tarjetas decorativas aprobadas y los accesos de gestión por rol en la cabecera.
- Directorio más compacto, hasta cuatro tarjetas por fila, sin franja superior ni sombras. Retirado el select de formación libre; búsqueda incluye áreas de conocimiento y habilidades. Noticias adopta el ancho común de 1280 px.
- Perfil: formación/áreas separadas por comas, punto y coma o saltos de línea se presentan como etiquetas, sin modificar los datos históricos. Edición con textarea y orientación para organizar áreas, habilidades e intereses.
- Registro reducido a Datos de Acceso e Información Personal, más declaración laboral. Sin institución/cargo/formación/enlaces obligatorios antes del acceso. Perfil inicial con vínculo unspecified; cuenta siempre pending, privilegios ignorados. Administración global revisa solicitudes sin institución; institución no puede aprobar solicitudes ajenas o sin asignación.
- Tras aprobación, completar por primera vez un vínculo vacío mantiene el acceso ya aprobado. Cambios posteriores de afiliación siguen el proceso de validación existente. Esta decisión sustituye el requisito histórico de completar toda la afiliación antes de aprobar el nuevo registro básico.
- Respaldo verificado: /var/backups/red-egresados/pre-conecta-refinements-20261027. Conservar todos los datos actuales, sin reinicio ni migraciones.

- Windows: build/typecheck, 20 pruebas HTTP y 8 de sesión/datos correctas; lint sin errores. Chrome: ocho rutas a 320/390/768/1024/1440 px, pertenencia tras recarga, edición admin de comunidad ajena y bloqueo de miembro, etiquetas de formación, sombras ausentes, ancho de Noticias y cabecera personal sin columna izquierda, sin overflow ni errores JS.


- Desplegado como `9b088df`. Linux: compilación/typecheck/lint y 20 pruebas HTTP correctas. Navegador: ocho rutas y cinco tamaños, gestión admin de comunidad ajena, pertenencia persistente y controles de presentación correctos.
- Producción/HTTPS: perfil/editor, registro reducido, cabecera personal, gestión de comunidades, ancho de Noticias y membresía real verificados sin modificar datos de negocio. La comunidad existente conserva sus miembros; no se crearon usuarios ni solicitudes de prueba.
- Las 19 tablas conservan todas sus filas y valores durante el corte; estado observado: 4 cuentas, 4 perfiles, 1 aporte, 6 conexiones y 1 comunidad. Imágenes y credenciales preservadas. Servicio activo con NRestarts=0. Manifiesto de 174 archivos coincide con la compilación Linux y la VM; respaldo pre-cutover y compilación anterior disponibles.


## Publicaciones centradas y apoyo lateral — 2026-10-27

- El operador mantiene foto/cargo/institución en el saludo, pero rechaza el feed alineado a la izquierda. Se adopta una nueva columna izquierda ligera sin perfil repetido: Mis comunidades (hasta cuatro pertenencias reales) y accesos a conexiones, eventos y directorio.
- Escritorio: tres columnas, laterales de ancho idéntico (240/260 px) y publicaciones en el centro geométrico. Se conserva la derecha con personas, agenda y noticias.
- Hasta 1199 px: feed centrado en contenedor máximo de 820 px; paneles de la derecha debajo. En móvil los aportes se muestran primero; columna izquierda oculta y accesos principales disponibles en la navegación existente.
- Chrome: centro verificado por coordenadas a 320/390/768/1024/1280/1440/1920 px, sin overflow ni errores JS. Comunidades reales, filtros de aportes y estado vacío correctos. Windows build correcto. Sin cambios de permisos, esquema ni registros.
- Respaldo verificado en /var/backups/red-egresados/pre-conecta-centered-feed-20261027. Esta distribución sustituye el diseño anterior de dos columnas.

- Publicado como `84172c8`. Linux build/typecheck/lint y 20 pruebas HTTP correctas. Producción: inicio con columna de comunidades y perfil en saludo verificado, todas las filas de las 19 tablas e imágenes conservadas. Manifiesto de 174 archivos coincide con la compilación validada. Servicio activo y NRestarts=0.


## Notificaciones por servicio de Interoperabilidad — 2026-10-27

- Integración OAuth2 Client Credentials con cliente confirmado `conecta`, audiencia mes-api y rol notification-sender. Secretos excluidos de Git; configuración root-only en /etc/red-egresados/notifications.env mediante EnvironmentFile. Sin SMTP en CONECTA.
- Nueva Administración → Notificaciones, exclusiva de admin, con un destinatario aprobado por operación, texto/asunto, vista previa escapada e historial de 50 operaciones. HTML automático opcional, sin adjuntos ni envío masivo. Límites locales: 5/min por admin y 100/día globales.
- Migración aditiva 0018_add_email_dispatches.sql: auditoría de destinatario/asunto/actor/estado/referencia y hash de contenido; no conserva cuerpo, secreto ni token. Identificador único local evita repetir una petición ya registrada. Un envío interrumpido se presenta como incierto, sin reintentos automáticos.
- Tokens en memoria, caché con vencimiento y comprobación de audiencia/rol. Endpoints HTTPS fijos, TLS validado, sin redirects. 202 accepted_by_relay se distingue expresamente de entrega al buzón. Timeout/500/respuesta inesperada permanecen inciertos.
- El operador autoriza un correo de prueba a dinfo@mes.gob.cu. Un único envío desde desarrollo fue aceptado HTTP202, referencia eca895ae-40cd-4ca8-9823-bfc588ad6004. No repetirlo; recepción en buzón no confirmada.
- La VM resuelve ambos dominios a 190.6.81.66 y recibe conexión rechazada en esa salida. HTTPS hacia HAProxy interno 10.46.4.22 funciona con SNI/certificado válidos. Resolución limitada a la unidad systemd mediante BindReadOnlyPaths de /etc/red-egresados/notification-hosts a /etc/hosts; DNS global intacto, sin acceso al 8004.
- Verificado OAuth HTTP200 desde entorno de servicio en VM: cliente/audiencia/rol correctos, sin emitir otro correo. Mantener secreto y tokens fuera de logs y archivos fuente.
- Windows: compilación, 21 pruebas HTTP simuladas y 14 unitarias correctas. Navegador: vista previa, aceptación simulada, timeout sin reintento, historial persistente, bloqueo de envío, 320–1440px sin overflow ni errores JS. Respaldo previo: /var/backups/red-egresados/pre-conecta-email-20261027.
