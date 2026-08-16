const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Veuillez fournir un nom complet'],
    trim: true,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, 'Veuillez fournir un email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez fournir un email valide',
    ],
  },
  password: {
    type: String,
    required: [true, 'Veuillez fournir un mot de passe'],
    minlength: 6,
    select: false, // Ne pas renvoyer le mot de passe par défaut
  },
}, { timestamps: true });

// 🔐 Hacher le mot de passe avant de sauvegarder
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Méthode pour comparer les mots de passe
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);