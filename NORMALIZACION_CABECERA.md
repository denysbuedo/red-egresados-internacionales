# Cabecera CONECTA · Geometría RedUniv

Cambio limitado a CONECTA. Opciones, destinos y acciones del menú conservados.

- Fondo blanco y texto/iconos azul #102B46.
- Contenido máximo útil 1280 px; márgenes mínimos 24 px escritorio, 16 px móvil.
- Fila de 72 px escritorio y 64 px móvil (corte 768 px), logo de 36/32 px centrado verticalmente y navegación a la derecha.
- Variante pública SVG conecta-logo-cabecera.svg: mismas formas y colores, viewBox ajustado a 14.5 15 468.75 79.75 para retirar el margen transparente. Otras aplicaciones del logo conservadas.
- Contenedor centrado respecto al viewport, compensando el espacio reservado por scrollbar-gutter:stable. Evita un desplazamiento de 7,5 px cuando el navegador reserva 15 px.

## Validación local

Compilación/TypeScript y ESLint sin errores (dos advertencias anteriores en Navbar). Chrome, zoom 100 %, deviceScaleFactor=1, 1440 y 390 px: 16 vistas entre portada, acceso y páginas autenticadas (inicio, comunidades, eventos, directorio, conexiones, noticias); sin desbordamiento ni errores JavaScript. Apertura/navegación del menú móvil verificada.

Medidas: a 1440 px, contenedor X=80–1360, fila 72 px y logo 36 px; a 390 px, X=16–374, fila 64 px y logo 32 px. Símbolo visible alineado con el borde, tolerancia del viewBox inferior a 0,2 px.

El operador indica expresamente no comparar con CONVOCA/APRENDE. Validación limitada a CONECTA; no se modifican esos proyectos ni demos. Evidencia local en el directorio temporal conecta-header-20261030 (report.json y capturas).


## Despliegue

Implementación 3eae9fd. Build Linux correcto y cinco archivos de ejecución coincidentes por SHA256 con la versión validada. Respaldo previo de código/base de datos en /var/backups/red-egresados/pre-header-20261030; compilación anterior conservada. Sin migraciones ni modificaciones de contenido/configuración privada. Servicio principal activo sin reinicios automáticos y timer de notificaciones reactivado.

Comprobación HTTPS en producción: medidas correctas en las mismas 16 vistas a1440/390px y navegación móvil funcional. Se observaron avisos React418 de hidratación de texto en contenido existente; la validación local con datos aislados no los reproduce. No afectan las medidas verificadas de la cabecera; se documentan separadamente del cambio visual.
