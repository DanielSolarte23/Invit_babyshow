const mongoose = require('mongoose');
const event = require('../config/event');

const guestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  numberOfGuests: { type: Number, default: 1, min: 1, max: event.rsvp.maxGuests },
  wish: { type: String, trim: true, maxlength: 400 },
  // Aprobado desde el panel admin para salir en el carrusel de la hoja 1
  wishApproved: { type: Boolean, default: false },
  confirmedWith: { type: String, enum: ['daniel', 'lisseth'], required: true },
  confirmationDate: { type: Date, default: Date.now },
}, { timestamps: true });

// Evitar duplicados por teléfono (sparse permite nulos)
guestSchema.index({ phone: 1 }, { unique: true, sparse: true });

guestSchema.virtual('confirmedWithDisplay').get(function () {
  return this.confirmedWith === 'daniel' ? 'Papá Daniel' : 'Mamá Lisseth';
});

guestSchema.virtual('hasWish').get(function () {
  return Boolean(this.wish && this.wish.trim());
});

// Suficientemente largo para poder salir en el carrusel
guestSchema.virtual('wishLongEnough').get(function () {
  return Boolean(this.wish && this.wish.trim().length >= event.wishes.minLength);
});

guestSchema.methods.getFormattedDate = function () {
  return this.confirmationDate.toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

module.exports = mongoose.model('Guest', guestSchema);
