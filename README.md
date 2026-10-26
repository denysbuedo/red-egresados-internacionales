# Red MES — Ministerio de Educación Superior

> Red profesional y académica para trabajadores del MES y de sus instituciones.

[![Versión](https://img.shields.io/badge/versión-0.0.8--beta.1-blue.svg)](https://github.com/denysbuedo/red-egresados-internacionales/releases)
[![Licencia](https://img.shields.io/badge/licencia-Privado-gray.svg)]()

---

## 📋 Descripción

Red profesional y académica para docentes, investigadores, especialistas, técnicos, directivos y demás trabajadores del Ministerio de Educación Superior y sus instituciones. Permite crear perfiles, establecer contactos y compartir resultados, proyectos, convocatorias y consultas. El registro de estudiantes no está habilitado en esta primera etapa.

## ✨ Características

- ✅ **Registro con aprobación** — Flujo de validación por instituciones
- ✅ **Perfiles profesionales** — Datos académicos y profesionales completos
- ✅ **Aportes profesionales** — Resultados científicos, proyectos, convocatorias y consultas con enlaces y filtros
- ✅ **Sistema de conexiones** — Solicitudes de amistad con aceptar/rechazar
- ✅ **Eventos** — Webinars y encuentros con RSVP automático
- ✅ **Comunidades** — Grupos por universidad, carrera, país o interés
- ✅ **Noticias** — Publicaciones administrativas con opción de fijar (1/3/7 días)
- ✅ **Notificaciones** — Sistema completo de alertas
- ✅ **Panel de administración** — Gestión de usuarios, contenido y aprobaciones

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm ci

# 2. Ejecutar migraciones
node scripts/migrate.cjs

# 3. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará en **http://localhost:3000**

### Administración

No hay credenciales predeterminadas. El script de creación de administradores exige
ADMIN_USERNAME, ADMIN_EMAIL y ADMIN_PASSWORD, y no modifica cuentas existentes.

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [Reconversión a Red MES](RECONVERSION_RED_MES.md) | Público inicial, orientación profesional y académica, datos y compatibilidad |
| [Seguridad y operación](SEGURIDAD_DESPLIEGUE.md) | Sesiones, permisos, pruebas y servicio de la VM |
| [Sincronización del despliegue](SINCRONIZACION_DESPLIEGUE.md) | Estado verificado, datos conservados y procedimiento vigente |
| [📘 Guía del Desarrollador](GUIDE_DESARROLLADOR.md) | Documentación técnica completa para el equipo de desarrollo |
| [📋 Protocolo de Prueba](PROTOCOLO_PRUEBA.md) | 44 casos de prueba para QA |
| [🚀 Protocolo de Despliegue](PROTOCOLO_DESPLIEGUE.md) | Instrucciones para producción (Ubuntu 24.04) |
| [📄 Documentación Técnica](DOCUMENTACION.md) | Resumen técnico del sistema |
| [📊 Informe Ejecutivo](INFORME_EJECUTIVO.md) | Resumen para dirección y gerencia |

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | Next.js 16 + React 19 + Tailwind CSS 4 |
| **Backend** | Next.js API Routes (Server Components) |
| **Base de datos** | SQLite (better-sqlite3) |
| **ORM** | Drizzle ORM |
| **Autenticación** | Cookies HTTP-only + bcryptjs |

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   ├── admin/              # Panel de administración
│   ├── comunidades/        # Grupos
│   ├── conexiones/         # Solicitudes
│   ├── directorio/         # Búsqueda
│   ├── miembros/           # Perfiles profesionales (egresados/ como compatibilidad)
│   ├── eventos/            # Eventos
│   ├── noticias/           # Noticias
│   ├── terminos/           # Términos
│   └── estatutos/          # Estatutos
├── components/             # Componentes React
├── db/                     # Base de datos y migraciones
└── lib/                    # Utilidades (auth, sesiones, etc.)
```

## 🎭 Roles del Sistema

| Rol | Función |
|-----|---------|
| `user` | Trabajador registrado y aprobado |
| `admin` | Control total del sistema |
| `institution` | Aprueba registros de su universidad |
| `editor` | Publica noticias y eventos |

## 📦 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `bun run dev` | Servidor de desarrollo |
| `bun run build` | Compilación para producción |
| `bun run start` | Servidor de producción |
| `node scripts/migrate.cjs` | Ejecutar migraciones |
| `node scripts/create-admin-fixed.cjs` | Crear usuario admin |

## 🌐 Requisitos de Producción (150k usuarios)

| Recurso | Valor |
|---------|-------|
| **RAM** | 16 GB |
| **CPU** | 8 cores |
| **Disco** | 200 GB NVMe |
| **Sistema** | Ubuntu 24.04 LTS |
| **Web server** | Nginx + PM2 |

## 👥 Contribución

Este proyecto es mantenido por el equipo del **Ministerio de Educación Superior de Cuba**.

Para contribuir:
1. Crear rama desde `dev`
2. Hacer cambios y commit
3. Abrir Pull Request a `dev`
4. Después de QA, merge a `main`

## 📄 Versión

Actual: **v0.0.8-beta.1**

---

**© 2026** Red MES · Ministerio de Educación Superior · República de Cuba
