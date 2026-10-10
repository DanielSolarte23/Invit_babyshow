/* ═══════════════════════════════════════════════════════════════════════════
   BABY SHOWER — Libro interactivo
   ───────────────────────────────────────────────────────────────────────────
   El libro son N hojas (.leaf) apiladas. Cada hoja gira sobre su borde
   izquierdo de 0° a -180°. La hoja con el z-index más alto es la visible.
   Se puede avanzar con: botón, flechas, teclado, puntos, swipe y arrastre.
   ═══════════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'bs_confirmado';
const FLIP_MS = 900;

/* ── Referencias DOM ─────────────────────────────────────────────────────── */
const book        = document.getElementById('book');
const leaves      = Array.from(document.querySelectorAll('.leaf'));
const btnOpen     = document.getElementById('btn-open');
const navPrev     = document.getElementById('nav-prev');
const navNext     = document.getElementById('nav-next');
const dotsNav     = document.getElementById('page-dots');
const swipeHint   = document.getElementById('swipe-hint');
const bgAudio     = document.getElementById('bg-audio');
const musicBtn    = document.getElementById('music-toggle');
const toast       = document.getElementById('toast-message');
const formError   = document.getElementById('form-error');
const confirmForm = document.getElementById('confirm-form');
const rsvpDone    = document.getElementById('rsvp-done');
const rsvpWaLink  = document.getElementById('rsvp-wa-link');
const wishInput   = document.getElementById('guest-wish');
const wishCount   = document.getElementById('wish-count');
const bookClosing = document.getElementById('book-closing');

const TOTAL = leaves.length;

/* ── Estado ──────────────────────────────────────────────────────────────── */
let current  = 0;      // índice de la hoja visible
let busy     = false;  // hay una animación en curso
let opened   = false;  // ya se pulsó "ABRIR EL LIBRO"

/* ═══════════════════════════════════════════════════════════════
   Pintado del libro
═══════════════════════════════════════════════════════════════ */
function paint() {
  leaves.forEach((leaf, i) => {
    const flipped = i < current;
    leaf.classList.toggle('flipped', flipped);
    leaf.setAttribute('aria-hidden', i === current ? 'false' : 'true');
    leaf.style.pointerEvents = i === current ? 'auto' : 'none';
    if (!leaf.classList.contains('flipping')) {
      leaf.style.zIndex = flipped ? i : TOTAL - i;
    }
  });

  // Navegación — en la última hoja, "siguiente" cierra el libro en vez de voltear
  navPrev.hidden = current === 0;
  navNext.hidden = current === 0;
  navNext.setAttribute('aria-label', current === TOTAL - 1 ? 'Cerrar el libro' : 'Página siguiente');
  if (swipeHint) swipeHint.hidden = current !== 1;

  // Puntos
  Array.from(dotsNav.children).forEach((dot, i) => {
    dot.classList.toggle('is-active', i === current);
    dot.classList.toggle('is-done', i < current);
    dot.setAttribute('aria-current', i === current ? 'true' : 'false');
  });

  book.dataset.page = String(current);
  document.body.dataset.page = String(current);

  // El contador se refresca al llegar a la última página
  if (current === TOTAL - 1) loadStats();
}

/* ═══════════════════════════════════════════════════════════════
   Navegación
═══════════════════════════════════════════════════════════════ */
function goTo(target) {
  if (busy) return;
  const next = Math.max(0, Math.min(TOTAL - 1, target));
  if (next === current) return;

  if (!opened) openBook({ silent: true });

  // Hoja que realmente se anima (la que entra o sale)
  const moving = next > current ? leaves[current] : leaves[next];

  busy = true;
  moving.classList.add('flipping');
  moving.style.zIndex = String(TOTAL + 5);
  moving.style.transform = '';          // libera cualquier arrastre previo

  current = next;
  paint();

  window.setTimeout(() => {
    moving.classList.remove('flipping');
    busy = false;
    paint();
    focusPage();
  }, FLIP_MS);
}

function nextPage() {
  if (current === TOTAL - 1) { closeBook(); return; }
  goTo(current + 1);
}
function prevPage() { goTo(current - 1); }

/* ═══════════════════════════════════════════════════════════════
   Escena final — el libro se cierra
═══════════════════════════════════════════════════════════════ */
const CLOSE_MS = 600;
const REOPEN_MS = 500;

function closeBook() {
  if (!bookClosing || book.classList.contains('closing-out')) return;

  book.classList.add('closing-out');
  navPrev.hidden = true;
  navNext.hidden = true;
  dotsNav.hidden = true;
  if (swipeHint) swipeHint.hidden = true;

  window.setTimeout(() => {
    book.hidden = true;
    bookClosing.hidden = false;
    requestAnimationFrame(() => bookClosing.classList.add('is-in'));
  }, CLOSE_MS);
}

function reopenBook() {
  if (!bookClosing || bookClosing.hidden) return;

  bookClosing.classList.remove('is-in');
  dotsNav.hidden = false;

  window.setTimeout(() => {
    bookClosing.hidden = true;
    book.hidden = false;
    requestAnimationFrame(() => {
      book.classList.remove('closing-out');
      paint(); // restaura flechas, aria-labels y swipe-hint según la hoja actual
    });
  }, REOPEN_MS);
}

document.getElementById('book-reopen-link')?.addEventListener('click', reopenBook);

/* Arrastrar el libro cerrado hacia el lado que abre (igual que el resto del
   libro) también lo reabre — un toque simple sigue funcionando igual. */
const reopenBtn = document.getElementById('book-reopen');
let closedDrag = null;

reopenBtn?.addEventListener('pointerdown', (e) => {
  closedDrag = { id: e.pointerId, x0: e.clientX, moved: false };
  reopenBtn.classList.add('dragging');
  try { reopenBtn.setPointerCapture(e.pointerId); } catch {}
});

reopenBtn?.addEventListener('pointermove', (e) => {
  if (!closedDrag || e.pointerId !== closedDrag.id) return;
  const dx = e.clientX - closedDrag.x0;
  if (Math.abs(dx) > 4) closedDrag.moved = true;
  const follow = Math.max(0, Math.min(70, dx));
  reopenBtn.style.transform = `translateX(${follow}px) rotateY(${-follow * 0.5}deg)`;
});

function endClosedDrag(e) {
  if (!closedDrag || (e && e.pointerId !== closedDrag.id)) return;
  const dx = e ? e.clientX - closedDrag.x0 : 0;
  const moved = closedDrag.moved;
  closedDrag = null;
  reopenBtn.classList.remove('dragging');
  reopenBtn.style.transform = '';
  // Toque simple (sin arrastre real) o arrastre suficiente hacia el lado que
  // abre → reabre. Arrastre hacia el otro lado o insuficiente → no hace nada.
  if (!moved || dx > 40) reopenBook();
}

reopenBtn?.addEventListener('pointerup', endClosedDrag);
reopenBtn?.addEventListener('pointercancel', endClosedDrag);

function focusPage() {
  const scroll = leaves[current].querySelector('.page-scroll');
  if (scroll) scroll.scrollTop = 0;
}

/* ═══════════════════════════════════════════════════════════════
   Abrir el libro (primer gesto del usuario → arranca el audio)
═══════════════════════════════════════════════════════════════ */
function stopCoverPeek() {
  leaves[0]?.classList.remove('cover-peek');
}

function openBook({ silent = false } = {}) {
  opened = true;
  stopCoverPeek();
  document.body.classList.add('is-open');
  playMusic();
  if (!silent) goTo(1);
}

btnOpen?.addEventListener('click', () => {
  stopCoverPeek();
  if (opened) { nextPage(); return; }
  opened = true;
  document.body.classList.add('is-open');
  playMusic();
  goTo(1);
});

navNext?.addEventListener('click', nextPage);
navPrev?.addEventListener('click', prevPage);

document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, select')) return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); nextPage(); }
  if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   { e.preventDefault(); prevPage(); }
});

/* ── Puntos indicadores (esferas del dragón) ─────────────────────────────── */
leaves.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.className = 'dot';
  dot.setAttribute('aria-label', i === 0 ? 'Portada' : `Página ${i}`);
  dot.addEventListener('click', () => goTo(i));
  dotsNav.appendChild(dot);
});

/* ═══════════════════════════════════════════════════════════════
   Arrastre / swipe — pasar la hoja con el dedo
═══════════════════════════════════════════════════════════════ */
let drag = null;

const NO_DRAG = 'input, textarea, select, button, a, iframe';

function leafWidth() {
  return book.getBoundingClientRect().width || 1;
}

book.addEventListener('pointerdown', (e) => {
  stopCoverPeek();
  if (busy || (e.pointerType === 'mouse' && e.button !== 0)) return;
  if (e.target.closest(NO_DRAG)) return;

  // Captura el puntero para que el arrastre sobreviva al salir del libro
  try { book.setPointerCapture(e.pointerId); } catch {}

  drag = {
    id: e.pointerId,
    x0: e.clientX,
    y0: e.clientY,
    axis: null,       // 'x' | 'y' — se decide en el primer movimiento
    leaf: null,
    dir: 0,           // 1 = avanzar, -1 = retroceder
  };
});

book.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;

  const dx = e.clientX - drag.x0;
  const dy = e.clientY - drag.y0;

  // Decide el eje una sola vez
  if (!drag.axis) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    drag.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
    if (drag.axis === 'y') return;

    drag.dir = dx < 0 ? 1 : -1;
    const idx = drag.dir === 1 ? current : current - 1;
    if (idx < 0 || idx > TOTAL - 1 || (drag.dir === 1 && current === TOTAL - 1)) {
      drag = null;
      return;
    }
    drag.leaf = leaves[idx];
    drag.leaf.classList.add('dragging');
    drag.leaf.style.zIndex = String(TOTAL + 5);
  }

  if (drag.axis !== 'x' || !drag.leaf) return;

  const ratio = Math.max(-1, Math.min(1, dx / leafWidth()));
  const raw = drag.dir === 1
    ? 180 * ratio                    // avanzar:    0 → -180
    : -180 + 180 * ratio;            // retroceder: -180 → 0

  // El ángulo nunca sale del rango [-180, 0], aunque el dedo cambie de dirección
  const angle = Math.min(0, Math.max(-180, raw));

  drag.leaf.style.transform = `rotateY(${angle}deg)`;
  drag.progress = drag.dir === 1
    ? Math.abs(angle) / 180
    : 1 - Math.abs(angle) / 180;
});

function endDrag(e) {
  if (!drag || (e && e.pointerId !== drag.id)) return;
  const d = drag;
  drag = null;

  if (!d.leaf) return;

  d.leaf.classList.remove('dragging');
  d.leaf.style.transform = '';

  const passed = (d.progress || 0) > 0.28;

  if (passed) {
    // Confirma el giro: ya está parcialmente volteada, deja que el CSS termine
    busy = true;
    d.leaf.classList.add('flipping');
    current = d.dir === 1 ? current + 1 : current - 1;
    paint();
    window.setTimeout(() => {
      d.leaf.classList.remove('flipping');
      busy = false;
      paint();
      focusPage();
    }, FLIP_MS);
    if (!opened) openBook({ silent: true });
  } else {
    // Vuelve a su sitio
    d.leaf.classList.add('flipping');
    window.setTimeout(() => {
      d.leaf.classList.remove('flipping');
      paint();
    }, FLIP_MS * 0.5);
  }
}

book.addEventListener('pointerup', endDrag);
book.addEventListener('pointercancel', endDrag);

/* ═══════════════════════════════════════════════════════════════
   Música
═══════════════════════════════════════════════════════════════ */
function playMusic() {
  if (!bgAudio) return;
  bgAudio.volume = 0.35;
  bgAudio.play()
    .then(() => musicBtn?.classList.remove('is-off'))
    .catch(() => musicBtn?.classList.add('is-off'));
}

musicBtn?.addEventListener('click', () => {
  if (!bgAudio) return;
  if (bgAudio.paused) {
    playMusic();
  } else {
    bgAudio.pause();
    musicBtn.classList.add('is-off');
  }
});

/* ═══════════════════════════════════════════════════════════════
   Contador de deseos (textarea)
═══════════════════════════════════════════════════════════════ */
wishInput?.addEventListener('input', () => {
  wishCount.textContent = `${wishInput.value.length} / 400`;
});

/* ═══════════════════════════════════════════════════════════════
   Confirmación
═══════════════════════════════════════════════════════════════ */
document.querySelectorAll('.btn-confirm').forEach((btn) => {
  btn.addEventListener('click', () => handleConfirm(btn.dataset.parent));
});

async function handleConfirm(confirmedWith) {
  const name           = document.getElementById('guest-name').value.trim();
  const phone          = document.getElementById('guest-phone').value.trim();
  const numberOfGuests = document.getElementById('guest-count').value;
  const wish           = wishInput ? wishInput.value.trim() : '';

  if (!name) {
    showFormError('Por favor escribe tu nombre.');
    document.getElementById('guest-name').focus();
    return;
  }

  const btns = document.querySelectorAll('.btn-confirm');
  btns.forEach((b) => (b.disabled = true));
  hideFormError();

  try {
    const res = await fetch('/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, numberOfGuests, wish, confirmedWith }),
    });
    const data = await res.json();

    if (data.success) {
      try { localStorage.setItem(STORAGE_KEY, data.whatsappUrl); } catch {}
      showDone(data.whatsappUrl);
      loadStats();
      showToast('¡Gracias por confirmar! 🐉', 'ok');
    } else {
      showFormError(data.message || 'Error al confirmar. Intenta de nuevo.');
      btns.forEach((b) => (b.disabled = false));
    }
  } catch {
    showFormError('Error de conexión. Revisa tu internet e intenta de nuevo.');
    btns.forEach((b) => (b.disabled = false));
  }
}

function showDone(url) {
  if (!rsvpDone) return;
  confirmForm.hidden = true;
  rsvpDone.hidden = false;
  if (url && rsvpWaLink) rsvpWaLink.href = url;
}

// "Confirmar a alguien más" → formulario limpio
document.getElementById('rsvp-again')?.addEventListener('click', () => {
  rsvpDone.hidden = true;
  confirmForm.hidden = false;
  confirmForm.reset();
  if (wishCount) wishCount.textContent = '0 / 400';
  document.querySelectorAll('.btn-confirm').forEach((b) => (b.disabled = false));
  hideFormError();
  document.getElementById('guest-name')?.focus();
});

/* ═══════════════════════════════════════════════════════════════
   Estadísticas
═══════════════════════════════════════════════════════════════ */
async function loadStats() {
  try {
    const res  = await fetch('/api/stats');
    const data = await res.json();
    animate(document.getElementById('total-count'),  data.totalGuests);
    animate(document.getElementById('total-people'), data.totalPeople);
    animate(document.getElementById('total-wishes'), data.totalWishes);
  } catch {
    // Silencioso — los contadores quedan como estén
  }
}

function animate(el, to) {
  if (!el) return;
  const from = parseInt(el.textContent, 10) || 0;
  if (from === to) return;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / 600, 1);
    el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ═══════════════════════════════════════════════════════════════
   UI helpers
═══════════════════════════════════════════════════════════════ */
let toastTimer;
function showToast(text, type = 'info') {
  if (!toast) return;
  toast.textContent = text;
  toast.className = `toast toast-${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
}

function showFormError(text) {
  if (!formError) return;
  formError.textContent = text;
  formError.hidden = false;
}

function hideFormError() {
  if (!formError) return;
  formError.hidden = true;
  formError.textContent = '';
}

/* ═══════════════════════════════════════════════════════════════
   Imágenes que el usuario aún no ha subido → fallback con emoji
═══════════════════════════════════════════════════════════════ */
document.querySelectorAll('img').forEach((img) => {
  img.addEventListener('error', () => {
    img.style.display = 'none';
    img.closest('.cover-art, .sono-frame')?.classList.add('no-img');
  });
  if (img.complete && img.naturalWidth === 0) img.dispatchEvent(new Event('error'));
});

/* ═══════════════════════════════════════════════════════════════
   Init
═══════════════════════════════════════════════════════════════ */
paint();

try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) showDone(saved);
} catch {}

document.addEventListener('DOMContentLoaded', loadStats);
