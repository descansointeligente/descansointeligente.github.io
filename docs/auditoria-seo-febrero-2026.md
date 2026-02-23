# 🔍 Auditoría SEO Completa — Febrero 2026
## Estado: Diagnóstico Inicial + Plan de Acción

---

## 1. RESUMEN EJECUTIVO

**Veredicto:** El SEO técnico (on-page) está bien ejecutado. El problema real es **falta de autoridad de dominio**, **contenido insuficiente indexado** y **ausencia de señales externas (backlinks)**. El dominio tiene ~1 mes de vida y está en el periodo de "Google Sandbox".

**Tráfico orgánico real (después de filtrar tráfico propio):** ~0 visitas/día.
**Causa principal:** Google aún no confía en el dominio. No hay suficiente contenido de calidad enlazado correctamente, ni señales externas que validen la autoridad.

---

## 2. AUDITORÍA TÉCNICA (SEO On-Page) ✅

### Lo que está BIEN hecho:
| Elemento | Estado | Notas |
|----------|--------|-------|
| Meta titles | ✅ OK | Descriptivos, con keyword principal |
| Meta descriptions | ✅ OK | Incluyen CTA implícita |
| Canonical URLs | ✅ OK | Correctamente configuradas |
| Hreflang (4 idiomas) | ✅ OK | ES, EN, FR, IT con x-default |
| Schema.org - BreadcrumbList | ✅ OK | En todas las páginas |
| Schema.org - BlogPosting | ✅ OK | Con author, publisher, dates |
| Schema.org - Product | ✅ OK | Con AggregateRating y Offers |
| Open Graph tags | ✅ OK | Title, description, image, type |
| robots.txt | ✅ OK | Allow all + sitemap reference |
| Sitemap index | ✅ OK | 4 sitemaps por idioma |
| Imágenes WebP | ✅ OK | Formato optimizado |
| Lazy loading | ✅ OK | En todas las imágenes |
| HTTPS | ✅ OK | Certificado válido |
| Mobile responsive | ✅ OK | Viewport meta tag correcto |

### Lo que FALTA o está MAL:

| Elemento | Estado | Impacto | Prioridad |
|----------|--------|---------|-----------|
| **Sitemap incompleto** | ❌ CRÍTICO | Solo 2 de 10 posts del blog están en sitemap-es.xml | 🔴 P0 |
| **llms.txt** | ❌ NO EXISTE | Recomendado en nuestro propio informe estratégico | 🟡 P1 |
| **FAQ Schema** | ❌ FALTA | Las FAQs de la página pilar no tienen FAQPage schema | 🟡 P1 |
| **Velocidad de carga** | ⚠️ SIN MEDIR | No hemos validado Core Web Vitals en producción | 🟡 P1 |
| **Interlinking SILO** | ⚠️ DÉBIL | Los posts del blog no enlazan consistentemente al pilar | 🟡 P1 |

---

## 3. AUDITORÍA DE CONTENIDO ❌

### Inventario actual (ES):

**Páginas de producto/catálogo (5):**
- `/` — Homepage
- `/mejor-cojin-coxis-teletrabajo/` — Página pilar (~841 líneas, contenido extenso) ✅
- `/cojin-ortopedico-silla-oficina/` — Categoría
- `/cojin-coxis-sofa/` — Categoría
- Productos individuales integrados en las páginas

**Páginas de guía (2):**
- `/como-elegir-cojin-coxis/` — Guía de compra
- `/diferencias-cojin-u-vs-anillo/` — Comparativa

**Blog (10 carpetas, solo 2 en sitemap):**
- `/blog/dolor-espalda-teletrabajo/` ✅ EN SITEMAP
- `/blog/como-sentarse-correctamente/` ✅ EN SITEMAP
- `/blog/cojin-gel-vs-viscoelastico/` ❌ NO EN SITEMAP
- `/blog/lesiones-esfuerzo-repetitivo-rsi/` ❌ NO EN SITEMAP
- `/blog/peligro-cruzar-piernas/` ❌ NO EN SITEMAP
- `/blog/regla-20-20-20-vista-cuello/` ❌ NO EN SITEMAP
- `/blog/setup-minimalista-ergonomico/` ❌ NO EN SITEMAP
- `/blog/silla-gaming-vs-ergonomica/` ❌ NO EN SITEMAP
- `/blog/sindrome-tunel-carpiano-ejercicios/` ❌ NO EN SITEMAP
- `/blog/standing-desk-mitos-verdades/` ❌ NO EN SITEMAP

### Diagnóstico de contenido:
1. **8 posts de blog NO están indexados** porque no aparecen en el sitemap. Google puede encontrarlos por crawling, pero sin sitemap es mucho más lento y menos fiable.
2. **El contenido total es insuficiente** para que Google considere el sitio una "autoridad" en el nicho. Los sitios de nicho exitosos suelen tener mínimo 20-30 artículos de calidad.
3. **La estrategia SILO definida en el informe técnico NO se ha implementado** en la estructura real de URLs.

---

## 4. AUDITORÍA DE AUTORIDAD ❌

### Señales externas (backlinks):
- **Backlinks conocidos:** 0 (ningún sitio externo enlaza a descansointeligente.es)
- **Menciones en redes:** Solo comparticiones manuales en WhatsApp
- **Presencia en directorios:** No registrado en ninguno
- **Google Search Console:** Verificar impresiones y posición media

### Edad del dominio:
- **Dominio registrado:** ~Febrero 2026
- **Primera indexación:** ~Febrero 2026
- **Tiempo en "Sandbox":** Estimado 3-6 meses desde primera indexación

### Competencia real:
Para keywords como "mejor cojín coxis teletrabajo", los competidores tienen:
- Dominios de 2+ años
- 50+ artículos relacionados
- Backlinks de medios y foros
- Presencia en redes sociales activa

---

## 5. PLAN DE ACCIÓN (Priorizado)

### 🔴 FASE A: Correcciones Inmediatas (Esta semana)
**Objetivo:** Asegurar que Google puede ver TODO nuestro contenido.

1. **[P0] Actualizar sitemap-es.xml** — Añadir los 8 posts de blog que faltan
2. **[P0] Actualizar sitemaps en/fr/it** — Verificar que incluyen todos los posts traducidos
3. **[P0] Enviar sitemap actualizado** a Google Search Console
4. **[P0] Verificar Google Search Console** — Ver cuántas páginas están realmente indexadas, impresiones y posición media

### 🟡 FASE B: Mejoras Técnicas (Siguiente semana)
**Objetivo:** Maximizar la calidad de las señales que enviamos a Google.

5. **[P1] Crear llms.txt** — Para visibilidad en ChatGPT/Perplexity
6. **[P1] Añadir FAQPage Schema** a la página pilar (FAQs ya existen, solo falta el markup)
7. **[P1] Reforzar interlinking SILO** — Cada post debe enlazar al pilar y a posts hermanos
8. **[P1] Validar Core Web Vitals** — Ejecutar Lighthouse en producción y corregir si hay problemas

### 🟢 FASE C: Autoridad y Contenido (Próximas 4-8 semanas)
**Objetivo:** Generar las señales externas que Google necesita para confiar.

9. **[P2] Contenido nuevo semanal** — Mínimo 1 artículo de blog por semana (objetivo: llegar a 25+ artículos)
10. **[P2] Estrategia de backlinks:**
    - Registrar en directorios de nicho (salud, ergonomía, teletrabajo)
    - Comentarios de valor en blogs y foros relevantes (Forocoches, Mediavida, Reddit r/spain, r/teletrabajo)
    - Contactar bloggers de productividad para guest posts o menciones
    - Crear un recurso "linkable" (infografía, calculadora de ergonomía, test de postura)
11. **[P2] Presencia en redes:**
    - Crear perfil en Pinterest (alto SEO visual para productos)
    - Publicar en LinkedIn (contenido de teletrabajo/ergonomía)
    - Responder preguntas en Quora en español sobre dolor de espalda
12. **[P2] Google Business Profile** — Si es posible, crear un perfil de empresa

### 🔵 FASE D: Escalado (Meses 3-6)
**Objetivo:** Dominar el nicho.

13. **[P3] Implementar PAAPI** (cuando tengamos las claves)
14. **[P3] Crear contenido "linkable"** — Calculadora interactiva de postura, test de ergonomía
15. **[P3] Explorar nicho adyacente** — Sillas ergonómicas, escritorios elevables

---

## 6. EXPECTATIVAS REALISTAS

| Métrica | Ahora | Mes 1 | Mes 3 | Mes 6 |
|---------|-------|-------|-------|-------|
| Artículos indexados | ~9 | ~15 | ~25 | ~40 |
| Impresiones/día (GSC) | ~0 | 10-50 | 100-500 | 500-2000 |
| Clics orgánicos/día | 0 | 1-3 | 5-20 | 20-80 |
| Posición media keyword principal | No rankeada | 50-100 | 20-50 | 10-30 |
| Backlinks | 0 | 5-10 | 15-30 | 40+ |

**Nota:** Estos números son estimaciones conservadoras. El nicho es real y hay búsquedas, pero Google necesita tiempo y señales consistentes para posicionar un dominio nuevo.

---

## 7. LA VERDAD SOBRE EL NICHO

El nicho de "cojín coxis teletrabajo" **SÍ tiene búsquedas**. No es que nadie busque, es que:
1. Google aún no nos muestra en resultados porque no confía en nosotros.
2. Los competidores llevan años posicionados.
3. Necesitamos más "masa crítica" de contenido y señales externas.

**Esto NO es un fracaso. Es el proceso normal.** Todo sitio de nicho pasa por esta fase de "desierto" los primeros meses. La diferencia entre los que triunfan y los que abandonan es la consistencia.

---

*Documento generado: 23/02/2026*
*Próxima revisión: 23/03/2026*
