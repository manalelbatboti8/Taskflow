const Activity = require('../models/Activity');

async function logActivity({ project, user, type, message }) {
  try {
    await Activity.create({ project, user, type, message });
  } catch (error) {
    console.error("Erreur lors de la création de l'activité:", error.message);
  }
}

module.exports = logActivity;
