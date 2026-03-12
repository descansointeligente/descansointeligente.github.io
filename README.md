# descansointeligente
Web nicho sobre ergonomía y descanso en teletrabajo. Comparativas y guías prácticas.

## 📚 Documentación y Estrategia SEO (2025-2026)

Esta es la documentación de referencia para crear contenido optimizado y evitar errores en el programa de afiliados.

### 🧠 Estrategia SEO
- **[Informe Técnico y Estratégico 2025-2026](docs/informe_tecnico_estrategico_2025_2026.md)**: 📊 **Análisis de Oportunidad, Arquitectura SILO y Visibilidad en IA.** Documento maestro para dominar el nicho mediante "Topic Authority" y "Freshness".
- **[Mapa Mental y Visión Global](docs/mapa_mental_Estrategia_seo.md)**: Resumen de la estrategia SGE 2025, linkbuilding y comportamiento del usuario.
- **[Checklist SEO On-Page](docs/checklist_seo_onpage.md)**: ⚠️ **Lectura obligatoria antes de publicar.** Checklist rápida (título, meta, H1, imágenes).

### ✍️ Creación de Contenido
- **[Estrategia de Contenidos](docs/estrategia_contenidos.md)**: Cómo escribir (Tono/Voz), calendario editorial y estructura de artículos (TOFU/MOFU/BOFU).
- **[Optimización de Imágenes](docs/optimizacion_imagenes.md)**: Guía de formatos (WebP), tamaños y nomenclatura para no perjudicar la velocidad de carga.
- **[Skills del Proyecto](docs/skills/README.md)**: Playbooks reutilizables para redactar, auditar y mantener páginas con menos errores.

### 💰 Amazon Afiliados (Compliance)
- **[Guía de Afiliados Amazon](docs/guia_afiliados_amazon.md)**: ⚠️ **Lectura obligatoria para evitar baneos.** Qué hacer y qué NO hacer (precios, disclaimers, enlaces offline).
- **[Roadmap Creators API](docs/creators-api-roadmap.md)**: Plan para migrar la capa de datos de Amazon y potenciar comparativas, precios y related products.

### 📂 Estructura del Proyecto
- **[Visión General del Proyecto](docs/project-overview.md)**: Detalles sobre el stack técnico y despliegue.

### 🛠️ Comandos útiles
- `npm run verify:site`: auditoría rápida de HTML, imágenes y precios.
- `npm run audit:affiliate`: comprobación de compliance Amazon y schema sensible.
- `npm run check:creators`: validación de variables necesarias para Creators API.
- `npm run skill:list`: lista las skills internas disponibles.

### 🤖 Workflow automático
- `/.github/workflows/update-prices.yml`: valida secrets, ejecuta `scripts/update-prices.js --strict`, pasa auditorías y solo después auto-commitea los HTML modificados.

---
*Para modificar cualquier aspecto de la estrategia, por favor actualiza primero el documento correspondiente en `/docs/`.*
