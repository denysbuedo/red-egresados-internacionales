# Technical Context: Egresados Cuba

## Technology Stack

| Technology   | Version | Purpose                         |
| ------------ | ------- | ------------------------------- |
| Next.js      | 16.x    | React framework with App Router |
| React        | 19.x    | UI library                      |
| TypeScript   | 5.9.x   | Type-safe JavaScript            |
| Tailwind CSS | 4.x     | Utility-first CSS               |
| Drizzle ORM  | 0.45.x  | Database ORM                    |
| SQLite       | -       | Database (via @kilocode/app-builder-db) |
| Bun          | Latest  | Package manager & runtime       |

## Commands

```bash
bun install        # Install dependencies
bun build          # Production build
bun start          # Start production server
bun lint           # Run ESLint
bun typecheck      # Run TypeScript type checking
bun db:generate    # Generate database migrations
bun db:migrate     # Run migrations (auto in sandbox)
```

## Database

- Drizzle ORM with SQLite via `@kilocode/app-builder-db`
- Schema: `src/db/schema.ts`
- Client: `src/db/index.ts`
- Migrations: `src/db/migrations/`
- Config: `drizzle.config.ts`
- Migrations run automatically in sandbox after push

## API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/graduates` | GET, POST | List & create graduates |
| `/api/graduates/[id]` | GET, PUT, DELETE | Single graduate CRUD |
| `/api/connections` | GET, POST, PUT | Connections management |
| `/api/posts` | GET, POST | Activity feed |
| `/api/email-lists` | GET, POST | Email distribution lists |
| `/api/stats` | GET | Dashboard statistics |

## Key Dependencies

### Production
```json
{
  "next": "^16.1.3",
  "react": "^19.2.3",
  "react-dom": "^19.2.3",
  "@kilocode/app-builder-db": "github:Kilo-Org/app-builder-db#main",
  "drizzle-orm": "^0.45.2"
}
```

### Dev
```json
{
  "typescript": "^5.9.3",
  "tailwindcss": "^4.1.17",
  "drizzle-kit": "^0.31.10",
  "eslint": "^9.39.1"
}
```

## Despliegue reconciliado (2026-10-25)

- Producción utiliza Node 22, npm ci y package-lock.json recuperado de la VM. Bun sigue disponible como alternativa de desarrollo; no mezclar locks en un despliegue.
- SQLite usa DATABASE_PATH si se define, o dev.db en el directorio de trabajo. No usa DATABASE_URL. Los archivos de datos no se versionan.
- scripts/migrate.cjs aplica/adopta las migraciones SQL 0000-0015 con journal app_migrations y transacción. Incluye las columnas de aprobación institucional que faltaban.
- npm test ejecuta pruebas de migración con node:test. ecosystem.config.js conserva una instancia PM2 y escucha en 127.0.0.1.
- La sincronización no activa servicios ni publica el dominio; faltan correcciones de seguridad documentadas.

## Seguridad y ejecución (2026-10-25)

- Sesiones persistentes: tablas sessions y auth_rate_limits, migración 0016; helpers de tokens y límites en src/lib/session-store.cjs. Control transversal de API en src/lib/api-access.ts.
- Registro y creación de perfil atómicos mediante Drizzle; nuevo endpoint register-complete. Instituciones limitadas por institution_name/pending_university.
- Runtime objetivo Node 22.23.4, Next 16.4.3 y React 19.3.1. Único lock soportado para despliegue: package-lock.json, npm ci.
- deploy/red-egresados.service define ejecución sin root, fuente root-owned y SQLite en /var/lib/red-egresados/dev.db. Scripts de DB cargan DATABASE_PATH desde .env, respetando valores ya exportados.
- npm test: migraciones y sesiones. npm run test:http: flujos HTTP con datos aislados y servidor temporal; requiere build previo.


## Red MES: perfiles y aportes (2026-10-26)

- Migración 0017: graduates.member_type/employment_confirmed y user_posts.post_type/reference_url, sin reconstruir tablas ni cambiar IDs.
- Catálogos y marca en src/lib/site.ts. PROFILE_TYPES anticipa etapas futuras; MEMBER_TYPES filtra exclusivamente perfiles laborales habilitados en el registro inicial.
- Registro completo exige employmentConfirmed y perfil profesional; /api/auth/affiliation permite actualizar únicamente el vínculo de la sesión y devuelve a pending a miembros ordinarios. Admin/institution deben verificar la declaración antes de aprobar.
- /miembros y /api/members comparten la implementación segura heredada; /institucion comparte el panel de /universidad. Las rutas anteriores continúan siendo compatibles.
- graduation_year=0 es una marca interna para perfiles sin año, se serializa como null y no se muestra. Los datos académicos dejan de ser obligatorios.
- Aportes con tipos update/publication/project/call/question y enlace HTTP(S) validado. Filtros de actividad por tipo; no se afirman DOI verificados ni expedientes de proyectos independientes.


## Imágenes persistentes

Sharp 0.35.5: validar y convertir JPG/PNG/WebP a WebP sin EXIF, máximo 8 MB / 25 MP y lado 2048px. Las imágenes se almacenan en UPLOADS_PATH (/var/lib/red-egresados/uploads en la VM), fuera del árbol compilado y de Git; respaldo conjunto con SQLite. Lectura y subida privadas mediante /api/media. Los enlaces externos no se cachean automáticamente.
