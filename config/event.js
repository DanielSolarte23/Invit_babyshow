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
    day: 'Por confirmar',
    month: 'Por confirmar',
    time: '00:00 hrs',
    weekday: 'Por confirmar',
  },

  // ── Página 3 · DÓNDE ──────────────────────────────────────────────────────
  where: {
    place: 'Por confirmar',
    address: 'Calle 1 #1-1',
    city: 'Cali, Colombia',
    mapQuery: 'Calle 1 #1-1, Cali, Colombia',
  },

  // ── Página 4 · DETALLES ───────────────────────────────────────────────────
  details: {
    dressCode: 'Cómodo y colorido — toques de naranja o azul bienvenidos',
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

  // ── Página 5 · CARTA DE LOS PADRES ────────────────────────────────────────
  letter: {
    eyebrow: 'Capítulo V',
    title: 'Para ti, hija',
    paragraphs: [
      'Llegaste cuando ni sabíamos que te estábamos esperando, y desde ese día todo lo que hacemos tiene tu nombre escrito encima.',
      'Te vamos a enseñar que la fuerza no está en los puños, sino en levantarse. Que perder una pelea no es perder. Que la familia se elige todos los días.',
      'Vas a tener una casa llena de ruido, de comida, de gente que te quiere. Y cuando el mundo te quede grande, aquí vas a encontrar dónde volver.',
      'Apúrate, que ya queremos cargarte.',
    ],
    signature: 'Con todo nuestro amor,',
  },

  // ── Página 6 · CONFIRMACIÓN ───────────────────────────────────────────────
  rsvp: {
    title: 'Confirma tu asistencia',
    description: 'Nos encantaría tenerte ahí. Déjanos tus datos y, si quieres, un deseo para ella.',
  },
};
