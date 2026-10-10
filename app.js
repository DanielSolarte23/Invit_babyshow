const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const Guest = require('./models/Guest');
const event = require('./config/event');

const app = express();
const PORT = process.env.PORT || 3001;

app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
  helpers: {
    eq: (a, b) => a === b,
  },
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch((err) => console.error('❌ Error MongoDB:', err));

// ── Página principal ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.render('invitation', {
    title: `Baby Shower — ${event.parents.dad} & ${event.parents.mom}`,
    event,
    mapSrc: `https://www.google.com/maps?q=${encodeURIComponent(event.where.mapQuery)}&output=embed`,
  });
});

// ── Confirmar asistencia ──────────────────────────────────────────────────────
app.post('/confirm', async (req, res) => {
  try {
    const { name, phone, numberOfGuests, wish, confirmedWith } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'El nombre es obligatorio.' });
    }
    if (!['daniel', 'lisseth'].includes(confirmedWith)) {
      return res.status(400).json({ success: false, message: 'Elige con quién confirmas.' });
    }

    const guests = Math.min(Math.max(parseInt(numberOfGuests) || 1, 1), 15);
    const cleanWish = (wish || '').trim().slice(0, 400);

    const newGuest = new Guest({
      name: String(name).trim(),
      phone: phone ? String(phone).trim() : undefined,
      numberOfGuests: guests,
      wish: cleanWish || undefined,
      confirmedWith,
    });

    await newGuest.save();

    const parentName = confirmedWith === 'daniel' ? event.parents.dad : event.parents.mom;
    const parentPhone = confirmedWith === 'daniel'
      ? process.env.WHATSAPP_DANIEL
      : process.env.WHATSAPP_LISSETH;

    const guestsText = guests > 1 ? `Seremos ${guests} personas` : 'Voy solo/a';
    const babyText = event.baby.hasName ? ` de ${event.baby.name}` : '';
    const wishText = cleanWish ? ` Mi deseo para ella: "${cleanWish}"` : '';

    const message = encodeURIComponent(
      `¡Hola ${parentName}! 🐉 Confirmo mi asistencia al baby shower${babyText}. Soy ${newGuest.name}. ${guestsText}.${wishText} ¡Nos vemos pronto!`
    );

    res.json({ success: true, whatsappUrl: `https://wa.me/${parentPhone}?text=${message}` });
  } catch (error) {
    console.error('Error al confirmar:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Este número ya fue registrado antes. ¡Gracias por confirmar!',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al guardar. Por favor intenta de nuevo.',
    });
  }
});

// ── Stats JSON (contador en la última página) ─────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const guests = await Guest.find();
    res.json({
      totalGuests: guests.length,
      totalPeople: guests.reduce((sum, g) => sum + g.numberOfGuests, 0),
      totalWishes: guests.filter((g) => g.wish && g.wish.trim()).length,
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ── Panel de administración ───────────────────────────────────────────────────
app.get('/admin/babyshower', async (req, res) => {
  try {
    const guests = await Guest.find().sort({ confirmationDate: -1 });

    res.render('admin', {
      title: 'Admin — Baby Shower',
      event,
      guests,
      stats: {
        totalGuests: guests.length,
        totalPeople: guests.reduce((sum, g) => sum + g.numberOfGuests, 0),
        totalWishes: guests.filter((g) => g.wish && g.wish.trim()).length,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar panel');
  }
});

// ── Eliminar invitado ─────────────────────────────────────────────────────────
app.delete('/admin/guests/:id', async (req, res) => {
  try {
    const deleted = await Guest.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.use((req, res) => {
  res.status(404).render('404', { title: 'Página no encontrada' });
});

app.listen(PORT, () => {
  console.log(`🐉 Baby shower corriendo en http://localhost:${PORT}`);
});

module.exports = app;
