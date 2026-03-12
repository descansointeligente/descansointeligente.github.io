# Skill: Freshness Update

## Cuando usarla

- En revisiones mensuales de contenido BOFU o MOFU.
- Antes de Prime Day, Black Friday u otras campanas.
- Tras detectar bajadas de conversion o CTR.

## Objetivo

Actualizar bloques comerciales y senales de vigencia sin perder calidad editorial ni compliance.

## Que revisar

- ASINs presentes en la pagina.
- Bloques con `data-asin`, `data-asin-image`, `data-asin-badge` y `data-search-keywords`.
- Fecha de ultima actualizacion.
- Productos sin oferta, con descuento fuerte o con disponibilidad dudosa.
- Modulos relacionados generados por busqueda.

## Flujo recomendado

1. Ejecutar actualizacion de datos con el script tecnico.
2. Revisar manualmente cambios sensibles de copy, badges y CTAs.
3. Validar que no se hayan introducido precios rotos o placeholders.
4. Revisar si el contenido editorial sigue alineado con los productos mostrados.
5. Actualizar la fecha visible de revision cuando proceda.

## Oportunidades de mejora

- Anadir bloques de alternativas por keyword.
- Destacar mejor precio, opcion premium y mejor calidad/precio.
- Reordenar rankings si cambian precio, disponibilidad o propuesta de valor.
- Sustituir ASINs obsoletos y detectar huecos para nuevas categorias.

## Referencias

- `scripts/update-prices.js`
- `scripts/verify-site.js`
- `docs/informe_tecnico_estrategico_2025_2026.md`
- `docs/estrategia_contenidos.md`
