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

Comparación entre marcas pendiente: los nombres probados convoca.reduniv.edu.cu y aprende.reduniv.edu.cu no resuelven en DNS desde el equipo. Se han solicitado sus URL; no se modifican esos proyectos ni demos. Evidencia local en el directorio temporal conecta-header-20261030 (report.json y capturas).
