# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # instalar dependencias
npm run dev       # desarrollo con auto-reload (nodemon)
npm start         # producción
```

No hay suite de pruebas configurada.

## Variables de entorno

Crear `.env` en la raíz (excluido de git). Referencia en `.env.example`:

```
PORT=3001
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/babyshower

# Números con código de país, sin + ni espacios (ej: 573001234567)
WHATSAPP_DANIEL=57XXXXXXXXXX
WHATSAPP_LISSETH=57XXXXXXXXXX

PARENT_DAD_NAME=Daniel
PARENT_MOM_NAME=Lisseth

BABY_NAME=            # vacío => se usa "nuestra pequeña"
```

Usa el puerto **3001** para poder correr este proyecto y `Revelacion/RevelacionGen1` (3000) a la vez.

## Arquitectura

App Express de un solo archivo (`app.js`) para la invitación digital del **baby shower**, temática Dragon Ball. Padres: **Daniel Solarte** y **Lisseth Garzón**. Es la secuela de `Revelacion/RevelacionGen1`, de la que hereda el stack (Express + Handlebars + Mongoose + WhatsApp + panel admin oculto).

Diferencia central con la revelación: **la navegación no es scroll vertical sino un libro de 7 hojas que se voltean en 3D.**

### Todo el texto vive en `config/event.js`

Ni las vistas ni el CSS llevan textos de evento. Para cambiar fecha, lugar, dress code, la frase o la carta de los padres se edita **solo** ese archivo; `app.js` lo inyecta en las vistas como `event`.

`event.baby` tiene tres campos derivados de `BABY_NAME`:
- `name` — el valor crudo (`''` si no está definido)
- `display` — lo que se imprime (`name` o `'nuestra pequeña'`)
- `hasName` — booleano, controla si la portada muestra el nombre

### El libro (`public/js/main.js`)

7 `<article class="leaf">` apiladas con `position:absolute`. Cada hoja gira sobre su borde izquierdo (`transform-origin: left center`) de `0deg` a `-180deg`; `.flipped` aplica el giro.

- `paint()` es la única función que escribe estado en el DOM: alterna `.flipped`, recalcula `z-index`, muestra/oculta flechas y actualiza los puntos. Se llama después de cada cambio de `current`.
- `z-index`: hojas sin voltear `TOTAL - i` (la actual queda arriba), volteadas `i`. La hoja que se está animando lleva la clase `.flipping` y `z-index: TOTAL + 5` — **`paint()` no toca el `z-index` de una hoja con `.flipping`**, por eso no se cuela por debajo a mitad de la animación.
- `FLIP_MS` (900 ms) debe coincidir con `--flip` en el CSS.
- Arrastre: `pointerdown/move/up` sobre `#book` con `setPointerCapture`. El eje se decide una sola vez tras 8px de movimiento (`drag.axis`); si resulta vertical se abandona el arrastre y el scroll de la página funciona normal (`touch-action: pan-y`). Pasar del 28% de giro confirma el cambio de hoja.
- Navegar también funciona con las flechas, el teclado (←/→) y los puntos inferiores.

La portada (hoja 0) es la única puerta de entrada: su botón **ABRIR EL LIBRO** es el gesto de usuario que permite arrancar el audio (política de autoplay). `openBook()` también se dispara si alguien avanza con swipe desde la portada.

#### Parpadeo al cruzar los 90° ("hinge-veil")

Una hoja que gira sobre su borde izquierdo se ve, en el instante en que pasa por los 90°, proyectada casi de canto: su ancho en pantalla se comprime a casi nada y todo su contenido (colores, texto) queda aplastado en esa franja delgada. Como esa franja va "mostrando" distintas partes comprimidas de la hoja en frames sucesivos, se percibe como un parpadeo claro/oscuro — **es geometría del giro 3D, no un bug de un navegador** (se reprodujo igual en Safari y Chrome).

Dos mitigaciones en `public/css/style.css`:
1. `perspective: 2800px` en `.book` (antes 1900px) — aplana un poco la proyección, así la franja comprimida es menos extrema.
2. `@keyframes hinge-veil` apaga la opacidad de `.face` justo en el tramo donde ocurre el cruce, y la devuelve antes de que el usuario note el corte. **El tramo NO está centrado al 50% de la duración**: `--ease` (`cubic-bezier(.22,.61,.36,1)`) es una curva muy adelantada — ya cruza los 90° hacia el **20%** del tiempo transcurrido. Si se cambia `--ease` o `--flip`, hay que recalcular dónde cae el cruce de los 90° y mover los porcentajes del keyframe (actualmente `0%,6% → 1; 16%,24% → 0; 36%,100% → 1`), si no el velo tapa un tramo que ya está quieto y deja pasar el parpadeo real.

#### Invitación a deslizar ("cover-peek")

La portada (hoja 0) trae la clase `cover-peek` en el HTML, que dispara `@keyframes cover-peek` (gira unos grados y vuelve, 3 veces, con una pausa inicial) para invitar a deslizar. `main.js` la quita (`stopCoverPeek()`) en cuanto hay cualquier interacción real — clic en "Abrir", `pointerdown` sobre el libro, o cualquier navegación — para que no choque con el giro real controlado por JS.
### Páginas

| Hoja | Contenido |
|------|-----------|
| 0 | Portada — esferas, PNG de la bebé, nombres, botón de apertura |
| 1 | Capítulo I — frase para la bebé (`event.phrase`) |
| 2 | Capítulo II — dónde + mapa embebido (`event.where`) |
| 3 | Capítulo III — cuándo + cómo venir, fusionadas en una sola hoja divida 50/50 (`.split-half` × 2 con su propio título cada una), contenido en `event.when` y `event.details` |
| 4 | Capítulo IV — ecografía (`/img/ecografia.jpg`), decorada con dos stickers de esquina (`/img/detalle.png`) |
| 5 | Capítulo V — carta de los padres (`event.letter`) |
| 6 | Capítulo VI — formulario, contador y cierre (`event.rsvp`) |

Los números de "Capítulo" están escritos a mano en cada hoja (no se calculan), así que si se vuelve a reordenar hay que actualizarlos uno por uno.

#### Stickers de esquina (hoja 4)

Dos `<img class="page-sticker">` viven **dentro** de `.sono-wrap`, que vive dentro de `.page-scroll` — es decir, nunca salen de la hoja. Se probó que sobresalieran del borde físico del libro (como hermanos de `.face-front`/`.face-back`, fuera del `overflow:hidden` de `.face`) y **no funcionó**: con varias hojas coplanares (ángulo 0, antes de voltear ninguna) dentro del mismo contexto 3D (`perspective` en `.book` + `preserve-3d` en `.leaf`), el navegador a veces las pinta por encima de OTRAS hojas en vez de respetar el `z-index` que pone `paint()` — se veían en la portada en vez de en su propia página. Por eso ahora solo sobresalen unos px del `.sono-wrap` (que tiene margen de sobra dentro del padding de `.page-scroll`), nunca del borde de la hoja. Usan `object-fit: contain` (no `cover`) porque `detalle.png` tiene fondo blanco sólido, no transparente — recortarlo muy ajustado dejaba ver solo el fondo blanco.

### Flujo de confirmación

1. El invitado abre el libro y llega a la hoja 6.
2. Completa nombre, teléfono opcional, nº de asistentes y, si quiere, un **deseo para la bebé**.
3. Elige **"Papá Daniel"** o **"Mamá Lisseth"** → `POST /confirm`.
4. El backend guarda en MongoDB y devuelve `whatsappUrl`.
5. El frontend cambia a un panel "confirmado" con el botón de WhatsApp y guarda la URL en `localStorage` (`bs_confirmado`), de modo que al volver a entrar se ve el panel en vez del formulario. "Confirmar a alguien más" devuelve el formulario.

### Rutas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | El libro |
| POST | `/confirm` | Guarda invitado, devuelve `{ success, whatsappUrl }` |
| GET | `/api/stats` | `{ totalGuests, totalPeople, totalWishes }` |
| GET | `/admin/babyshower` | Panel admin (sin autenticación — ruta oculta) |
| DELETE | `/admin/guests/:id` | Elimina invitado por ObjectId |

### Modelo Guest (`models/Guest.js`)

- Campos: `name`, `phone`, `numberOfGuests`, `wish`, `confirmedWith` (daniel/lisseth)
- Ya **no existe** `prediction` — en un baby shower no hay equipo niño/niña; lo reemplaza `wish`
- Índice único en `phone` (sparse — permite nulos); los duplicados devuelven HTTP 400 con `error.code === 11000`
- Virtuales: `confirmedWithDisplay`, `hasWish`

### Prevención de duplicados

Doble capa: índice único en MongoDB por teléfono + flag `bs_confirmado` en `localStorage`. A diferencia de la revelación, aquí **ambas capas están activas** (en `RevelacionGen1` quedaron comentadas).

### Assets que el usuario debe proveer

| Ruta | Contenido | Estado |
|------|-----------|--------|
| `public/img/bebe.png` | PNG de la portada, fondo transparente | provisional (copiado de `niña.png`) |
| `public/img/Dragon.png` | Dragón del cierre | ok |
| `public/audio/babyshower.mpeg` | Música de fondo | provisional (copiado de `rev.mpeg`) |

Si un archivo falta, `main.js` oculta la imagen y la portada cae a un emoji (`.cover-art.no-img`), así que la página nunca se rompe.

### Tema visual

- Fuentes: **Fredoka One** (títulos) + **Nunito** (cuerpo) + **Caveat** (manuscrita: frase, carta, deseos) — Google Fonts
- Fondo: cielo Dragon Ball (azul noche → horizonte naranja) con nubes animadas; el libro es papel crema
- Colores: papel `#fdf7ea`, naranja `#ff6b00`, oro `#ffc02e`, azul profundo `#0b1b33`, rosa `#e91e63`
- Sin librerías CSS externas — todo en `public/css/style.css`
