const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { loadProject, requireProjectOwner } = require('../middleware/projectAccess');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  inviteMember,
  removeMember,
} = require('../controllers/projectController');
const { getProjectTasks } = require('../controllers/taskController');
const { getProjectActivities } = require('../controllers/activityController');

router.use(protect); // toutes les routes projets sont protégées

router.get('/', getProjects);
router.post('/', createProject);

router.get('/:id', loadProject, getProject);
router.put('/:id', loadProject, requireProjectOwner, updateProject);
router.delete('/:id', loadProject, requireProjectOwner, deleteProject);

router.get('/:id/tasks', loadProject, (req, res) => {
  req.params.projectId = req.params.id;
  getProjectTasks(req, res);
});

router.get('/:id/activities', loadProject, getProjectActivities);

router.post('/:id/members', loadProject, requireProjectOwner, inviteMember);
router.delete('/:id/members/:userId', loadProject, requireProjectOwner, removeMember);

module.exports = router;
