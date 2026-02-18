# Guía de Cumplimiento: Amazon Associates (Program Policies)

⚠️ **IMPORTANTE**: El incumplimiento de estas normas suele resultar en el **cierre inmediato de la cuenta** y la retención de los ingresos.

## 1. Lo que NUNCA debes hacer

### ❌ No mencionar precios estáticos
*   **Prohibido**: "Este cojín cuesta 25,99€".
*   **Permitido**: "Consultar precio en Amazon" o usar la API para mostrar precios dinámicos actualizados.
*   **Razón**: El precio en Amazon cambia constamente. Mostrar un precio incorrecto engaña al usuario.

### ❌ No usar enlaces en correos electrónicos o PDFs
*   Los enlaces de afiliado SOLO deben estar en las páginas web declaradas en tu cuenta de Amazon Associates.
*   No enviar newsletters con links directos de afiliado.

### ❌ No acortar enlaces de forma "opaca"
*   Usa los enlaces cortos oficiales de Amazon (`amzn.to`) o el enlace largo completo.
*   No uses bit.ly o redirecciones propias que oculten el destino final al usuario o al bot de Amazon.

### ❌ No comprar desde tu propio enlace
*   Estrictamente prohibido comprar productos para ti o para amigos/familiares usando tus propios enlaces. Amazon lo detecta y lo penaliza.

### ❌ No copiar reseñas de Amazon literalmente
*   No puedes copiar y pegar el texto de las opiniones de los usuarios de Amazon en tu web (Copyright).
*   Sí puedes resumir el sentimiento: "Los usuarios destacan su comodidad..."

## 2. Lo que SIEMPRE debes hacer (Disclaimers)

### ✅ Declaración de Afiliado
Debe aparecer en **todas las páginas** que contengan enlaces, preferiblemente cerca del primer enlace o en el pie de página visible.

**Texto Estándar:**
> "En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables."

### ✅ Atributos de Enlace
Todos los enlaces de afiliado deben tener el atributo `rel="nofollow"` o `rel="sponsored"`.

```html
<a href="..." rel="nofollow sponsored" target="_blank">Ver en Amazon</a>
```

## 3. Imágenes de Producto
*   No descargues imágenes de Amazon para subirlas a tu servidor como si fueran tuyas.
*   Usa la API de Amazon o el SiteStripe para insertar imágenes, o usa fotos propias sacadas por ti al producto.
*   Si usas fotos de stock, asegúrate de tener licencia.

## 4. Política de Cookies
*   Asegúrate de que tu banner de cookies cumple con la GDPR (RGPD) y menciona que se usan cookies de terceros para seguimiento de ventas.
