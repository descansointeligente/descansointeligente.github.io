# Guía de Optimización de Imágenes (SEO + Performance)

Las imágenes son cruciales para un nicho de reviews (el usuario quiere ver el producto), pero si pesan mucho, matan el SEO.

## 1. Formatos de Archivo
*   **WebP**: El estándar actual. Ofrece mejor compresión que JPG/PNG con la misma calidad.
    *   *Herramientas*: Squoosh.app, Photoshop, plugins de conversión.
*   **JPG**: Para fotografías si no se puede usar WebP.
*   **PNG**: Solo para gráficos con fondo transparente (logos, iconos). **Evitar para fotos** (pesan demasiado).

## 2. Dimensiones (Resolución)
No subas imágenes más grandes de lo necesario.
*   **Hero (Cabecera)**: Máximo 1200px - 1400px de ancho.
*   **Contenido (Blog)**: Máximo 800px de ancho.
*   **Miniaturas (Grid)**: Máximo 400px de ancho.

## 3. SEO en Imágenes (Metadatos)
*   **Nombre del Archivo**: NUNCA subas `IMG_2024.jpg`.
    *   *Correcto*: `cojin-lumbar-oficina-negro.webp`
    *   *Estructura*: `palabra-clave-principal-detalle.extensión`
*   **Atributo ALT (Texto Alternativo)**:
    *   Describe la imagen para ciegos y para Google.
    *   Incluye la keyword de forma natural.
    *   *Ejemplo*: `alt="Hombre usando cojín lumbar en silla de oficina ergonómica"`

## 4. Lazy Loading (Carga Diferida)
*   Las imágenes que no están en la pantalla inicial ("below the fold") deben cargar solo cuando el usuario hace scroll.
*   En HTML moderno: `<img src="..." loading="lazy" ...>`
*   **Excepción**: La imagen destacada (Hero) o la primera imagen del artículo debe tener `loading="eager"` o no tener atributo lazy para mejorar el LCP (Largest Contentful Paint).

## 5. Compresión
*   Siempre pasar las imágenes por un compresor antes de subir.
*   Objetivo: Que las fotos de blog pesen **menos de 100kb**.
*   Herramientas: TinyPNG, ImageOptim.
