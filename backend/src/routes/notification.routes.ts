import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/notifications/unread-count - Get unread count (must be before /:id)
router.get('/unread-count', notificationController.getUnreadCount);

// GET /api/notifications - List all notifications for user
router.get('/', notificationController.getAll);

// POST /api/notifications/read-all - Mark all as read
router.post('/read-all', notificationController.markAllAsRead);

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', notificationController.markAsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', notificationController.delete);

export default router;
