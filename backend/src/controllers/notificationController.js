const Notification = require('../models/Notification');

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('project', 'title')
      .populate('task', 'title')
      .sort('-createdAt')
      .limit(50);

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification introuvable' });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
