---
name: notebook-research
description: Query Google NotebookLM notebooks via MCP server to extract scientific data, affiliate insights, and product arguments before writing content
license: MIT
compatibility: opencode
metadata:
  project: descanso-inteligente
  workflow: research
  requires: mcp-notebooklm
---

## When to use

- Before writing any article that references medical, scientific, or biomechanical data.
- When building product arguments that need evidence-based differentiation.
- When crafting affiliate strategy content or optimizing conversion flows.
- When the `seo-article` skill identifies a need for scientific backing.

## Available notebooks

| Notebook | Use for |
|---|---|
| **Ergonomics and Biomechanics of Seated Health and Productivity** | Coccydynia etiology, seated pressure distribution, spinal biomechanics, muscle activation patterns, ergonomic intervention evidence, postural health studies |
| **SEO Strategy, Affiliate Marketing, and Ergonomic Product Insights** | Keyword opportunity data, CPC benchmarks, conversion patterns, AI Overview strategies, content funnel tactics, product positioning insights |

## How to query

1. Use the MCP NotebookLM tools to search the relevant notebook.
2. Frame queries around specific data needs, not open-ended questions.
3. Extract factual claims with their source context.
4. Note any citations or study references the notebook provides.

### Good query examples

- "What are the main etiologies of coccydynia and which user profiles are most affected?"
- "What evidence exists for pressure redistribution effectiveness of U-shaped vs ring cushions?"
- "What are the CPC benchmarks for health category affiliate keywords in Spain?"
- "What content formats have the highest conversion rate for ergonomic product affiliates?"

### Bad query examples

- "Tell me everything about cushions" (too broad, wastes context).
- "Write me an article about back pain" (not a research query).

## Rules

- **NEVER invent data** that the notebook does not provide. If the notebook lacks specific data, state "no data found in notebook" and proceed with general knowledge clearly marked as such.
- **Always attribute**: When using notebook data in content, frame it as "Segun estudios de biomecanica..." or "La evidencia cientifica indica..." — never present it as your own opinion.
- **Cross-reference**: If the notebook provides a medical claim, verify it makes clinical sense before including it in patient-facing content.
- **Respect E-E-A-T**: Scientific data from the notebook strengthens Experience and Expertise signals. Use it to differentiate from generic AI-generated content.

## Integration with other skills

- Load `notebook-research` BEFORE `seo-article` when the article involves health or scientific topics.
- Data extracted here feeds directly into the article's body, FAQ, and structured data.
- The `freshness-update` skill may trigger notebook queries to find updated data for existing content.

## References

- MCP server configuration for Google NotebookLM (connected and active).
- `@docs/informe_tecnico_estrategico_2025_2026.md` — E-E-A-T strategy and medical content guidelines.
