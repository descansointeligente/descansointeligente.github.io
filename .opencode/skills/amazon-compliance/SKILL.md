---
name: amazon-compliance
description: Audit any page for Amazon Associates program compliance covering disclaimers, link attributes, pricing, images, and CTAs
license: MIT
compatibility: opencode
metadata:
  project: descanso-inteligente
  workflow: compliance
---

## When to use

- On any page containing affiliate links.
- Before publishing product rankings, comparisons, or reviews.
- After changing CTAs, products, images, or the price update script.

## Non-negotiable rules

1. **No static prices.** Never hardcode prices like "25,99 EUR". Use dynamic API data or write "Ver precio en Amazon".
2. **Disclaimer required.** Every page with Amazon links MUST display: "En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables."
3. **Link attributes.** All Amazon links: `rel="nofollow sponsored"` + `target="_blank"`.
4. **No copied reviews.** Never paste verbatim Amazon user reviews. Summarize sentiment instead.
5. **No self-hosted Amazon images** unless sourced from the Creators API or properly licensed.
6. **No opaque redirects.** Use `amazon.es/dp/{ASIN}?tag=descansointel-21` or `amzn.to` short links. Never bitly or custom redirectors.

## Red flags to check

- Price text matching pattern `\d+[,.]\d{2}\s*[€EUR]` written inline (not in a `data-asin` dynamic block).
- Ratings or star counts without a verifiable source.
- CTA buttons linking to an ASIN different from the product being described.
- Broken images, `undefined`, `null`, or placeholder `src` values.
- Missing or hidden disclaimer (not visible without scrolling).
- Links missing `rel` attribute or using only `nofollow` without `sponsored`.

## Audit procedure

1. Detect all Amazon links (`amazon.es`, `amzn.to`) in the page.
2. Verify affiliate disclaimer is present and visible.
3. Check every link for correct `rel` and `target` attributes.
4. Scan for hardcoded static prices.
5. Verify image sources are not downloaded Amazon assets.
6. Confirm CTA text accurately describes the action ("Ver en Amazon", not "Comprar ahora").

## Automated support

```bash
npm run audit:affiliate                          # Full site audit
npm run skill:compliance -- path/to/file.html    # Single file audit
npm run verify:site                              # Links + images check
```

## References (load on demand)

- `@docs/guia_afiliados_amazon.md` — Complete Amazon Associates compliance guide.
- `@scripts/update-prices.js` — Dynamic pricing infrastructure.
- `@scripts/validate-affiliate-compliance.js` — Automated compliance validator.
