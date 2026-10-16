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

La portada (hoja 0) tiene el botón **ABRIR EL LIBRO**. `openBook()` también se dispara si alguien avanza con swipe desde la portada. El audio ya no arranca aquí sino en la intro (ver abajo); `playMusic()` se sigue llamando por si acaso, pero es inofensivo si ya suena.

#### Intro (`#intro`) — antes del libro

Capa fija (`z-index: 400`) que tapa todo al cargar. Su botón **TOCA PARA COMENZAR** (`#btn-start`) es el gesto de usuario que desbloquea el sonido (política de autoplay) y arranca **dos capas a la vez**:

- `#intro-video` (`/video/intro.mp4`, 20–30 s) — trae **solo la voz** de Pan. El instrumental **no** va mezclado dentro del video.
- `#bg-audio` (`/audio/instrumental.mp3`) — el instrumental en bucle, que suena todo el tiempo que la tarjeta esté abierta.

Dos momentos separados, mientras el instrumental suena bajito (`MUSIC_DUCKED`):

- `revealBook()` — en el segundo `BOOK_AT` (10) del video, detectado con un bucle `requestAnimationFrame` (no `timeupdate`, que llega hasta 250 ms tarde). La intro recibe `.is-out` (se desvanece, `INTRO_OUT_MS` = 800 ms, debe coincidir con la transición `.8s`), el libro entra con `.entering` (`@keyframes bookIn`) y `sparkBurst()` lanza chispas (estrellas pastel + destellos) desde el centro del libro en `#burst`. **El video sigue reproduciéndose invisible**: la voz de Pan continúa sobre el libro. Por eso la intro no se oculta con `hidden` aquí, solo con opacidad.
- `endVoice()` — al terminar el video (`ended`), con **Saltar** (`#intro-skip`, solo visible antes del segundo 10) o al silenciar con el botón de música. Pausa el video, sube el instrumental a `MUSIC_VOL` en 1.5 s, llama a `revealBook()` si aún no pasó (video de menos de 10 s, o saltado), oculta la intro y libera el video. La música nunca se corta.

Sobre el video va `.intro-frame`, un marco tipo cuadro (en prueba): la moldura lila es una `box-shadow` de `100vmax` que rellena todo lo que queda fuera del borde redondeado, más una línea dorada y otra blanca y una estrella pastel en cada esquina. Solo se ve con `.is-playing`. Para quitarlo basta con borrar el `<div class="intro-frame">` de la vista.

Mientras la intro no tenga `.is-out`, el CSS oculta `.stage` y `.music-toggle` (la intro es transparente para dejar ver el cielo) y deja en pausa la animación `cover-peek` de la portada, que si no se gastaría antes de verse.

El volumen va por un `GainNode` de Web Audio (`setupMusicGain()`, creado dentro del gesto) porque en iPhone `audio.volume` es de solo lectura. `navigator.audioSession.type = 'playback'` evita que el interruptor de silencio del iPhone apague la música al pasar por Web Audio. Si Web Audio falla, `setMusicVolume()` cae a `audio.volume`.

Si el video falta o no carga (`videoBroken`), el toque lleva directo al libro con la música sonando. El teclado (←/→) se ignora hasta `revealBook()`.

#### Escena final (`#book-closing`)

En la última hoja (índice `TOTAL-1`), `nextPage()` ya no llama a `goTo()` — llama a `closeBook()`. Las hojas giran cada una por su cuenta (0° a -180°); no hay un libro 3D que converja en una tapa cerrada, así que el "cierre" es una escena aparte, no más grados de giro:

1. `.book` recibe la clase `closing-out` → `transform:scale(.1)` + `opacity:0` (efecto cámara alejándose). `scale()` desde el centro nunca se sale de encuadre sin importar el tamaño de pantalla — por eso se prefirió sobre reposicionar/centrar el libro a mitad de camino.
2. A los `CLOSE_MS` (600ms, debe coincidir con la transición `.6s` del CSS) se oculta `.book` y se muestra `#book-closing`: un libro cerrado dibujado en CSS (`.closed-book` + `.closed-book-spine`, mismo degradado que `.book-spine`) con las esferas del dragón (reusa `.dragon-balls`/`.db` de la portada) y el texto final "Te esperamos".

Disponible solo vía el botón "siguiente" (su `aria-label` cambia a "Cerrar el libro" en esa hoja) y la tecla →. **No** está enganchado al gesto de arrastre/swipe — intentar deslizar hacia adelante en la última hoja sigue sin hacer nada, igual que antes de esta función.

**Volver** (`reopenBook()`): tres disparadores en la escena — tocar el libro cerrado (`#book-reopen`, un `<button>` real por accesibilidad, no un `div` decorativo), arrastrarlo hacia el lado que abre, o el texto "‹ Volver al libro" (`#book-reopen-link`). `reopenBook()` hace la secuencia inversa — API espejo, no una función aparte reimplementando lo mismo: `.closing-scene` se desvanece (`REOPEN_MS` = 500ms, debe coincidir con su transición `.5s`), luego se oculta `#book-closing` y se le quita `closing-out` a `.book`. La transición de `.book` vive en su regla base (no solo en `.closing-out`) precisamente para que anime igual de ida y de vuelta al quitar la clase. Al terminar llama a `paint()` en vez de restaurar cada atributo a mano — `current` nunca cambió durante el cierre, así que `paint()` deja flechas/aria-labels/swipe-hint exactamente como estaban.

El arrastre sobre `#book-reopen` es un gesto aparte y más simple que el del libro (`pointerdown/move/up`, sin `goTo`): sigue al dedo con `translateX` + un `rotateY` leve (como si se tirara de la tapa), y solo decide una cosa al soltar — `!moved || dx > 40` reabre (toque simple o arrastre suficiente hacia el lado que abre), cualquier otro caso solo vuelve a su sitio. La clase `.dragging` le quita la `transition` mientras se arrastra (si no, cada frame queda con medio segundo de retraso) y se la devuelve al soltar, para que el regreso a su lugar si no se abrió sí se vea animado.
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
| 3 | Capítulo III — cuándo (`event.when`) + ilustración de la bebé con tetero (`/img/bebe-tetero.png`, flotando con la misma animación `float` de la portada). La sección "¿Cómo venir?" / dress code se eliminó |
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
| `public/img/bebe-tetero.png` | Ilustración de la hoja 3 | ok — recortada de `imagen_a_cortar.jpg` (JPG con cuadriculado falso + marca de agua): relleno desde los bordes por píxeles claros sin saturación, que el contorno negro detiene, y borde des-mateado hacia negro |
| `public/audio/instrumental.mp3` | Instrumental de fondo (bucle) | ok (90 s) |
| `public/video/intro.mp4` | Animación de Pan, **solo voz** (sin instrumental). MP4 H.264 720p, comprimido con ffmpeg desde el original de 1080p | ok (20.9 s, 3.5 MB) |

Si un archivo falta, `main.js` oculta la imagen y la portada cae a un emoji (`.cover-art.no-img`), así que la página nunca se rompe.

### Tema visual

- Fuentes: **Fredoka One** (títulos) + **Nunito** (cuerpo) + **Caveat** (manuscrita: frase, carta, deseos) — Google Fonts
- Fondo: cielo pastel lila → rosa (`--sky` / `--sky-top` en `:root`, mismos tonos que la animación de Pan) con nubes blancas, estrellas pastel flotando (amarillo/celeste/rosa) y destellos blancos de 4 puntas. Las estrellas son un `<symbol id="star-shape">` SVG (puntas redondeadas por `stroke-linejoin: round`) reusado en `.sky` y en las chispas; el color sale de `currentColor`. `.intro`, `.sky` y `.book-closing` comparten `--sky`.
- Colores: papel `#fdf7ea`, naranja `#ff6b00`, oro `#ffc02e`, azul profundo `#0b1b33`, rosa `#e91e63`
- Sin librerías CSS externas — todo en `public/css/style.css`
