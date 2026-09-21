const Activity = require('../models/Activity');

// GET /api/projects/:id/activities
exports.getProjectActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ project: req.params.id })
      .populate('user', 'fullName')
      .sort('-createdAt')
      .limit(100);

    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
