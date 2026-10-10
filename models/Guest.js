const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  numberOfGuests: { type: Number, default: 1, min: 1, max: 15 },
  wish: { type: String, trim: true, maxlength: 400 },
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

guestSchema.methods.getFormattedDate = function () {
  return this.confirmationDate.toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

module.exports = mongoose.model('Guest', guestSchema);
