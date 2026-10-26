# Red de Egresados Internacionales de la Educación Superior Cubana

## Documentación Técnica Completa

---

## 1. Descripción General

La **Red de Egresados Internacionales de la Educación Superior Cubana** es una plataforma web tipo red social profesional diseñada para conectar a egresados extranjeros que estudiaron en universidades cubanas. Permite a los graduados registrarse, crear perfiles profesionales, conectarse entre sí, compartir publicaciones, unirse a grupos temáticos, participar en eventos y mantenerse informados a través de un sistema de notificaciones.

### 1.1 Objetivo Principal
Fomentar la colaboración, el networking profesional y el intercambio de conocimientos entre egresados internacionales de la educación superior cubana, manteniendo toda la actividad pública y transparente.

### 1.2 Principios de Diseño
- **Colaboración abierta**: Todo el contenido es público
- **Transparencia**: Las conexiones y publicaciones son visibles para todos los miembros
- **Simplicidad**: Interfaz intuitiva y limpia
- **Profesionalismo**: Enfocado en desarrollo profesional y académico

---

## 2. Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Lenguaje** | TypeScript 5.9 |
| **UI** | React 19 + Tailwind CSS 4 |
| **Base de datos** | SQLite (better-sqlite3) |
| **ORM** | Drizzle ORM 0.45 |
| **Autenticación** | Cookies HTTP-only + bcryptjs |
| **Runtime** | Node.js / Bun |
| **Color principal** | Azul MES `#003f8f` |

---

## 3. Estructura de Base de Datos

### 3.1 Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `users` | Cuentas de usuario (username, email, password_hash, role) |
| `graduates` | Perfiles de egresados (datos profesionales, académicos) |
| `connections` | Solicitudes de conexión entre egresados |
| `admin_posts` | Noticias publicadas por administradores |
| `user_posts` | Publicaciones de usuarios en el feed |
| `post_comments` | Comentarios en publicaciones |
| `post_reactions` | Reacciones (👍❤️🎉💡) en publicaciones |
| `events` | Eventos (webinars, encuentros) |
| `event_attendees` | Asistentes confirmados a eventos |
| `event_notification_log` | Registro de notificaciones enviadas por evento |
| `groups` | Grupos/comunidades temáticas |
| `group_members` | Miembros de cada grupo |
| `group_posts` | Publicaciones dentro de grupos |
| `notifications` | Notificaciones del sistema |
| `email_lists` | Listas de correo (gestión administrativa) |

### 3.2 Relaciones Clave
- `users` ↔ `graduates` (1:1) — Cada usuario tiene un perfil de egresado
- `connections` — Relación muchos a muchos entre graduates
- `user_posts` → `post_comments` (1:N) — Un post tiene muchos comentarios
- `events` → `event_attendees` (1:N) — Un evento tiene muchos asistentes
- `groups` → `group_members` (1:N) — Un grupo tiene muchos miembros

---

## 4. Módulos y Funcionalidades

### 4.1 Autenticación y Registro

**Páginas:**
- `/login` — Inicio de sesión (username + contraseña)
- `/register` — Crear cuenta de usuario (username, email, contraseña)
- `/egresados/registro` — Completar perfil de egresado (requiere login previo)

**Flujo de registro:**
1. Usuario crea cuenta en `/register`
2. Se redirige a `/egresados/registro` para completar perfil profesional
3. El perfil incluye: nombre, país, universidad, carrera, año de graduación, profesión actual, empresa, biografía, foto, LinkedIn, habilidades, idiomas, intereses, sitio web

**Seguridad:**
- Contraseñas hasheadas con bcrypt (10 salt rounds)
- Sesiones en cookies HTTP-only
- Redirección automática si no está autenticado

### 4.2 Feed de Actividad

**Límites:**
- **3 publicaciones por día** por usuario
- Comentarios: **10 por día** por usuario
- Longitud de post: mínimo 5, máximo 2000 caracteres
- Longitud de comentario: mínimo 2, máximo 500 caracteres

**Funcionalidades:**
- Crear publicación con texto e imagen opcional (URL)
- Comentarios en publicaciones
- Reacciones: 👍 Me gusta, ❤️ Me encanta, 🎉 Celebrar, 💡 Interesante
- Texto expandible (Leer más / Mostrar menos)
- Vista previa de imágenes

### 4.3 Directorio de Egresados

**Ruta:** `/directorio` (requiere login)

**Filtros disponibles:**
- Búsqueda por nombre, profesión o biografía
- País de residencia
- Universidad
- Carrera
- Rango de año de graduación

**Tarjeta de egresado muestra:**
- Foto o iniciales
- Nombre completo
- Profesión actual
- País y universidad
- Botón "Conectar" con estado visual

### 4.4 Sistema de Conexiones

**Estados de conexión:**
| Estado | Significado |
|--------|-------------|
| `none` | Sin relación |
| `pending-sent` | Enviaste solicitud |
| `pending-received` | Te enviaron solicitud |
| `connected` | Son amigos |

**Página:** `/conexiones`
- **Tab "Solicitudes Recibidas"**: Aceptar o rechazar
- **Tab "Enviadas"**: Ver solicitudes pendientes, cancelar
- **Tab "Amigos"**: Lista de conexiones aceptadas

### 4.5 Perfiles de Egresado

**Ruta:** `/egresados/[id]`

**Visibilidad:**
- **Si es amigo o es su propio perfil**: Ve perfil completo
- **Si no es amigo**: Ve mensaje "Perfil Privado" con opción de conectar

**Contenido del perfil:**
- Banner con gradiente azul
- Foto de perfil (o iniciales)
- Nombre, profesión, empresa
- País, universidad
- Biografía
- Formación en Cuba
- Habilidades, idiomas, intereses
- Información de contacto (email, teléfono, LinkedIn, sitio web)
- Publicaciones del egresado

### 4.6 Eventos

**Ruta:** `/eventos` (requiere login)

**Tipos de evento:**
- 🖥️ Virtual (con enlace Zoom/Meet)
- 📍 Presencial (con ubicación física)

**Funcionalidades:**
- Ver eventos próximos
- RSVP: "Asistiré", "Tal vez"
- Ver lista de asistentes por estado
- Detalle completo en `/eventos/[id]`

**Creación (solo admin):**
- `/admin/events/new` — Formulario completo
- `/admin/events/[id]` — Resumen con lista de asistentes y botón para notificar

### 4.7 Grupos / Comunidades

**Ruta:** `/comunidades` (requiere login)

**Tipos de grupo:**
- 🏛️ Universidad
- 📚 Carrera
- 🌍 País
- 💡 Interés

**Funcionalidades:**
- Crear grupo (cualquier egresado con perfil)
- Unirse / salir de grupos
- Ver detalle del grupo: miembros, posts, descripción
- Publicar dentro del grupo
- Editar grupo (solo creador)

### 4.8 Notificaciones

**Tipos automáticos:**
| Tipo | Trigger |
|------|---------|
| `post_commented` | Alguien comentó tu publicación |
| `connection_accepted` | Alguien aceptó tu solicitud de conexión |

**Notificaciones de eventos (automáticas):**
| Tipo | Cuándo |
|------|--------|
| 3 días antes | 72h antes del evento |
| 15 min antes | 15-10 min antes |
| Al comenzar | 0-5 min después del inicio |
| Al terminar | 1-2h después del inicio |

**UX de notificaciones:**
- Badge rojo con contador en el navbar
- Click para marcar individual como leída
- "Marcar todas leídas" — mantiene el historial visible
- Las no leídas: fondo azul claro, texto negrita, punto azul
- Las leídas: fondo blanco, texto normal
- No se eliminan al marcar, solo cambian de estado

**Auto-refresh:** Cada 30 segundos se actualizan notificaciones y solicitudes pendientes.

### 4.9 Panel de Administración

**Ruta:** `/admin` (solo rol `admin`)

**Secciones:**
| Sección | Ruta | Funcionalidad |
|---------|------|---------------|
| Dashboard | `/admin` | Estadísticas, accesos rápidos |
| Usuarios | `/admin/users` | Listar, cambiar rol, eliminar |
| Noticias | `/admin/posts` | Crear, listar, eliminar noticias |
| Crear Noticia | `/admin/posts/new` | Formulario con imagen |
| Crear Evento | `/admin/events/new` | Formulario completo |
| Detalle Evento | `/admin/events/[id]` | Asistentes, notificar |

---

## 5. Diseño Visual

### 5.1 Paleta de Colores
| Elemento | Color |
|----------|-------|
| Primario | `#003f8f` (Azul MES) |
| Secundario | `#0050b8` |
| Oscuro | `#002860` |
| Fondo | `#f9fafb` (gray-50) |
| Texto | `#111827` (gray-900) |
| Bordes | `#e5e7eb` (gray-200) |

### 5.2 Tipografía
- **Sans:** Geist Sans
- **Mono:** Geist Mono

### 5.3 Componentes Clave
- Navbar blanco con logo de texto
- Tarjetas blancas con bordes grises y sombra suave
- Botones principales: azul MES (`#003f8f`)
- Badges de estado con colores semánticos (verde, amarillo, rojo, morado)

---

## 6. Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Login, register, logout, me
│   │   ├── admin/         # Users, posts, events
│   │   ├── connections/   # Gestión de conexiones
│   │   ├── graduates/     # CRUD de egresados
│   │   ├── posts/         # Posts de usuarios, reacciones
│   │   ├── events/        # Eventos, RSVP, notificaciones
│   │   ├── groups/        # Grupos, miembros, posts
│   │   └── notifications/ # Notificaciones del usuario
│   ├── admin/             # Panel de administración
│   ├── comunidades/       # Lista y detalle de grupos
│   ├── conexiones/        # Gestión de solicitudes
│   ├── directorio/        # Búsqueda de egresados
│   ├── egresados/         # Registro y perfil individual
│   ├── eventos/           # Lista y detalle de eventos
│   ├── login/             # Inicio de sesión
│   ├── register/          # Registro de cuenta
│   ├── layout.tsx         # Layout raíz con AutoRefresh + Navbar
│   └── page.tsx           # Home (púbico vs logueado)
├── components/
│   ├── AdminPostCard.tsx  # Tarjeta de noticia del admin
│   ├── AutoRefresh.tsx    # Refresco automático cada 60s
│   ├── ConnectButton.tsx  # Botón de conectar (cliente)
│   ├── CreatePost.tsx     # Formulario crear post
│   ├── GraduateCard.tsx   # Tarjeta de egresado en directorio
│   ├── Navbar.tsx         # Barra de navegación principal
│   ├── PostComments.tsx   # Sección de comentarios
│   └── UserPostCard.tsx   # Tarjeta de post de usuario
├── db/
│   ├── migrations/        # Migraciones SQL
│   ├── index.ts           # Configuración de DB
│   └── schema.ts          # Definición de tablas
├── lib/
│   ├── auth.ts            # Hash y verificación de contraseñas
│   ├── event-notifications.ts # Notificaciones automáticas
│   ├── notifications.ts   # Función crear notificación
│   └── session.ts         # Gestión de sesiones
└── scripts/
    ├── migrate.cjs        # Ejecutor de migraciones
    └── create-admin-fixed.cjs # Script para crear admin
```

---

## 7. API Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Crear cuenta |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Obtener usuario actual |

### Conexiones
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/connections` | Solicitudes y conteo pendiente |
| GET | `/api/connections?check=X` | Verificar estado con egresado |
| POST | `/api/connections` | Enviar solicitud |
| PUT | `/api/connections` | Aceptar/rechazar solicitud |
| DELETE | `/api/connections?id=X` | Cancelar solicitud enviada |

### Posts
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/posts` | Feed de posts |
| POST | `/api/posts` | Crear post (límite 3/día) |
| DELETE | `/api/posts?id=X` | Eliminar post propio |
| GET | `/api/posts/limit` | Verificar límite diario |

### Comentarios
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/posts/[id]/comments` | Comentarios de un post |
| POST | `/api/posts/[id]/comments` | Crear comentario |
| DELETE | `/api/posts/[id]/comments?commentId=X` | Eliminar comentario |

### Eventos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/events` | Lista de eventos |
| GET | `/api/events?upcoming=true` | Solo próximos |
| GET | `/api/events?id=X` | Detalle con asistentes |
| POST | `/api/events` | Crear evento (admin) |
| PUT | `/api/events` | RSVP (attending/maybe/declined) |
| POST | `/api/events/[id]/notify` | Notificar asistentes |

### Grupos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/groups` | Lista de grupos |
| POST | `/api/groups` | Crear grupo |
| PATCH | `/api/groups` | Editar grupo (creador) |
| DELETE | `/api/groups?id=X` | Eliminar grupo (creador) |
| PUT | `/api/groups` | Unirse/salir |
| GET | `/api/groups/[id]/posts` | Posts del grupo |
| POST | `/api/groups/[id]/posts` | Publicar en grupo |

### Notificaciones
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/notifications` | Todas las notificaciones |
| PUT | `/api/notifications` | Marcar como leída(s) |
| DELETE | `/api/notifications?id=X` | Eliminar notificación |

---

## 8. Roles y Permisos

| Acción | Público | Usuario | Admin |
|--------|---------|---------|-------|
| Ver home público | ✅ | ✅ | ✅ |
| Ver directorio | ❌ | ✅ | ✅ |
| Crear post | ❌ | ✅ | ✅ |
| Comentar | ❌ | ✅ | ✅ |
| Enviar conexión | ❌ | ✅ | ✅ |
| Ver perfil de amigo | ❌ | ✅ | ✅ |
| Crear grupo | ❌ | ✅ | ✅ |
| Unirse a grupo | ❌ | ✅ | ✅ |
| Crear noticia | ❌ | ❌ | ✅ |
| Crear evento | ❌ | ❌ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ |
| Ver panel admin | ❌ | ❌ | ✅ |

---

## 9. Credenciales de Acceso

### Administrador por defecto
| Campo | Valor |
|-------|-------|
| Username | `dinfo` |
| Email | `dinfo@mes.gob.cu` |
| Contraseña | `<configurar fuera del repositorio>` |

---

## 10. Scripts de Utilidad

| Script | Comando | Descripción |
|--------|---------|-------------|
| Migración | `node scripts/migrate.cjs` | Ejecuta migraciones pendientes |
| Crear admin | `node scripts/create-admin-fixed.cjs` | Crea usuario administrador |
| Dev server | `bun run dev` | Inicia servidor de desarrollo |
| Build | `bun run build` | Compilación para producción |
| Start | `bun run start` | Inicia servidor de producción |
