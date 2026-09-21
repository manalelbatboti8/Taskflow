const Notification = require('../models/Notification');

async function notify({ user, type, message, project = null, task = null }) {
  try {
    await Notification.create({ user, type, message, project, task });
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error.message);
  }
}

module.exports = notify;
