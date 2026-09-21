const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createTask,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} = require('../controllers/taskController');

router.use(protect);

router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

module.exports = router;
