# Skill: Prepublish Audit

## Cuando usarla

- Antes de hacer commit de una pagina nueva.
- Antes de publicar una actualizacion importante.
- Tras una migracion de bloques o plantillas.

## Objetivo

Detectar fallos de SEO on-page, UX movil, schema y conversion antes de que la pagina llegue a produccion.

## Checklist operativo

### SEO base

- Confirmar un solo H1.
- Confirmar title y meta description alineados con la keyword.
- Revisar slug y canonical.
- Validar que la keyword aparece en el primer bloque de texto.

### Estructura y contenido

- Revisar jerarquia H2/H3.
- Confirmar legibilidad y escaneabilidad.
- Verificar al menos un enlace interno relevante.
- Verificar breadcrumbs.

### Visual y rendimiento

- Revisar imagen principal y `alt`.
- Confirmar formato moderno (`webp`) cuando aplique.
- Evitar assets pesados o imagenes sin dimensiones.

### CRO y afiliacion

- Confirmar disclaimer visible si hay enlaces Amazon.
- Confirmar botones con `target="_blank"` y `rel="nofollow sponsored"`.
- Verificar que el producto enlazado es el correcto.

### Tecnico

- Validar schema aplicable.
- Confirmar scripts globales requeridos.
- Revisar version movil.

## Salida esperada

- `OK` si la pagina esta lista.
- Lista priorizada de fallos bloqueantes.
- Lista corta de mejoras recomendadas.

## Comando util

- `npm run skill:prepublish -- path/to/file.html`

## Referencias

- `docs/checklist_seo_onpage.md`
- `docs/project-overview.md`
