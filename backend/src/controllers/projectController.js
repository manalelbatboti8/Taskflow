const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const logActivity = require('../utils/logActivity');
const notify = require('../utils/notify');

// GET /api/projects?page=&limit=
// Retourne les projets où l'utilisateur est owner OU membre, paginés
exports.getProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    };

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('owner', 'fullName email')
        .populate('members', 'fullName email')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Project.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: projects,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/projects/:id
exports.getProject = async (req, res) => {
  try {
    const project = await req.project.populate([
      { path: 'owner', select: 'fullName email' },
      { path: 'members', select: 'fullName email' },
    ]);
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const { title, description, deadline, status } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Le titre est obligatoire' });
    }

    const project = await Project.create({
      title,
      description,
      deadline: deadline || null,
      status: status || 'actif',
      owner: req.user._id,
      members: [],
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/projects/:id (owner seulement)
exports.updateProject = async (req, res) => {
  try {
    const { title, description, deadline, status } = req.body;
    const project = req.project;

    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (deadline !== undefined) project.deadline = deadline;
    if (status !== undefined) project.status = status;

    await project.save();

    await logActivity({
      project: project._id,
      user: req.user._id,
      type: 'project_updated',
      message: `${req.user.fullName} a modifié le projet "${project.title}"`,
    });

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/projects/:id (owner seulement) — cascade via le hook Mongoose pre('deleteOne')
exports.deleteProject = async (req, res) => {
  try {
    await req.project.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/projects/:id/members  { email }  (owner seulement)
exports.inviteMember = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email obligatoire' });
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        error: "Aucun compte n'existe avec cet email",
      });
    }

    const project = req.project;

    if (
      project.owner.toString() === userToAdd._id.toString() ||
      project.members.some((m) => m.toString() === userToAdd._id.toString())
    ) {
      return res.status(400).json({ success: false, error: 'Cet utilisateur fait déjà partie du projet' });
    }

    project.members.push(userToAdd._id);
    await project.save();

    await logActivity({
      project: project._id,
      user: req.user._id,
      type: 'member_added',
      message: `${req.user.fullName} a ajouté ${userToAdd.fullName} au projet`,
    });

    await notify({
      user: userToAdd._id,
      type: 'project_added',
      message: `Vous avez été ajouté au projet "${project.title}"`,
      project: project._id,
    });

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/projects/:id/members/:userId (owner seulement)
exports.removeMember = async (req, res) => {
  try {
    const project = req.project;
    const { userId } = req.params;

    project.members = project.members.filter((m) => m.toString() !== userId);
    await project.save();

    await logActivity({
      project: project._id,
      user: req.user._id,
      type: 'member_removed',
      message: `${req.user.fullName} a retiré un membre du projet`,
    });

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
