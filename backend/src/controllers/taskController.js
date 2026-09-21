const Task = require('../models/Task');
const Project = require('../models/Project');
const logActivity = require('../utils/logActivity');
const notify = require('../utils/notify');

// Vérifie qu'un utilisateur fait partie du projet (owner ou membre)
async function assertProjectAccess(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) return { project: null };
  const isOwner = project.owner.toString() === userId.toString();
  const isMember = project.members.some((m) => m.toString() === userId.toString());
  return { project, isOwner, isMember, hasAccess: isOwner || isMember };
}

// GET /api/projects/:projectId/tasks?status=&priority=&assignedTo=&search=&page=&limit=
exports.getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { hasAccess, project } = await assertProjectAccess(projectId, req.user._id);
    if (!project) return res.status(404).json({ success: false, error: 'Projet introuvable' });
    if (!hasAccess) return res.status(403).json({ success: false, error: 'Accès refusé' });

    const { status, priority, assignedTo, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filtre construit de manière conditionnelle
    const filter = { project: projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'fullName email')
        .sort({ priority: -1, dueDate: 1 })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: tasks,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/tasks  { title, description, priority, status, dueDate, project, assignedTo }
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, status, dueDate, project, assignedTo } = req.body;

    if (!title || !project) {
      return res.status(400).json({ success: false, error: 'Titre et projet obligatoires' });
    }

    const { hasAccess, project: proj } = await assertProjectAccess(project, req.user._id);
    if (!proj) return res.status(404).json({ success: false, error: 'Projet introuvable' });
    if (!hasAccess) return res.status(403).json({ success: false, error: 'Accès refusé' });

    const task = await Task.create({
      title,
      description,
      priority: priority || 'moyenne',
      status: status || 'à faire',
      dueDate: dueDate || null,
      project,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
    });

    await logActivity({
      project,
      user: req.user._id,
      type: 'task_created',
      message: `${req.user.fullName} a créé la tâche "${task.title}"`,
    });

    if (assignedTo) {
      await notify({
        user: assignedTo,
        type: 'task_assigned',
        message: `Une nouvelle tâche "${task.title}" vous a été assignée`,
        project,
        task: task._id,
      });
    }

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/tasks/:id
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignedTo', 'fullName email');
    if (!task) return res.status(404).json({ success: false, error: 'Tâche introuvable' });

    const { hasAccess } = await assertProjectAccess(task.project, req.user._id);
    if (!hasAccess) return res.status(403).json({ success: false, error: 'Accès refusé' });

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Tâche introuvable' });

    const { hasAccess, isOwner } = await assertProjectAccess(task.project, req.user._id);
    if (!hasAccess) return res.status(403).json({ success: false, error: 'Accès refusé' });

    // Un simple membre ne peut que mettre à jour le statut de SES tâches (voir PATCH /status)
    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
    if (!isOwner && !isAssignee) {
      return res.status(403).json({
        success: false,
        error: "Vous ne pouvez modifier que les tâches qui vous sont assignées",
      });
    }

    const { title, description, priority, status, dueDate, assignedTo } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (isOwner && assignedTo !== undefined) task.assignedTo = assignedTo;

    await task.save();
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/tasks/:id/status  { status }
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['à faire', 'en cours', 'terminé'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Statut invalide' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Tâche introuvable' });

    const { hasAccess, isOwner } = await assertProjectAccess(task.project, req.user._id);
    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
    if (!hasAccess || (!isOwner && !isAssignee)) {
      return res.status(403).json({ success: false, error: 'Accès refusé' });
    }

    task.status = status;
    await task.save();

    await logActivity({
      project: task.project,
      user: req.user._id,
      type: 'task_status_changed',
      message: `${req.user.fullName} a changé le statut de "${task.title}" à "${status}"`,
    });

    if (task.assignedTo) {
      await notify({
        user: task.assignedTo,
        type: 'task_status_changed',
        message: `Le statut de la tâche "${task.title}" est maintenant "${status}"`,
        project: task.project,
        task: task._id,
      });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Tâche introuvable' });

    const { hasAccess, isOwner } = await assertProjectAccess(task.project, req.user._id);
    if (!hasAccess || !isOwner) {
      return res.status(403).json({ success: false, error: 'Seul le créateur du projet peut supprimer une tâche' });
    }

    await logActivity({
      project: task.project,
      user: req.user._id,
      type: 'task_deleted',
      message: `${req.user.fullName} a supprimé la tâche "${task.title}"`,
    });

    await task.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
