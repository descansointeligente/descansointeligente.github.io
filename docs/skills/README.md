# Skills del proyecto

Esta carpeta define skills reutilizables para trabajar el proyecto sin depender de un formato propietario de agente.

## Objetivo

- Convertir la documentacion operativa de `/docs/` en playbooks accionables.
- Reducir errores de SEO, compliance Amazon y mantenimiento editorial.
- Dar una base estable para automatizar tareas con prompts, scripts o flujos de revision.

## Skills disponibles

- `seo-article.md`: crear o ampliar articulos alineados con la estrategia editorial y SEO.
- `prepublish-audit.md`: revisar una URL o archivo antes de publicar.
- `amazon-compliance.md`: auditar enlaces, disclaimers, precios e imagenes de afiliacion.
- `freshness-update.md`: actualizar bloques dinamicos, ASINs y oportunidades de refresh.
- `spanish-language.md`: asegurar que el asistente responda siempre en castellano.

## Flujo recomendado

1. Crear o actualizar contenido con `seo-article.md`.
2. Ejecutar la revision editorial con `prepublish-audit.md`.
3. Pasar la comprobacion de afiliacion con `amazon-compliance.md`.
4. Revisar datos vivos y oportunidades con `freshness-update.md`.

## Fuente de verdad

Cada skill remite a documentos del proyecto para evitar drift:

- `docs/estrategia_contenidos.md`
- `docs/checklist_seo_onpage.md`
- `docs/guia_afiliados_amazon.md`
- `docs/project-overview.md`
- `docs/informe_tecnico_estrategico_2025_2026.md`

## Automatizacion minima

- `npm run verify:site`: comprueba HTML, precios e imagenes con el script existente.
- `npm run audit:affiliate`: audita requisitos basicos de afiliacion y enlaces Amazon.
- `npm run check:creators`: valida el set minimo de variables de entorno para Creators API.
- `npm run skill:list`: lista las skills disponibles.
- `npm run skill:show -- seo-article`: muestra una skill completa en terminal.
- `npm run skill:prepublish -- path/to/file.html`: ejecuta una revision rapida de publicacion.
- `npm run skill:compliance -- path/to/file-or-dir`: ejecuta la auditoria de afiliacion sobre una ruta concreta.

## Nota

Si en el futuro se confirma un formato nativo de skills para el agente, esta carpeta puede mapearse facilmente a ese sistema sin perder el conocimiento ya documentado.
