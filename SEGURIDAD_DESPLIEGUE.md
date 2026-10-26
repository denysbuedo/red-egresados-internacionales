# Seguridad y operación del despliegue

## Cambios del 25 de octubre de 2026

- Las sesiones usan tokens aleatorios de 256 bits. SQLite conserva únicamente su SHA-256 y la caducidad de 24 horas. No se confía en userId, rol ni fechas proporcionados por una cookie.
- La cookie de producción es __Host-session, Secure, HttpOnly, SameSite=Lax y Path=/. Las cookies anteriores dejan de autenticar; todos deben iniciar sesión de nuevo. Cerrar sesión revoca el token en el servidor. Rechazar una solicitud revoca sus sesiones.
- Las API de negocio exigen cuenta aprobada. Las operaciones que modifican datos, incluyendo login y logout, verifican Origin contra Host. Los clientes HTTP deben enviar el origen correcto.
- Listas de correo y administración de cuentas: solo administradores. Noticias y creación/notificaciones de eventos: administradores o editores. Las instituciones solo pueden resolver solicitudes pendientes de su universidad y no pueden modificar cuentas privilegiadas.
- Un usuario no puede modificar perfiles ni cancelar conexiones ajenas. Los listados de egresados ocultan contactos y solicitudes pendientes, con un máximo de 100 perfiles por petición.
- Se implementaron register-complete, la creación transaccional de cuenta/perfil, la página /pendiente con consulta de estado y el panel /universidad. El registro no acepta privilegios aportados por el cliente. Contraseñas nuevas: mínimo 12 caracteres y máximo 72 bytes.
- Login limitado a 10 intentos por identificador en 15 minutos y 200 por IP en ese intervalo. Registro limitado a 20 por IP/hora. Los límites sobreviven a reinicios. Nginx debe establecer X-Real-IP; cuando hay un frontal compartido, revisar la atribución de IP antes de una apertura masiva.
- Se retiraron la contraseña de ejemplo de los documentos actuales y el script que sobrescribía el administrador. La historia de Git sigue conteniendo esa contraseña, por lo que se debe rotar la cuenta que aún la utilice.

## Dependencias

Next.js 16.4.3, React/React DOM 19.3.1 y Node 22.23.4. Las versiones de Next y React quedan fijadas en package.json y package-lock.json. Se retiró bun.lock para evitar dos instalaciones con parches diferentes; npm ci es el procedimiento canónico.

La actualización responde, entre otros, a los avisos oficiales [GHSA-2464-fhr4-w9xw](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw) y [GHSA-673q-mjm6-r5xr](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr). No se presupone que todas sus condiciones de explotación estén presentes en esta aplicación.

`npm audit --omit=dev` no detecta vulnerabilidades conocidas en el lock actualizado. La auditoría completa mantiene cuatro avisos moderados en la cadena de esbuild/drizzle-kit utilizada para desarrollo; no se aplicó el downgrade incompatible sugerido por npm audit --force. No ejecutar servidores de desarrollo en producción.

Las nuevas comprobaciones de React requirieron ordenar los handlers antes de sus efectos. El diagnóstico de rendimiento react-hooks/set-state-in-effect sigue activo como advertencia durante la migración de los componentes existentes. Lint: 0 errores y 44 advertencias; no equivale a eliminar toda la deuda de interfaz.

## Servicio y datos

La unidad reproducible está en deploy/red-egresados.service. Ejecuta Next bajo el usuario de sistema red-egresados, con escucha en 127.0.0.1:3000, reinicio automático y restricciones de systemd. El runtime está en /opt/red-egresados/node y la base de producción en /var/lib/red-egresados/dev.db, separada del código propiedad de root.

DATABASE_PATH se define en la configuración privada de la VM. Los scripts CJS cargan .env sin reemplazar una variable ya exportada. Antes de cualquier operación manual, verificar el destino y respaldar la base real. No ejecutar PM2 y systemd simultáneamente; la unidad systemd sustituye el arranque previsto anteriormente con PM2.

```bash
systemctl status red-egresados --no-pager
journalctl -u red-egresados -n 50 --no-pager
```

El respaldo previo a esta etapa está en /var/backups/red-egresados/pre-security-20261025: fuentes y .git, configuración Nginx, copias consistentes de SQLite y SHA-256 verificados. La rotación de la contraseña publicada debe conservar la nueva credencial únicamente en credenciales-rotadas.json dentro de ese directorio, con permisos 0600 y directorio 0700. No copiarla al repositorio ni al chat.

## Pruebas

```bash
npm ci
npm run typecheck
npm run lint
npm test
DATABASE_PATH=/ruta/a/copia.db npm run db:migrate
DATABASE_PATH=/ruta/a/copia.db npm run build
npm run test:http
```

Las pruebas HTTP crean su propia base y un servidor temporal en loopback. Cubren cookies manipuladas/antiguas, CSRF, registro sin privilegios, rollback del registro, espera, aprobación y rechazo, aislamiento institucional, propiedad de perfiles/conexiones, restricciones de listas de correo, editores, expiración, revocación y límites de login. No usan cuentas ni datos reales.

## Publicación

El dominio previsto sigue siendo conecta.reduniv.edu.cu. La configuración DNS, el certificado, el encaminamiento HTTPS en HAProxy y la comprobación desde internet constituyen la siguiente etapa. Las cookies de producción requieren HTTPS; una prueba directa por HTTP interno valida el backend, pero no proporciona una sesión de navegador utilizable desde ese origen.

Validación aislada completada: Node 22.23.4 en Linux, instalación limpia con npm ci,
auditoría de producción sin hallazgos, typecheck, build, seis pruebas unitarias y
ocho pruebas HTTP correctas. La migración repetida conservó los registros de las
17 tablas existentes, añadiendo únicamente su entrada al journal de migraciones.

## Resultado operativo verificado

El código de esta etapa se publicó como `5c37255` y se aplicó a la VM por
fast-forward, con reinstalación desde package-lock.json y build en el directorio
real. La unidad systemd está habilitada y activa bajo red-egresados; Next escucha
únicamente en 127.0.0.1:3000. Nginx responde 200 en inicio, login y registro.

Se verificó en el servicio real que las API privadas responden 401 sin sesión,
que la contraseña histórica del administrador es rechazada, que la nueva permite
acceder y que logout invalida el token. También se comprobó el rechazo de un
Origin ajeno. La prueba no imprimió contraseñas, cookies ni respuestas con datos
personales. No se crearon usuarios de prueba en producción.

La nueva contraseña está únicamente en:
`/var/backups/red-egresados/pre-security-20261025/credenciales-rotadas.json`.
El operador autorizado puede consultarla personalmente con sudo en la VM. El
archivo tiene permisos 0600, su directorio 0700 y el servicio no puede leerlo.
No publicarla en el chat ni copiarla a Git. Solo se rotó la cuenta que todavía
utilizaba la credencial expuesta; las otras siete contraseñas se conservaron.

Los 8 usuarios, 7 perfiles y demás registros de negocio se conservaron. Se
verificaron todas las columnas originales, exceptuando el cambio intencional de
password_hash/updated_at de la cuenta rotada y la entrada nueva del journal de
migraciones. integrity_check y foreign_key_check son correctos. El archivo dev.db
que antes estaba dentro del checkout se conserva en el respaldo como
working-tree-dev.db; la copia operativa actual es /var/lib/red-egresados/dev.db.

No se modificaron DNS, HAProxy ni certificados del dominio nuevo. La validación
de HTTPS y del recorrido desde internet sigue pendiente de esa configuración.
