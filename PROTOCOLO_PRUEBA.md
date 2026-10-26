# Protocolo de Prueba — Red de Egresados Internacionales

## Instrucciones Generales

| Campo | Valor |
|-------|-------|
| **Fecha de prueba** | ____/____/________ |
| **Ejecutado por** | ________________________ |
| **Entorno** | Desarrollo (localhost:3000) |
| **Navegador** | Chrome / Firefox / Edge |
| **Resultado general** | ☐ Aprobado ☐ Rechazado ☐ Con observaciones |

### Cómo usar este protocolo
- Cada prueba tiene un **Paso a paso** que debes seguir en orden
- Registra el **Resultado** como ✅ (Pasa) o ❌ (Falla)
- Si falla, documenta el **comportamiento observado** en Observaciones
- No saltes pruebas; algunas dependen de resultados anteriores

---

## 1. Preparación del Entorno

### TC-001: Iniciar servidor de desarrollo
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Ejecutar `bun run dev` | El servidor inicia sin errores | |
| 2 | Abrir `http://localhost:3000` | La página carga con código 200 | |

**Observaciones:** _______________________________________________

### TC-002: Ejecutar migraciones pendientes
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Ejecutar `node scripts/migrate.cjs` | Muestra "✅ Migración ejecutada correctamente!" | |
| 2 | Verificar lista de tablas | Incluye todas las tablas del schema | |

**Observaciones:** _______________________________________________

---

## 2. Autenticación

### TC-010: Crear cuenta de usuario
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Ir a `/register` | Formulario con fondo blanco, campos grises | |
| 2 | Llenar username, email, contraseña, confirmar | Campos aceptan texto | |
| 3 | Click "Crear Cuenta" | Cuenta creada, redirige a `/egresados/registro` | |
| 4 | Probar email duplicado | Muestra error "email ya registrado" | |
| 5 | Probar contraseñas diferentes | Muestra error "Las contraseñas no coinciden" | |
| 6 | Probar contraseña < 6 caracteres | Muestra error correspondiente | |

**Observaciones:** _______________________________________________

### TC-011: Iniciar sesión
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Ir a `/login` | Formulario con fondo blanco | |
| 2 | Ingresar credenciales válidas | Login exitoso, redirige a `/` | |
| 3 | Verificar Navbar | Muestra avatar + username + botón logout | |
| 4 | Recargar página | Mantiene sesión activa | |
| 5 | Ingresar credenciales inválidas | Muestra "Credenciales inválidas" | |

**Observaciones:** _______________________________________________

### TC-012: Cerrar sesión
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Estando logueado, abrir menú de usuario | Dropdown con opciones | |
| 2 | Click en "Cerrar Sesión" | Sesión cerrada, Navbar muestra Login/Registro | |
| 3 | Intentar acceder a `/directorio` | Redirige a `/login` | |

**Observaciones:** _______________________________________________

### TC-013: Login de administrador
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Login con `dinfo` / `<configurar fuera del repositorio>` | Login exitoso | |
| 2 | Abrir menú de usuario | Muestra opción "🛡️ Panel Admin" | |
| 3 | Click en Panel Admin | Accede a `/admin` | |

**Observaciones:** _______________________________________________

---

## 3. Perfil de Egresado

### TC-020: Completar perfil de egresado
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Tras registro, estar en `/egresados/registro` | Formulario con fondo blanco | |
| 2 | Llenar todos los campos requeridos | Campos aceptan texto | |
| 3 | Click "Completar Registro" | Crea perfil, redirige a `/egresados/[id]` | |
| 4 | Verificar perfil | Muestra todos los datos ingresados | |
| 5 | Intentar registrar segundo perfil | Muestra "Ya tienes un perfil registrado" | |

**Observaciones:** _______________________________________________

### TC-021: Ver perfil propio
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Estando logueado, click "Mi Perfil" en Navbar | Navega a `/egresados/[mi-id]` | |
| 2 | Verificar que NO va a `/egresados/registro` | Correcto | |

**Observaciones:** _______________________________________________

### TC-022: Ver perfil de amigo (acceso completo)
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Conectar con otro egresado y que acepte | Estado "Conectado" | |
| 2 | Ir al perfil del amigo | Ve perfil completo con todos los datos | |
| 3 | Ver sección de publicaciones | Muestra posts del amigo | |

**Observaciones:** _______________________________________________

### TC-023: Ver perfil de no-amigo (acceso restringido)
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Buscar egresado no conectado en directorio | | |
| 2 | Click en su perfil | Muestra "Perfil Privado" | |
| 3 | Ver opción de conectar | Botón "Enviar Solicitud" visible | |

**Observaciones:** _______________________________________________

---

## 4. Directorio

### TC-030: Acceso al directorio
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Sin login, intentar `/directorio` | Redirige a `/login` | |
| 2 | Con login, ir a `/directorio` | Muestra lista de egresados | |

**Observaciones:** _______________________________________________

### TC-031: Búsqueda en directorio
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Escribir en campo de búsqueda | Filtra por nombre, profesión o bio | |
| 2 | Seleccionar país | Filtra por país | |
| 3 | Seleccionar universidad | Filtra por universidad | |
| 4 | Combinar múltiples filtros | Aplica todos los filtros | |
| 5 | Click "Limpiar filtros" | Resetea todos los filtros | |

**Observaciones:** _______________________________________________

### TC-032: Tarjeta de egresado en directorio
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Ver tarjeta de egresado | Foto, nombre, profesión, país, universidad | |
| 2 | Click en nombre/foto | Navega al perfil del egresado | |
| 3 | Ver botón "Conectar" | Visible con estado correcto | |

**Observaciones:** _______________________________________________

---

## 5. Sistema de Conexiones

### TC-040: Enviar solicitud de conexión
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | En directorio, click "Conectar" | Envía solicitud | |
| 2 | Verificar estado del botón | Cambia a "Solicitud enviada" (amarillo) | |
| 3 | Intentar enviar segunda solicitud | Muestra error "Ya has enviado solicitud" | |

**Observaciones:** _______________________________________________

### TC-041: Recibir y responder solicitudes
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Usuario B ve badge rojo en "Conexiones" | Badge con número de pendientes | |
| 2 | Ir a `/conexiones`, tab "Solicitudes Recibidas" | Lista de solicitudes pendientes | |
| 3 | Click "Aceptar" | Conexión aceptada, contador actualizado | |
| 4 | Ver tab "Amigos" | El amigo aparece en la lista | |
| 5 | Ver que el emisor NO aparece en su propia lista | Correcto | |

**Observaciones:** _______________________________________________

### TC-042: Rechazar solicitud
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Click "Rechazar" en solicitud | Solicitud eliminada de la lista | |
| 2 | Verificar que no aparece en amigos | Correcto | |

**Observaciones:** _______________________________________________

### TC-043: Cancelar solicitud enviada
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Ir a tab "Enviadas" | Lista de solicitudes enviadas | |
| 2 | Click "Cancelar" | Solicitud eliminada | |
| 3 | Botón "Conectar" vuelve a estar disponible | Correcto | |

**Observaciones:** _______________________________________________

---

## 6. Feed de Actividad

### TC-050: Crear publicación
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | En home logueado, ver "Crear Publicación" | Formulario visible | |
| 2 | Ver barra de progreso diario | Muestra "X de 3 publicaciones hoy" | |
| 3 | Escribir texto (mínimo 5 chars) | Contador de caracteres visible | |
| 4 | Click "Publicar" | Publicación aparece en el feed | |
| 5 | Verificar que contador incrementa | "1 de 3 publicaciones hoy" | |

**Observaciones:** _______________________________________________

### TC-051: Límite diario de publicaciones
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Publicar 3 veces en el mismo día | Todas se crean | |
| 2 | Intentar cuarta publicación | Error "Has alcanzado el límite de 3 publicaciones" | |
| 3 | Barra de progreso en rojo | Indica 100% usado | |

**Observaciones:** _______________________________________________

### TC-052: Publicación con imagen
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Click "Agregar imagen" | Campo URL visible | |
| 2 | Pegar URL de imagen válida | Vista previa aparece | |
| 3 | Publicar | Imagen visible en el post | |
| 4 | Verificar tratamiento de imagen | object-contain, sin recorte | |

**Observaciones:** _______________________________________________

### TC-053: Texto expandible (Leer más)
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Crear post con >500 caracteres | Texto truncado con "Leer más" | |
| 2 | Click "Leer más" | Expande texto completo | |
| 3 | Click "Mostrar menos" | Vuelve a versión truncada | |
| 4 | Post corto (<500 chars) | No muestra botón "Leer más" | |

**Observaciones:** _______________________________________________

### TC-054: Comentar en publicación
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Click en número de "Comentarios" | Se expande sección | |
| 2 | Escribir comentario (mínimo 2 chars) | | |
| 3 | Click "Comentar" | Comentario aparece | |
| 4 | Autor del post recibe notificación | Badge de notificación incrementa | |
| 5 | Verificar límite de 10 comentarios/día | Error al exceder | |

**Observaciones:** _______________________________________________

### TC-055: Eliminar comentario propio
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Ver comentario propio | Botón "Eliminar" visible | |
| 2 | Click "Eliminar" | Comentario desaparece | |
| 3 | Contador de comentarios decrementa | Correcto | |

**Observaciones:** _______________________________________________

---

## 7. Eventos

### TC-060: Ver lista de eventos
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Ir a `/eventos` (logueado) | Lista de eventos próximos | |
| 2 | Ver tarjeta de evento | Tipo, título, descripción, fecha | |
| 3 | Click en título | Navega a `/eventos/[id]` | |

**Observaciones:** _______________________________________________

### TC-061: Detalle de evento
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | En `/eventos/[id]` | Info completa del evento | |
| 2 | Ver asistentes | Lista con estados (✓/🤔/✗) | |
| 3 | Evento virtual → botón de enlace | Abre URL en nueva pestaña | |
| 4 | Evento presencial → muestra ubicación | Dirección visible | |

**Observaciones:** _______________________________________________

### TC-062: RSVP a evento
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Click "✓ Asistiré" | Contador incrementa | |
| 2 | Click "🤔 Tal vez" | Se mueve a categoría tal vez | |
| 3 | Verificar que no aparece en lista de no-asistentes | Correcto | |

**Observaciones:** _______________________________________________

### TC-063: Admin crear evento
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Ir a `/admin/events/new` | Formulario visible | |
| 2 | Llenar título, descripción, fecha, tipo | | |
| 3 | Seleccionar "Virtual" → campo enlace visible | | |
| 4 | Seleccionar "Presencial" → campo ubicación visible | | |
| 5 | Click "Crear Evento" | Redirige a `/eventos` | |
| 6 | Ver evento creado en lista | Correcto | |

**Observaciones:** _______________________________________________

### TC-064: Admin ver resumen de evento
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Ir a `/admin/events/[id]` | Resumen completo | |
| 2 | Ver contadores: Asistirán / Tal vez / No asistirán | Números correctos | |
| 3 | Filtrar por estado | Lista se actualiza | |
| 4 | Ver lista de asistentes con nombres y profesiones | Correcto | |
| 5 | Click "🔔 Notificar asistentes" | Notificaciones enviadas | |

**Observaciones:** _______________________________________________

---

## 8. Grupos / Comunidades

### TC-070: Ver lista de comunidades
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Ir a `/comunidades` | Lista de grupos o mensaje vacío | |
| 2 | Ver filtros por tipo | Todos, Universidad, Carrera, País, Interés | |
| 3 | Filtrar por tipo | Lista se actualiza | |

**Observaciones:** _______________________________________________

### TC-071: Crear grupo
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Click "+ Crear Grupo" | Formulario visible | |
| 2 | Llenar nombre, descripción, tipo | | |
| 3 | Click "Crear Grupo" | Grupo creado, aparece en lista | |
| 4 | Creador aparece automáticamente como miembro | Correcto | |

**Observaciones:** _______________________________________________

### TC-072: Unirse y salir de grupo
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Click "Unirse" en tarjeta de grupo | Miembro añadido | |
| 2 | Click en grupo → ver detalle | Info completa + miembros + posts | |
| 3 | Click "Salir del grupo" | Confirmación, luego sale | |

**Observaciones:** _______________________________________________

### TC-073: Publicar en grupo
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Estando dentro del grupo | Formulario para publicar visible | |
| 2 | Escribir y publicar | Post aparece en el feed del grupo | |
| 3 | Sin ser miembro | No puede publicar | |

**Observaciones:** _______________________________________________

### TC-074: Editar grupo (solo creador)
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Siendo creador, click ícono ✏️ | Formulario de edición visible | |
| 2 | Cambiar nombre y guardar | Nombre actualizado | |
| 3 | Siendo no-creador, intentar editar | No tiene acceso al botón | |

**Observaciones:** _______________________________________________

---

## 9. Notificaciones

### TC-080: Recibir notificaciones
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Usuario A comenta post de Usuario B | B recibe notificación | |
| 2 | Usuario A acepta conexión de B | A recibe notificación | |
| 3 | Ver badge rojo en campana del Navbar | Contador visible | |

**Observaciones:** _______________________________________________

### TC-081: Ver y gestionar notificaciones
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Click en campana | Dropdown con lista de notificaciones | |
| 2 | Ver notificaciones no leídas | Fondo azul, texto negrita, punto azul | |
| 3 | Ver notificaciones leídas | Fondo blanco, texto normal | |
| 4 | Click en notificación no leída | Marca como leída + navega al enlace | |
| 5 | Click en ✓ para marcar leída | Cambia a estado leído | |
| 6 | Click "Marcar todas leídas" | Todas cambian a leídas pero permanecen | |
| 7 | Verificar que NO desaparecen | Correcto, se mantienen visibles | |

**Observaciones:** _______________________________________________

### TC-082: Notificaciones de eventos automáticas
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Crear evento a 3 días con asistentes | | |
| 2 | Recargar página cualquier usuario | Sistema verifica y envía notificación | |
| 3 | Asistente recibe "📅 En 3 días: [evento]" | Correcto | |
| 4 | No envía duplicada al recargar | Correcto | |

**Observaciones:** _______________________________________________

---

## 10. Panel de Administración

### TC-090: Dashboard admin
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Ir a `/admin` | Dashboard con estadísticas | |
| 2 | Ver contadores: Usuarios, Egresados, Noticias, Conexiones | Números correctos | |
| 3 | Ver usuarios recientes y egresados recientes | Listas visibles | |
| 4 | Ver accesos rápidos | Directorio, Conexiones, Mi Perfil, Panel Admin | |

**Observaciones:** _______________________________________________

### TC-091: Gestión de usuarios
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Ir a `/admin/users` | Lista de usuarios | |
| 2 | Buscar por username/email | Filtra correctamente | |
| 3 | Filtrar por rol | Muestra solo ese rol | |
| 4 | Click en rol de usuario para editar | Dropdown aparece (Usuario/Admin) | |
| 5 | Cambiar rol de Usuario a Admin | Rol actualizado | |
| 6 | Eliminar usuario (no propio) | Confirmación, luego eliminado | |
| 7 | Intentar eliminarse a sí mismo | Error "No puedes eliminar tu propia cuenta" | |

**Observaciones:** _______________________________________________

### TC-092: Gestión de noticias
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Ir a `/admin/posts` | Lista de noticias | |
| 2 | Ir a `/admin/posts/new` | Formulario para crear noticia | |
| 3 | Crear noticia con título, contenido, imagen | Publicada | |
| 4 | Ver en home de usuarios logueados | Noticia aparece en feed | |
| 5 | Eliminar noticia desde lista | Confirmación, luego eliminada | |

**Observaciones:** _______________________________________________

### TC-093: Gestión de eventos (admin)
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Ir a `/admin/events/new` | Formulario de evento | |
| 2 | Crear evento virtual con enlace | Evento creado | |
| 3 | Ir a `/admin/events/[id]` | Resumen con asistentes | |
| 4 | Ver filtros de asistentes | Todos / Asistirán / Tal vez / No | |
| 5 | Click "Notificar asistentes" | Notificaciones enviadas | |

**Observaciones:** _______________________________________________

---

## 11. Auto-Refresh

### TC-100: Refresco automático
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Abrir home como usuario logueado | Página carga normal | |
| 2 | Esperar 30 segundos | Notificaciones y badge se actualizan | |
| 3 | Esperar 60 segundos | Página completa se refresca | |
| 4 | Otro usuario crea un post | Aparece en mi feed sin recarga manual | |

**Observaciones:** _______________________________________________

---

## 12. Diseño Visual

### TC-110: Tema y colores
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Ver Navbar | Fondo blanco, texto azul `#003f8f` | |
| 2 | Ver página de login/registro | Fondo blanco, no negro | |
| 3 | Ver página de registro de egresado | Fondo blanco, campos grises | |
| 4 | Ver home público | Gradiente azul MES | |
| 5 | Ver tarjetas | Fondo blanco, bordes grises | |

**Observaciones:** _______________________________________________

---

## 13. Acceso Restringido

### TC-120: Rutas protegidas
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Sin login, ir a `/directorio` | Redirige a `/login` | |
| 2 | Sin login, ir a `/conexiones` | Redirige a `/login` | |
| 3 | Sin login, ir a `/eventos` | Redirige a `/login` | |
| 4 | Sin login, ir a `/comunidades` | Redirige a `/login` | |
| 5 | Sin login, ir a `/admin` | Redirige a `/` | |
| 6 | Usuario normal intenta ir a `/admin` | Redirige a `/` | |
| 7 | Usuario normal intenta crear evento | Error 403 | |

**Observaciones:** _______________________________________________

---

## 14. Escenario Completo (E2E)

### TC-130: Flujo completo de un usuario nuevo
| Paso | Acción | Resultado esperado | ✅/❌ |
|------|--------|-------------------|------|
| 1 | Crear cuenta en `/register` | Cuenta creada | |
| 2 | Completar perfil en `/egresados/registro` | Perfil creado | |
| 3 | Ver home logueado | Feed, sidebar con stats y accesos | |
| 4 | Buscar egresados en `/directorio` | Lista visible | |
| 5 | Enviar solicitud de conexión a 2 personas | 2 solicitudes enviadas | |
| 6 | Crear publicación en feed | Post aparece | |
| 7 | Unirse a un grupo en `/comunidades` | Miembro del grupo | |
| 8 | Publicar dentro del grupo | Post del grupo visible | |
| 9 | Verificar notificaciones | Campana muestra badge si hay actividad | |
| 10 | Ir a `/eventos`, confirmar asistencia | RSVP registrado | |

**Observaciones:** _______________________________________________

---

## Resumen de Resultados

| Sección | Total Pruebas | ✅ Pasan | ❌ Fallan |
|---------|--------------|---------|----------|
| Preparación | 2 | | |
| Autenticación | 4 | | |
| Perfil | 4 | | |
| Directorio | 3 | | |
| Conexiones | 4 | | |
| Feed | 6 | | |
| Eventos | 5 | | |
| Grupos | 5 | | |
| Notificaciones | 3 | | |
| Panel Admin | 4 | | |
| Auto-Refresh | 1 | | |
| Diseño | 1 | | |
| Acceso Restringido | 1 | | |
| E2E | 1 | | |
| **TOTAL** | **44** | | |

### Observaciones Generales

_______________________________________________________________

_______________________________________________________________

_______________________________________________________________

_______________________________________________________________

### ¿Aprobado para producción?

☐ **SÍ** — Todas las pruebas pasan
☐ **NO** — Hay fallas que deben resolverse
☐ **CON OBSERVACIONES** — Ver detalles arriba

**Firma:** ________________________ **Fecha:** ____/____/________
