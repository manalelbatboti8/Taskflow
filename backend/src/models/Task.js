const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Le titre de la tâche est obligatoire'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    priority: {
      type: String,
      enum: {
        values: ['basse', 'moyenne', 'haute'],
        message: 'La priorité doit être : basse, moyenne ou haute',
      },
      required: true,
      default: 'moyenne',
    },
    status: {
      type: String,
      enum: {
        values: ['à faire', 'en cours', 'terminé'],
        message: 'Le statut doit être : à faire, en cours ou terminé',
      },
      required: true,
      default: 'à faire',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

TaskSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Task', TaskSchema);
