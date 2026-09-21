const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');

// GET /api/dashboard
// Métriques calculées côté serveur via un pipeline d'agrégation MongoDB
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1) Nombre de projets actifs (owner ou membre)
    const activeProjectsCount = await Project.countDocuments({
      status: 'actif',
      $or: [{ owner: userId }, { members: userId }],
    });

    // 2) Agrégation sur les tâches assignées à l'utilisateur :
    //    total assignées, terminées, en retard — via $match, $group, $count
    const now = new Date();

    const taskStats = await Task.aggregate([
      { $match: { assignedTo: userId } },
      {
        $group: {
          _id: null,
          totalAssigned: { $sum: 1 },
          totalCompleted: {
            $sum: { $cond: [{ $eq: ['$status', 'terminé'] }, 1, 0] },
          },
          totalOverdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'terminé'] },
                    { $ne: ['$dueDate', null] },
                    { $lt: ['$dueDate', now] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const stats = taskStats[0] || { totalAssigned: 0, totalCompleted: 0, totalOverdue: 0 };

    // 3) Tâches en cours, triées par priorité décroissante puis date limite croissante
    const priorityOrder = { haute: 3, moyenne: 2, basse: 1 };
    const inProgressTasksRaw = await Task.find({
      assignedTo: userId,
      status: 'en cours',
    })
      .populate('project', 'title')
      .lean();

    const inProgressTasks = inProgressTasksRaw.sort((a, b) => {
      const p = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (p !== 0) return p;
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aDate - bDate;
    });

    res.status(200).json({
      success: true,
      data: {
        activeProjects: activeProjectsCount,
        assignedTasks: stats.totalAssigned,
        completedTasks: stats.totalCompleted,
        overdueTasks: stats.totalOverdue,
        inProgressTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
