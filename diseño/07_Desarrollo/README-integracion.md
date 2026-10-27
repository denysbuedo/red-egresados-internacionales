# Integrar CONECTA en una aplicación web

1. Copiar `02_Colores/tokens.css` y `03_Tipografia/fuentes-web.css` a los estilos del proyecto.
2. Elegir el SVG apropiado de `01_Logotipos/SVG/`:
   - `conecta-logo-principal.svg`: cabecera clara.
   - `conecta-logo-fondo-oscuro.svg`: tarjeta azul oscuro.
   - `conecta-isotipo.svg`: icono sobre superficies claras.
   - `favicon.svg`: icono de navegador.
3. Usar `04_Textos/textos-web.json` como base de mensajes de interfaz, adaptando claves al sistema de internacionalización.
4. Agregar metadatos de `04_Textos/seo-y-redes.md` y `og-conecta-1200x630.png`.
5. La vista `05_Recursos_Digitales/portada-demostracion.html` es **solo ilustrativa**. No posee autenticación ni integración con servicios productivos.

## HTML de integración
```html
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg" />
<link rel="stylesheet" href="/assets/fuentes-web.css" />
<link rel="stylesheet" href="/assets/tokens.css" />
<img src="/assets/conecta-logo-principal.svg" alt="CONECTA" width="240" height="53" />
```

## Avisos
- El logotipo en contornos se renderiza sin fuente externa.
- La versión `texto-editable.svg` necesita tener Inter instalada localmente.
- No hacer enlaces de registro directo sin respetar la validación de cuentas existente.
- No anunciar como operativas características futuras (p. ej., vinculación GitHub) antes de implementarlas.
- Documentar la titularidad y aprobar la marca institucionalmente antes del despliegue definitivo.
