import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';

export const notificationController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { limit, unreadOnly } = req.query;

      const notifications = await notificationService.findByUser(userId, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        unreadOnly: unreadOnly === 'true',
      });

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  },

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const success = await notificationService.markAsRead(id, userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: { message: 'Notification not found' },
        });
      }

      res.json({
        success: true,
        data: { message: 'Notification marked as read' },
      });
    } catch (error) {
      next(error);
    }
  },

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const result = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        data: { message: `${result.count} notifications marked as read` },
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const success = await notificationService.delete(id, userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: { message: 'Notification not found' },
        });
      }

      res.json({
        success: true,
        data: { message: 'Notification deleted' },
      });
    } catch (error) {
      next(error);
    }
  },
};
