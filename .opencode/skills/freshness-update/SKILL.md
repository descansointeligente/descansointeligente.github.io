---
name: freshness-update
description: Refresh commercial blocks, ASINs, pricing signals, and editorial content to maintain freshness for search engines and AI citations
license: MIT
compatibility: opencode
metadata:
  project: descanso-inteligente
  workflow: content-maintenance
---

## When to use

- Monthly reviews of BOFU/MOFU content.
- Before seasonal campaigns: Prime Day (July), Black Friday (November), Back to School (September), New Year (January).
- After detecting drops in conversion rate, CTR, or organic traffic.
- When AI citation freshness matters (76.4% of pages cited by ChatGPT were updated in the last 30 days).

## What to review

### Product data

- [ ] ASINs in `data-asin` attributes are still valid and available.
- [ ] Prices are current (run `node scripts/update-prices.js`).
- [ ] Badges (`data-asin-badge`) reflect current status (bestseller, deal, etc.).
- [ ] Product images are loading correctly (no broken `src`).
- [ ] Related products sidebar is relevant.

### Editorial content

- [ ] `dateModified` in JSON-LD schema reflects today's date.
- [ ] Visible "last updated" date on the page is current.
- [ ] Content still aligns with products shown (no discontinued items praised).
- [ ] Any new models released this quarter worth adding?
- [ ] Statistics or studies cited are still current.

### Ranking optimization

- [ ] Reorder products if price, availability, or value proposition changed.
- [ ] Highlight: best overall, best value, budget pick.
- [ ] Replace obsolete ASINs with current alternatives.
- [ ] Identify gaps for new product categories.

## Recommended workflow

1. Run `node scripts/update-prices.js` to pull latest data.
2. Manually review changes in copy, badges, and CTAs.
3. Verify no broken prices or placeholder values were introduced.
4. Update visible revision date if editorial changes were made.
5. Run `npm run audit:affiliate` to confirm compliance.
6. Commit with message pattern: `content: refresh [page-name] pricing and editorial [YYYY-MM]`.

## References (load on demand)

- `@scripts/update-prices.js` — Automated price update infrastructure.
- `@scripts/verify-site.js` — Broken link and image checker.
- `@docs/informe_tecnico_estrategico_2025_2026.md` — Freshness strategy and AI citation data.
- `@docs/estrategia_contenidos.md` — Editorial calendar and seasonal triggers.
