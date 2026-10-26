# Arquitectura: Red MES

## Componentes

- Next.js App Router y React: páginas de inicio, registro, espera, directorio, perfiles, conexiones, comunidades, eventos, noticias y administración.
- Rutas en src/app/api: llaman a authorizeApi antes de ejecutar operaciones de negocio. Los layouts también protegen páginas; la autorización no depende del cliente ni de ocultar enlaces.
- src/lib/api-access.ts: exige cuenta aprobada, aplica roles y comprueba Origin en mutaciones. Cada handler conserva las comprobaciones de propiedad y alcance institucional.
- src/lib/session.ts y session-store.cjs: token aleatorio de 256 bits en cookie __Host-session, hash en SQLite, caducidad 24 horas y revocación. Los roles/estados se leen de users en cada petición; no se confía en datos de identidad de la cookie.
- src/lib/registration.ts: validación y transacción de cuenta/perfil, siempre con rol user y estado pending. Las instituciones se limitan a su institution_name y las solicitudes a pending_university.
- src/db: Drizzle sobre better-sqlite3. Incluye perfiles, usuarios, contenido, conexiones, grupos, eventos, notificaciones, sesiones y límites de autenticación. La migración CJS transaccional mantiene app_migrations con checksums y adopta el esquema heredado.

## Ejecución

Nginx en 80 envía a Next en 127.0.0.1:3000. systemd ejecuta Node 22 bajo el usuario red-egresados, con ProtectSystem=strict y sin privilegios de root. El código y .git son propiedad de root. Solo los datos y la caché de Next permiten escrituras del servicio.

La base activa es /var/lib/red-egresados/dev.db y se configura con DATABASE_PATH. Fuentes, datos, secretos, backups y artefactos de build tienen ciclos separados. Los datos nunca se sincronizan mediante checkout Git.

El frontal HTTPS/HAProxy y el DNS del dominio conecta.reduniv.edu.cu se preparan en una etapa separada. Las cookies de producción exigen HTTPS. No ejecutar simultáneamente PM2 y la unidad systemd.

## Validación

npm ci utiliza el único package-lock.json. npm test cubre migración y sesiones; npm run test:http crea base y servidor propios para probar autorización y flujos de registro/aprobación. Los datos reales no se usan para crear cuentas de prueba. Ver SEGURIDAD_DESPLIEGUE.md para evidencia y límites de la revisión.


## Reconversión profesional y académica

- La identidad y los catálogos están en src/lib/site.ts. Los tipos de perfil profesional son distintos de los roles de autorización. El registro inicial solo habilita categorías de trabajadores; estudiante permanece deshabilitado en cliente y servidor.
- La migración 0017 añade member_type/employment_confirmed a graduates y post_type/reference_url a user_posts. Las tablas e IDs heredados permanecen estables, con aliases /miembros y /api/members.
- El vínculo laboral se declara al registrarse o en /completar-perfil y lo valida una institución o un administrador. El endpoint /api/auth/affiliation solo modifica el perfil de la sesión; un miembro ordinario vuelve a pending cuando cambia su vínculo.
- Los aportes se clasifican y enlazan recursos externos; no son todavía expedientes de proyectos ni bibliografía verificada. Se priorizan instituciones y colaboración frente a países de origen y métricas de likes.
