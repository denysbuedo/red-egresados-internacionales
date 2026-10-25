# Sincronización del repositorio y la VM

## Reconciliación del 25 de octubre de 2026

Se comparó el checkout de la VM en `1294541` y sus cambios sin confirmar con
`main` local y GitHub en `5717917`. No se eligió una versión por su fecha:
se revisaron las diferencias y se probaron las modificaciones integradas.

| Cambio encontrado en la VM | Decisión |
| --- | --- |
| Tipos de roles en administración | Conservar la intención, validar el filtro y aplicarlo a la consulta. |
| Valores nulos en publicaciones del perfil | Conservar los valores por defecto para contadores y nombre. |
| Tipos en home, eventos y tarjetas | El repositorio ya contenía correcciones equivalentes o mejores. |
| Conteo de conexiones con `$count(connections.id)` | Mantener `$count(connections)` del repositorio. |
| Filtro de reacciones con `&&` | Mantener `and(...)` del repositorio, que combina ambas condiciones SQL. |
| Exclusión del migrador Bun en tsconfig | Conservar el soporte de Bun existente; producción usa scripts/migrate.cjs con Node. |
| package-lock.json | Incorporar el lock de la VM, reconciliado con package.json; producción usa npm ci. |
| PM2 con un proceso en fork | Incorporar configuración reproducible y escucha en loopback. No activarla todavía. |
| optimize-db.cjs apuntando a prod.db | Conservar utilidad, apuntar a DATABASE_PATH/dev.db y exigir un archivo existente. No ejecutarla automáticamente. |
| dev.db modificada y prod.db vacía | Conservar datos de la VM; excluir bases y credenciales locales de Git. |

Se añadieron las migraciones faltantes `0014` y `0015` para institution_name
y pending_university. El migrador adopta tablas/columnas ya existentes,
registra checksums y aplica cada lote en una transacción. No reconstruye
tablas heredadas ni cambia retrospectivamente sus claves foráneas.

## Respaldo y datos

Respaldo anterior a cualquier cambio de código remoto:
`/var/backups/red-egresados/pre-sync-20261025/`.

Contiene el proyecto completo (incluidos .git, dependencias y build previo),
configuración Nginx, estado/patch Git y copias consistentes SQLite. Se verificaron
SHA-256, lectura del tar e integridad de ambas bases. Acceso restringido a root.

La base real es **dev.db**, con 8 usuarios, 7 perfiles, 8 noticias y 2 eventos
al comenzar la operación. prod.db estaba vacía. Nunca sustituir estos datos
por una base del repositorio ni crear un administrador con scripts de ejemplo.

La base local original y la copia usada para las pruebas permanecen en el
directorio temporal privado de esta sesión, fuera de Git. La base dev.db se
retiró del seguimiento sin borrar el archivo local. Las versiones históricas
de Git siguen conteniendo la base anterior.

## Validación y operación

Requisitos: Node 22 y npm. Se conservaron Next 16.2.3, React 19.2.5 y
better-sqlite3 12.8.0 del lock de la VM.

```bash
npm ci
npm run typecheck
npm run lint
npm test
DATABASE_PATH=/ruta/a/una/copia.db npm run db:migrate
DATABASE_PATH=/ruta/a/una/copia.db npm run build
```

Las pruebas cubren base nueva, adopción de esquema anterior, repetición,
rollback ante SQL inválido y detección de migraciones modificadas. Además,
se compararon todos los valores originales de las 16 tablas de la copia de
la VM antes y después de migrar: permanecieron iguales.

Para actualizar una VM: respaldar y verificar primero, revisar cambios locales,
preservarlos antes del avance de Git, instalar con npm ci, probar migraciones
sobre una copia, compilar y validar. Confirmar que los commits coinciden y que
git status no tiene cambios de código. Datos, secretos, logs y builds se
administran fuera de Git.

**La sincronización del código no autoriza su publicación en internet.** Quedan
pendientes las sesiones seguras, permisos de las API, revisión de credenciales,
la ruta /pendiente y la validación completa de registro/aprobación. No activar
PM2 ni cambiar DNS, HAProxy o certificados durante esta sincronización.
El hostname previsto para la publicación futura es conecta.reduniv.edu.cu.
