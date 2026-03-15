---
name: prepublish-audit
description: Run a pre-publication review on any HTML page checking SEO, UX, schema, affiliate compliance, and mobile readiness before commit
license: MIT
compatibility: opencode
metadata:
  project: descanso-inteligente
  workflow: quality-assurance
---

## When to use

- Before committing a new page or article.
- Before publishing a significant content update.
- After migrating blocks, templates, or product cards.

## Audit checklist

### SEO base (blocking)

- [ ] Single `<h1>` present and aligned with keyword.
- [ ] `<title>` present, keyword at start, max 60 chars.
- [ ] `<meta name="description">` present, max 155 chars, includes keyword + CTA.
- [ ] Slug is short, hyphenated, no stop words.
- [ ] `<link rel="canonical">` points to the correct URL.
- [ ] Keyword appears in the first 100 words of body text.

### Structure and content

- [ ] Logical `H2`/`H3` hierarchy (no skipped levels).
- [ ] Scannable: short paragraphs, lists, bold highlights.
- [ ] At least 1 internal link to a money page or cluster sibling.
- [ ] Breadcrumbs present and correct.

### Visual and performance

- [ ] Hero image present with descriptive `alt` text.
- [ ] Images in WebP format when possible.
- [ ] No oversized assets (source dimensions match display dimensions).
- [ ] `loading="lazy"` on below-fold images.

### CRO and affiliation (blocking)

- [ ] Affiliate disclaimer visible if Amazon links exist.
- [ ] All Amazon links have `rel="nofollow sponsored"` and `target="_blank"`.
- [ ] CTAs link to the correct ASIN/product.
- [ ] No hardcoded static prices (must be dynamic or use "Ver precio en Amazon").

### Technical

- [ ] JSON-LD schema present and valid (`BlogPosting`, `Product`, `FAQPage`, `BreadcrumbList` as applicable).
- [ ] Mobile responsive (check at 375px width).
- [ ] Global scripts referenced (CSS, JS).
- [ ] Hreflang alternates if translations exist.

## Expected output

- **PASS**: Page is ready to publish.
- **FAIL**: Prioritized list of blocking issues + recommended improvements.

## Automated support

Run the script for a quick automated check:

```bash
npm run skill:prepublish -- path/to/file.html
```

For affiliate-specific audit:

```bash
npm run audit:affiliate
```

## References (load on demand)

- `@docs/checklist_seo_onpage.md` — Full 42-point SEO checklist.
- `@docs/project-overview.md` — Technical architecture and dev guidelines.
