// Notification routes — fetch and mark notifications as read
import express from 'express';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Returns the 20 most recent notifications for the logged-in user.
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/notifications/unread-count
 * Returns the number of unread notifications for the logged-in user.
 */
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    res.status(200).json({ success: true, count, unreadCount: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const markReadHandler = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAllReadHandler = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.patch('/read-all', authMiddleware, markAllReadHandler);
router.put('/read-all', authMiddleware, markAllReadHandler);
router.patch('/:id/read', authMiddleware, markReadHandler);
router.put('/:id/read', authMiddleware, markReadHandler);

export default router;
