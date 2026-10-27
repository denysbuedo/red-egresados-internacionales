# Identidad CONECTA

Aplicación de la identidad suministrada en `diseño/` el 26 de octubre de 2026.

- Nombre: CONECTA. Ecosistema digital de la educación superior cubana.
- Lema: «Conecta conocimiento. Impulsa innovación.»
- Logos SVG originales sin modificar, isotipo, favicon e imagen social en `public/brand/`.
- Paleta del manual: azul #102B46, fondo oscuro #0C1D30 y acento #49DCCB. Tokens originales en `src/app/brand-tokens.css`.
- Inter e IBM Plex Mono descargadas durante la compilación y servidas localmente por Next.js; el navegador no depende de Google Fonts.
- Portada adaptada de la demostración, acceso, navegación, formularios y paleta de las áreas privadas. Diseño adaptable y foco visible de teclado.
- Rutas de ayuda y privacidad con información del funcionamiento real. Ciencia, proyectos y oportunidades enlazan a aportes filtrados. Integración de repositorios marcada «Próximamente».

Se conserva el acceso para trabajadores del MES y sus instituciones, la revisión institucional y la exclusión inicial de estudiantes. No se modifican cuentas, contraseñas, aprobaciones, datos ni esquema SQLite. Las siete cuentas históricas conservan su estado hasta una decisión expresa del operador.

## Validación y operación

Comprobación local: TypeScript, lint sin errores, compilación de producción, siete pruebas unitarias y catorce HTTP. Navegador Chrome real con cuenta efímera sobre base aislada: inicio de sesión, panel, menú móvil y portada a 320, 390 y 768 píxeles. Capturas de escritorio y móvil revisadas.

Respaldo de producción: `/var/backups/red-egresados/pre-conecta-brand-20261026`, archivo de fuentes y SQLite verificados por SHA-256. El despliegue utiliza una compilación Linux validada, conserva la base real y permite restaurar la compilación anterior. No requiere migraciones.

## Publicación verificada

Implementación `98c36c5` publicada en GitHub y VM. Compilación y 21 pruebas correctas en Linux; 156 archivos de ejecución y recursos coinciden con el manifiesto validado. Comprobada la navegación institucional con nombre largo a 1280 píxeles.

Servicio activo, sin reinicios inesperados. Portada pública HTTPS 200 en https://conecta.reduniv.edu.cu/. Páginas de acceso, registro, ayuda, privacidad y recursos de marca responden 200. Administrador existente autenticado y sesión revocada al salir; API de miembros rechaza acceso anónimo.

Snapshot adicional `pre-cutover.db`: todos los valores de las 19 tablas conservados. Continúan 8 cuentas, 7 perfiles, 5 aportes, 8 noticias y 8 conexiones. No se sustituyó la base real ni se crearon cuentas de prueba en producción. Compilación anterior preservada en `previous-next` dentro del respaldo. DNS, TLS y HAProxy conservan su configuración.

## Espacio de trabajo después de entrar

Inicio privado rediseñado con la misma identidad: cabecera personal, cifras de miembros aprobados y aportes reales; accesos a personas, ciencia, proyectos y convocatorias; perfil propio y accesos según rol. Formulario de aporte desplegable y actividad central con filtros. Columna de descubrimiento con hasta tres perfiles aprobados, tres próximos eventos y tres noticias institucionales, priorizando las destacadas. Sin contactos privados en los resúmenes ni datos ficticios.

Diseño comprobado entre 320 y 1440 píxeles con estados vacíos y contenido. Navegador real: entrar, desplegar formulario, publicar y filtrar aportes. Se conserva la portada pública y el esquema de datos. Prueba HTTP adicional cubre eventos futuros, acceso aprobado y ausencia de información privada en los resúmenes.

Interior publicado como `aa76efb`: 22 pruebas y compilación Linux correctas, 156 archivos de ejecución verificados. Inicio autenticado 200, acceso administrador y logout verificados en producción; portada pública HTTPS conservada. Todas las filas de las 19 tablas se conservaron al cambiar la compilación. Respaldo específico: `/var/backups/red-egresados/pre-conecta-workspace-20261026`.
