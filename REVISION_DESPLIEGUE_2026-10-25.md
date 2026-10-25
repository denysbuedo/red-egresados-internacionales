# Revisión del proyecto y despliegue — 2026-10-25

## Resultado

El código almacenado en la VM no coincide con el repositorio local. La aplicación tampoco estaba atendiendo en el puerto 3000 durante la revisión.

| Evidencia | Repositorio local | VM |
|---|---|---|
| Commit HEAD | `571791712b6e1bd471fdd5bfffbb4e8a13dba7fe` | `1294541f94e8e8681589c9ac589658070ea1cebf` |
| Ruta | Workspace del proyecto | `/var/www/red-egresados-internacionales` |
| Cambios sobre HEAD | Solo acceso.txt sin seguimiento al comenzar | 10 archivos versionados modificados y 4 archivos sin seguimiento |

La VM (`vmredegresados`, 10.46.4.75) se consultó mediante túnel SSH por el bastión, verificando su clave de host contra la previamente conocida en el bastión. No se modificaron archivos, bases de datos, servicios ni configuración remotos.

## Análisis del proyecto

Aplicación Next.js 16, React 19, TypeScript y Tailwind 4, con rutas de API en App Router, Drizzle y better-sqlite3. Incluye perfiles, directorio, conexiones, publicaciones, comunidades, eventos, noticias, notificaciones, aprobación institucional y administración. El cliente SQLite abre `dev.db` de forma explícita; no utiliza DATABASE_URL.

Hallazgos por inspección del código, sin intentar explotar vulnerabilidades:

- **Crítico:** `src/lib/session.ts` acepta una cookie Base64 con userId y createdAt sin firma ni validación contra una sesión persistida. Permite fabricar una identidad correspondiente a un usuario existente. Se observó tanto en el repositorio como en el fuente de la VM.
- **Alto:** `src/app/api/email-lists/route.ts` permite consultar listas, previsualizar correos y crear listas sin comprobar sesión. `GET /api/graduates` también devuelve registros completos sin autenticación ni paginación.
- Existen credenciales de desarrollo en documentación/scripts. No se reproducen en este informe.
- El protocolo recomienda DATABASE_URL y `npm ci`, pero el cliente usa dev.db y el repositorio tiene bun.lock sin package-lock.json. La VM tiene un package-lock.json no versionado.
- Parte del banco de memoria todavía describe la plantilla inicial.

## Diferencias de despliegue

El historial local contiene dos commits posteriores al HEAD de la VM:

1. `8f5d552`: AppShell, flujo de aprobación y mejoras de interfaz.
2. `5717917`: correcciones de TypeScript y linting y AppShell.

Se compararon archivos mediante contenido y hashes SHA-256, normalizando CRLF/LF para texto. Se confirmaron diferencias en package.json, bun.lock, scripts/migrate.cjs y múltiples fuentes: autenticación, conexiones, eventos, reacciones, registro, directorio, comunidades, página principal, layout, Navbar, AdminPostCard, esquema y sesiones. `src/components/AppShell.tsx` falta en la VM. Los resultados de normalización de texto no se usan para concluir diferencias de imágenes o favicon.

`git status` remoto muestra modificaciones en:

- dev.db
- package.json
- src/app/api/admin/users/route.ts
- src/app/api/connections/route.ts
- src/app/api/events/route.ts
- src/app/api/posts/reactions/route.ts
- src/app/egresados/[id]/page.tsx
- src/app/page.tsx
- src/components/AdminPostCard.tsx
- tsconfig.json

Archivos adicionales sin seguimiento: ecosystem.config.js, package-lock.json, prod.db y scripts/optimize-db.cjs. Algunas modificaciones remotas son ajustes de tipos; no debe asumirse que se pueden descartar todas por actualizar el repositorio.

## Estado del servicio

- Nginx escucha en puerto 80 y configura egresados.mes.gob.cu hacia 127.0.0.1:3000.
- No había listener en 3000 ni proceso Next.js en la consulta de procesos.
- Petición directa a Nginx con Host correcto y sin proxy de entorno: **HTTP 502**.
- `.next/BUILD_ID` tiene fecha de modificación 2026-04-11 12:17 UTC. Esto acredita un artefacto antiguo, pero no permite atribuirlo de forma fiable a un commit concreto.
- ecosystem.config.js configura PM2 con una instancia en fork, npm start y puerto 3000. No se consultó el estado de PM2 como root ni se inició su daemon.

## Alcance y siguiente paso

La comparación se refiere al checkout local actual, no a una actualización consultada de GitHub. No se instalaron dependencias ni se ejecutó build/lint/typecheck: el alcance fue análisis y verificación del despliegue. No se verificó el recorrido público a través de HAProxy.

Antes de sincronizar: respaldar fuentes, configuración y bases de datos remotas; revisar y preservar cambios de la VM; resolver la autenticación insegura; preparar un build verificable y después planificar la puesta en servicio. No se realizó despliegue ni reinicio.
