# Roadmap: Creators API para Descanso Inteligente

## Estado actual

El proyecto ya tiene una base valida para trabajar con datos de Amazon en una web estatica:

- `scripts/update-prices.js` escanea HTML, detecta ASINs y keywords, y actualiza precios, imagenes, badges y modulos relacionados.
- `/.github/workflows/update-prices.yml` ejecuta la actualizacion cada dia, valida secrets, fuerza modo estricto, pasa auditorias y solo despues auto-commitea cambios HTML.

La integracion tecnica ya se esta orientando a `Creators API`, tanto en `scripts/update-prices.js` como en `/.github/workflows/update-prices.yml`. El siguiente paso ya no es migrar desde cero, sino endurecer el flujo y limpiar riesgos de compliance y mantenimiento.

## Lo que queremos conseguir

- Precios y ofertas mas fiables.
- Imagenes oficiales de producto.
- Modulos de alternativas y productos relacionados.
- Variaciones reales por modelo, tamano o color.
- Paginas comerciales mas vivas sin convertir la web en una app dinamica.

## Arquitectura recomendada

### Mantener generacion estatica

Patron recomendado:

1. Script server-side o CI consulta la API.
2. El script vuelca HTML o JSON generado.
3. GitHub Pages publica contenido ya resuelto.

Esto evita exponer secretos en cliente y conserva velocidad, SEO y simplicidad operativa.

## Fases de implementacion

### Fase 1. Validar acceso real

- Confirmar acceso a `Creators API` dentro de Amazon Associates.
- Obtener credenciales validas del entorno nuevo.
- Verificar limites, marketplaces y campos expuestos para la cuenta.

### Fase 2. Endurecer el script tecnico

- Validar credenciales reales y version activa de la API.
- Confirmar que los endpoints actuales siguen vigentes para la cuenta.
- Añadir manejo mas explicito de errores, rate limits y respuestas parciales.
- Mantener una validacion previa en CI antes de tocar HTML en produccion.
- Mantener la logica buena ya existente de:
  - deteccion de ASINs,
  - actualizacion de precio,
  - imagenes,
  - bloques relacionados,
  - fecha visible de refresh.

### Fase 3. Limpiar zonas de riesgo

- Eliminar schema con precios estaticos y ratings no confirmados por la API.
- Evitar placeholders o mock data en produccion.
- Anadir logs y alertas cuando un ASIN falle o quede sin oferta.

### Fase 4. Potenciar la capa comercial

- Comparativas semi-dinamicas por atributos.
- Bloques de `mejor precio`, `opcion premium` y `alternativas similares`.
- Landings de ofertas activas o bajadas de precio.
- Descubrimiento de nuevos productos mediante busqueda por keyword.

## Prioridades por impacto

### Alta prioridad

- Auditar y limpiar precios estaticos en JSON-LD y ratings visibles no verificados.
- Endurecer `scripts/update-prices.js` alrededor de `Creators API`.
- Anadir auditoria automatica de cumplimiento.

### Prioridad media

- Crear una capa JSON intermedia para reducir regex fragiles sobre HTML.
- Guardar historial de cambios de precio para detectar oportunidades editoriales.
- Mejorar los bloques de related products.

### Prioridad media-baja

- Personalizar mas por idioma y marketplace.
- Generar landings estacionales automatizadas.

## Riesgos

- Mostrar precios desactualizados.
- Mantener ratings no verificables.
- Depender solo de regex sobre HTML final.
- Introducir cambios de API sin monitorizacion de errores.

## Criterio de exito

- Los bloques comerciales se actualizan sin tocar manualmente decenas de paginas.
- No hay precios rotos, imagenes rotas ni CTAs mal marcados.
- Las money pages ganan frescura, conversion y capacidad de expansion a nuevas categorias.
