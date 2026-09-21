const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Le titre du projet est obligatoire'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    deadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['actif', 'en pause', 'archivé'],
      default: 'actif',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

// Suppression en cascade : tâches, activités et notifications liées au projet
ProjectSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const Task = require('./Task');
  const Activity = require('./Activity');

  await Task.deleteMany({ project: this._id });
  await Activity.deleteMany({ project: this._id });
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);
