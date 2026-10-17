/* ═══════════════════════════════════════════════════════════════════════════
   CONFIGURACIÓN DEL EVENTO
   ───────────────────────────────────────────────────────────────────────────
   Todo el texto de la invitación vive aquí. Edita este archivo (no las vistas)
   para cambiar nombres, fechas, lugar, frases o la carta de los padres.
   ═══════════════════════════════════════════════════════════════════════════ */

// Nombre de la bebé. Si queda vacío se usa `babyFallback` en los textos.
const babyName = (process.env.BABY_NAME || '').trim();
const babyFallback = 'nuestra pequeña';

module.exports = {
  // ── Protagonistas ─────────────────────────────────────────────────────────
  baby: {
    name: babyName,                       // '' => se usa el fallback
    display: babyName || babyFallback,    // lo que se imprime en pantalla
    hasName: Boolean(babyName),
  },

  parents: {
    dad: process.env.PARENT_DAD_NAME || 'Daniel',
    mom: process.env.PARENT_MOM_NAME || 'Lisseth',
    dadFull: 'Daniel Solarte',
    momFull: 'Lisseth Garzón',
  },

  // ── Página 2 · CUÁNDO ─────────────────────────────────────────────────────
  when: {
    day: '14',
    month: 'Noviembre',
    time: '03:00 PM',
    weekday: 'Sábado',
  },

  // ── Página 3 · DÓNDE ──────────────────────────────────────────────────────
  where: {
    place: '',  // vacío => la dirección se muestra como título (casa familiar)
    address: 'Calle 7 #27b - 06 Barrio Santa Helena',
    city: 'Popayán, Cauca',
    // Coordenadas exactas (2°26'49.3"N 76°37'26.9"W) — el pin del mapa
    // cae justo en el lugar aunque la dirección escrita sea aproximada.
    mapQuery: '2.447028,-76.624139',
  },

  // ── Página 1 · FRASE PARA LA BEBÉ ─────────────────────────────────────────
  phrase: {
    eyebrow: 'Capítulo I',
    title: 'Antes de que llegues',
    lines: [
      'Todavía no te conocemos la cara,',
      'pero ya sabemos de memoria tus pataditas.',
      'Y mientras tú creces ahí dentro,',
      'aquí afuera te estamos preparando una fiesta.',
    ],
  },

  // ── Página 1 · CARRUSEL DE DESEOS ─────────────────────────────────────────
  // Solo se muestra el texto (nunca quién lo escribió). Un deseo sale en la
  // tarjeta si se aprobó en el panel admin y tiene al menos `minLength`
  // caracteres — los vacíos o muy cortos ("felicidades") nunca aparecen.
  wishes: {
    title: 'Deseos para ella',
    minLength: 20,
    intervalMs: 9000,   // tiempo que se queda cada deseo en pantalla
  },

  // ── Página 5 · CARTA DE LOS PADRES ────────────────────────────────────────
  letter: {
    eyebrow: 'Capítulo V',
    title: 'Para ti, hija',
    paragraphs: [
      'Llegaste cuando ni sabíamos que te estábamos esperando, y desde ese día todo lo que hacemos tiene tu nombre escrito encima.',
      'Te vamos a enseñar que la fuerza no está en los puños, sino en levantarse. Que perder una pelea no es perder. Que la familia se elige todos los días.',
      'Vas a tener una casa llena de ruido, de comida, de gente que te quiere. Y cuando el mundo te quede grande, aquí vas a encontrar dónde volver.',
      'Y no llegas sola: Loki, Bruno y Max, tus tres hermanos gatunos, ya andan loquitos por conocerte. Prepárate para siestas compartidas, ronroneos de despertador y uno que otro bigote curioso asomándose a tu cuna.',
      'Apúrate, que ya queremos cargarte.',
    ],
    signature: 'Con todo nuestro amor,',
  },

  // ── Página 6 · CONFIRMACIÓN ───────────────────────────────────────────────
  rsvp: {
    title: 'Confirma tu asistencia',
    description: 'Nos encantaría tenerte ahí. Déjanos tus datos y, si quieres, un deseo para ella.',
    // Máximo de personas por invitación — lo usan el selector del formulario,
    // la validación del servidor (app.js) y el modelo (models/Guest.js)
    maxGuests: 2,
  },
};
