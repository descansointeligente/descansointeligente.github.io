---
name: seo-article
description: Create or rewrite SEO-optimized blog articles for Descanso Inteligente following the editorial strategy, SILO architecture, and E-E-A-T standards
license: MIT
compatibility: opencode
metadata:
  project: descanso-inteligente
  language: es
  workflow: content-creation
---

## When to use

- Creating a new blog article or buying guide.
- Rewriting an existing article to improve depth, conversion, or freshness.
- Adapting content to another language while preserving search intent.

## Required inputs

Before writing, confirm these with the user:

1. **Primary keyword** and search intent (`TOFU`, `MOFU`, `BOFU`).
2. **Target URL** (slug).
3. **Language** (default: `es`).
4. **Internal pages to link** (at least 1 money page + 1 cluster sibling).
5. **Associated product or category**, if any.

## Writing rules

- **Tone**: Expert but approachable, empathetic, objective. "We don't sell hype, we help you sit better."
- Keyword in `<title>`, `<h1>`, first 100 words, and slug.
- Structure with `H2`/`H3`, short paragraphs (max 3 lines), scannable bold text, lists.
- Always link vertically to the pillar money page and laterally to cluster siblings.
- MOFU/BOFU pieces MUST start with a comparison table or summary block.
- Commercial recommendations use clear CTAs without exaggerated claims.
- NEVER invent medical data, technical specs, or user testimonials.
- If scientific data is needed, load the `notebook-research` skill first to query NotebookLM.

## Article structure template

1. `<title>` with keyword at the start + brand (max 60 chars).
2. `<meta description>` with keyword + CTA + benefit (max 155 chars).
3. Single `<h1>`, identical or very close to `<title>`.
4. **Intro hook**: Identify the problem + promise a solution + context.
5. **Quick-win summary table** (for MOFU/BOFU): top 3 picks (Best, Value, Budget).
6. **Body**: `H2`/`H3` sections with semantic depth.
7. **Pros & Cons** lists per product (if applicable).
8. **Conclusion / Verdict**: "Which one should I buy?"
9. **FAQ section** with `FAQPage` schema markup.

## Minimum deliverable

- Title, meta description, slug, H1.
- Complete outline with H2/H3.
- Suggested CTAs and internal links.
- JSON-LD schemas: `BlogPosting`, `BreadcrumbList`, `FAQPage` (if applicable).

## Technical requirements

- Use the existing `blog/article-template.html` as the HTML base.
- Include hreflang alternates if translations exist.
- Images: WebP format, descriptive filename, `alt` with keyword, `loading="lazy"`.
- All Amazon links: `rel="nofollow sponsored"` + `target="_blank"`.
- Affiliate disclaimer visible on the page.

## References (load on demand)

- `@docs/estrategia_contenidos.md` — Full content strategy and editorial calendar.
- `@docs/checklist_seo_onpage.md` — Pre-publish SEO checklist.
- `@docs/informe_tecnico_estrategico_2025_2026.md` — SILO architecture and AI visibility strategy.
- `@blog/article-template.html` — HTML template for new articles.
