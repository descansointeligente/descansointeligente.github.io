# Skill: Amazon Compliance

## Cuando usarla

- En cualquier pagina con enlaces de afiliado.
- Antes de publicar comparativas, rankings o reseñas.
- Despues de cambiar CTAs, productos, imagenes o scripts de actualizacion.

## Objetivo

Reducir riesgos de incumplimiento del programa de Amazon Associates.

## Reglas no negociables

- No fijar precios manuales si no provienen de una integracion dinamica valida.
- Mantener disclaimer visible en paginas con enlaces de afiliado.
- Usar `rel="nofollow sponsored"` y `target="_blank"` en enlaces Amazon.
- No copiar reseñas literales de Amazon.
- No alojar imagenes de Amazon como si fueran propias salvo uso permitido por API o licencia valida.
- No usar enlaces opacos ni redirecciones que oculten el destino.

## Procedimiento

1. Detectar si la pagina contiene enlaces Amazon o `amzn.to`.
2. Verificar disclaimer de afiliado.
3. Auditar atributos de enlaces.
4. Revisar si hay precios literales potencialmente estaticos.
5. Revisar origen y uso de imagenes de producto.
6. Confirmar que el CTA describe correctamente la accion.

## Senales de alerta

- Texto tipo `25,99 EUR` o `39,99 €` escrito a mano sin capa dinamica.
- Ratings inventados o sin fuente verificable.
- Botones que llevan a un ASIN distinto al producto analizado.
- Imagenes rotas, `undefined`, `null` o placeholders publicados.

## Apoyo automatico

- `npm run audit:affiliate`
- `npm run skill:compliance -- path/to/file-or-dir`
- `npm run verify:site`

## Referencias

- `docs/guia_afiliados_amazon.md`
- `docs/checklist_seo_onpage.md`
- `scripts/update-prices.js`
