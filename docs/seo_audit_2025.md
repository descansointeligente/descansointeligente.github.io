# Auditoría SEO y Plan de Implementación (Febrero 2026)

**Objetivo:** Posicionar Top 1 para "Mejor cojín coxis para teletrabajo".
**Estado Actual:** La web tiene buena base técnica pero faltan elementos de conversión (CRO) y alineación con los ASINs objetivo.

## 1. Análisis de Palabras Clave y Nicho
*   **Keyword Objetivo:** "Mejor cojín coxis para teletrabajo".
*   **Nicho Amazon:** "Cojines para espalderas y sillas". 
    *   *Insight*: Amazon categoriza amplio. Nosotros debemos ser específicos ("Teletrabajo") para ganar la intención de búsqueda que Amazon no ataca directamente con contenido editorial.
*   **Productos (Excel vs Web):**
    *   Detectada discrepancia potencial entre los enlaces actuales en `index.html` y los del Excel de control.
    *   **Acción:** Actualizar la sección "Productos destacados" para reflejar EXACTAMENTE los ASINs del Excel (`B0FB339MXT`, `B077G7D73D`, etc.) asegurando que promovemos los productos que ya rankean bien.

## 2. Auditoría On-Page (`index.html`)
| Elemento | Estado | Recomendación |
| :--- | :--- | :--- |
| **Title Tag** | ✅ Optimizado | Mantener. Incluye "Teletrabajo". |
| **Meta Desc** | ✅ Optimizado | Mantener. Buen CTA. |
| **H1** | ✅ Correcto | Clave para retención. |
| **Contenido** | ⚠️ Mejorable | Falta una **Tabla Comparativa** (Quick Win). El formato "Grid" está bien para móviles, pero la tabla convierte mejor en desktop/tablet. |
| **Schema** | ⚠️ Incompleto | Falta `ItemList` para que Google entienda que es un ranking/listado. |

## 3. Plan de Acción Inmediato (Sprint de Mejoras)

### A. Sincronización de Productos
Reemplazar los productos del `index.html` con los Top del Excel:
1.  **Top 1:** Feagar (B077G7D73D) - *Confirmar link.*
2.  **Top 2:** ASIN B0FB339MXT.
3.  **Top 3:** ASIN B072868GGC (Fortem).

### B. Implementación de Tabla Comparativa
Añadir una tabla HTML semántica justo después del Hero, visible sin mucho scroll.
*   Columnas: Imagen, Modelo, Características Clave, Valoración, Botón Amazon.
*   *Por qué*: Satisface la intención de "búsqueda rápida" (Zero Click behaviour).

### C. Datos Estructurados (Schema.org)
Implementar `ItemList` en `index.html` para listar los 3-5 productos principales. Esto aumenta la posibilidad de aparecer en carruseles de Google.

### D. Optimización de Enlaces
Asegurar que todos los enlaces salientes a Amazon tengan etiqueta `aria-label` descriptiva para accesibilidad y SEO ("Ver precio de cojín Feagar en Amazon").

## 4. Impacto Esperado (ROI SEO)

### 📈 1. Ranking y Autoridad Semántica
Al alinear los productos de la Home con los líderes del nicho (Feagar, Fortem), enviamos una señal inequívoca a Google: "Esta página responde a la intención de búsqueda 'Mejor cojín coxis'".
*   **Mejora:** Subida de posiciones para keywords transaccionales. Google premia la relevancia. Si el usuario busca "mejor cojin" y ve lo que espera ver (los top ventas), la señal de usuario es positiva.

### 🖱️ 2. CTR (Click-Through Rate)
La implementación de `Schema.org/ItemList` permite a Google mostrar un carrusel o listado rico en los resultados de búsqueda.
*   **Mejora:** Aumentar el CTR un 20-30% incluso sin subir de posición. Ocupamos más espacio visual en la SERP.

### ⏱️ 3. Retención y Conversión (Dwell Time)
La nueva **Tabla Comparativa** resuelve la duda del usuario de un vistazo ("Quick Answer").
*   **Mejora:** Reduce la tasa de rebote (usuarios que entran y salen rápido). Si el usuario se queda a leer la tabla, Google interpreta que la página es útil y la sube en el ranking.

## 5. Verificación
Una vez implementado, usaremos la navegación simulada para verificar si aparecemos por las keywords.
