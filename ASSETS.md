# Imágenes y audio por reemplazar

## Ya definitivos

| Archivo | Contenido |
|---------|-----------|
| `public/img/ecografia.jpg` | Ecografía 3D real de la bebé — página "Tu primera foto" |
| `public/audio/babyshower.mpeg` | Audio extraído del video de WhatsApp — música de fondo real |

## Todavía provisionales (copiados de `RevelacionGen1`, reemplazar cuando tengas el definitivo)

| Archivo | Para qué | Recomendación |
|---------|----------|---------------|
| `public/img/bebe.png` | Imagen principal de la portada | PNG **con fondo transparente**, ~800×1000 px, vertical. Es lo primero que ve el invitado. |
| `public/img/detalle.png` | Los dos stickers de esquina en la página "Cuándo" | Puede ser una foto distinta a `bebe.png` — cuadrada o casi, se recorta a 78×78px. |

Reemplaza usando **exactamente el mismo nombre** y no hay que tocar código.

## Opcionales

| Archivo | Para qué |
|---------|----------|
| `public/img/Dragon.png` | Dragón decorativo al final de la última página |

## Si quieres añadir más PNG a la portada

La portada es la hoja `data-page="0"` en `views/invitation.hbs`. El bloque de la imagen es:

```html
<div class="cover-art">
  <img src="/img/bebe.png" alt="" class="cover-img" />
  <div class="cover-img-fallback">&#128118;</div>
</div>
```

Para poner dos imágenes (p. ej. mamá y papá en versión chibi), añade otro `<img class="cover-img">`
dentro de `.cover-art` y cambia en `public/css/style.css`:

```css
.cover-art { display: flex; gap: .5rem; align-items: flex-end; justify-content: center; }
```

## Nota

Si un archivo no existe, `public/js/main.js` oculta la imagen automáticamente y la portada
muestra un emoji en su lugar — la página nunca se rompe por un asset que falte.
