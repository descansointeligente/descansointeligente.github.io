---
name: catalog-page
description: Create a new catalog/product category page for Descanso Inteligente using the template generator and ranking automation pipeline
license: MIT
compatibility: opencode
metadata:
  project: descanso-inteligente
  language: es
  workflow: catalog-expansion
---

## When to use

- User asks to add a new product category, catalog section, or product page.
- User says things like: "añade categoría de X", "nueva sección de catálogo para Y", "crea página de Z", "quiero vender Z en la web".
- User provides an Amazon Best Sellers URL for a new niche.

## Required inputs

Before generating, confirm these with the user:

1. **Category name** (e.g., "Ratones Ergonómicos").
2. **Amazon Best Sellers URL** for the niche (e.g., `https://www.amazon.es/gp/bestsellers/computers/937994031/`). This provides the Browse Node ID for the ranking automation.
3. **Should it appear in the nav menu?** (default: yes, under Catálogo dropdown).

## Workflow

### Step 1 — Create the JSON config

Create a new file in `scripts/catalog-pages/<category-id>.json`.

Use `scripts/catalog-pages/_example-ratones-ergonomicos.json` as reference for all available fields.

**Required fields:**

```json
{
  "id": "category-id",
  "slug": "mejores-category-slug",
  "emoji": "🖱️",
  "title": "Page title | Descanso Inteligente",
  "metaDescription": "Max 155 chars with keyword + benefit",
  "schemaName": "Schema ItemList name",
  "schemaDescription": "Schema ItemList description",
  "breadcrumb": "Breadcrumb text",
  "h1": "H1 heading",
  "heroText": "Paragraph under H1 explaining the category value proposition",
  "ogImage": "/assets/img/og-category.jpg",
  "benefits": {
    "title": "Benefits section title",
    "intro": "Benefits intro paragraph",
    "items": [
      { "title": "Benefit 1", "text": "Description" },
      { "title": "Benefit 2", "text": "Description" }
    ]
  },
  "relatedProducts": {
    "intro": "Related products intro",
    "keywords": "keyword1 | keyword2 | keyword3 | keyword4"
  }
}
```

**Optional fields:**

- `buyingGuide`: Object with `intro` and `sections[]` array (each with `title` and `text`).
- `infoBox`: HTML string for a tip box linking to a related guide.
- `faq`: Array of `{ question, answer }` objects. Generates FAQ section + `FAQPage` schema.

### Step 2 — Generate the HTML page

```bash
npm run generate:catalog -- <category-id>
```

This creates `<slug>/index.html` with:
- Full HTML page with OG tags, Twitter Card, schema ItemList
- Marcadores `CATALOG-RANKINGS-START/END` for product injection
- Placeholder content until the ranking workflow runs

### Step 3 — Register in catalog-config.json

Add the category to `scripts/catalog-config.json`:

```json
{
  "id": "category-id",
  "label": "Category Label",
  "browseNodeId": "EXTRACTED_FROM_AMAZON_URL",
  "keywords": "search keywords in Spanish",
  "searchIndex": "Kitchen or Computers or Electronics",
  "targetFile": "slug/index.html",
  "itemCount": 5
}
```

**Browse Node ID extraction:** From the Amazon URL `https://www.amazon.es/gp/bestsellers/kitchen/2822874031/`, the Browse Node ID is `2822874031`. The `searchIndex` maps to the URL path segment: `kitchen` → `Kitchen`, `computers` → `Computers`, `electronics` → `Electronics`.

### Step 4 — Update navigation (if requested)

Add the new category to the nav dropdown in ALL HTML pages. The nav is duplicated in every page, so either:
- Use search-and-replace across all files, OR
- Run `npm run generate:catalog:all` to regenerate pages that use the template (only for template-generated pages)

The nav entry goes inside `<ul class="dropdown-menu">` under the Catálogo button:
```html
<li><a href="/slug/">emoji Category Name</a></li>
```

### Step 5 — Populate products

Run the catalog rankings workflow:
```bash
gh workflow run update-catalog.yml --ref main
```

Or locally (simulation mode without API):
```bash
npm run update:catalog
```

### Step 6 — Update prices

After rankings are populated, run the prices workflow:
```bash
gh workflow run update-prices.yml --ref main
```

### Step 7 — Verify

```bash
npm run verify:site
npm run audit:affiliate
```

## Content guidelines

- Write in Spanish (Castilian), professional and approachable tone.
- Keep technical terms untranslated: SEO, ASIN, VESA, DPI, etc.
- Benefits should focus on health/ergonomics, not product specs.
- FAQ answers should be 2-3 sentences, factual, no hype.
- `metaDescription` max 155 chars, include primary keyword + benefit.
- `heroText` should identify the user's pain point and promise a solution.
- `relatedProducts.keywords` should be pipe-separated, 4 keywords from OTHER categories to cross-sell.

## File reference

| File | Purpose |
|------|---------|
| `scripts/generate-catalog-page.js` | Template generator script |
| `scripts/catalog-pages/*.json` | Category configurations |
| `scripts/catalog-config.json` | Ranking automation config (Browse Node IDs) |
| `scripts/update-catalog-rankings.js` | Weekly ranking update script |
| `.github/workflows/update-catalog.yml` | GitHub Actions workflow (Monday 04:00) |
