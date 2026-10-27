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
