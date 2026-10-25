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
