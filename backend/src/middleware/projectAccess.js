const Project = require('../models/Project');

// Vérifie que le projet existe et que l'utilisateur connecté en fait partie
// (owner OU membre). Attache req.project pour les controllers suivants.
exports.loadProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id || req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Projet introuvable' });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some((m) => m.toString() === req.user._id.toString());

    if (!isOwner && !isMember) {
      return res.status(403).json({ success: false, error: 'Accès refusé à ce projet' });
    }

    req.project = project;
    req.isProjectOwner = isOwner;
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Réservé au créateur (owner) du projet — pour édition / suppression / gestion des membres
exports.requireProjectOwner = (req, res, next) => {
  if (!req.isProjectOwner) {
    return res.status(403).json({
      success: false,
      error: 'Seul le créateur du projet peut effectuer cette action',
    });
  }
  next();
};
