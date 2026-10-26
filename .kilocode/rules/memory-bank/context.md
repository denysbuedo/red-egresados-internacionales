# Active Context: Egresados Cuba - Red Internacional

## Current State

**Status**: Código reconciliado y compilado en la VM; publicación pendiente de seguridad y validación funcional

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
- Servicio systemd preparado con usuario red-egresados y datos en /var/lib/red-egresados/dev.db; runtime Node 22.23.4 verificado por SHA-256 oficial. Pendiente de validación Linux y activación al registrar esta entrada.
- Respaldo previo verificado en /var/backups/red-egresados/pre-security-20261025. Un administrador aún usa la contraseña histórica publicada: se rotará antes del arranque.
- Ver SEGURIDAD_DESPLIEGUE.md para diseño, pruebas y operación. DNS/TLS/HAProxy del dominio nuevo permanecen pendientes.
