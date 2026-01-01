import { Request, Response, NextFunction } from 'express';
import { conversationService } from '../services/conversation.service';
import { messageService } from '../services/message.service';

export const conversationController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const conversations = await conversationService.findAllForUser(userId);

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { userId: otherUserId, participantIds, name, isGroup } = req.body;

      let conversation;

      if (isGroup) {
        if (!name || !participantIds?.length) {
          return res.status(400).json({
            success: false,
            error: { message: 'Group name and participants are required' },
          });
        }
        conversation = await conversationService.createGroupConversation(name, participantIds, userId);
      } else {
        if (!otherUserId) {
          return res.status(400).json({
            success: false,
            error: { message: 'userId is required for direct conversation' },
          });
        }
        conversation = await conversationService.findOrCreateDirectConversation(userId, otherUserId);
      }

      res.status(201).json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const conversation = await conversationService.findById(id, userId);

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { limit, before } = req.query;

      const messages = await messageService.findByConversation(id, userId, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        before: before as string | undefined,
      });

      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  },

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { content, attachmentId } = req.body;

      const message = await messageService.create(id, userId, content, attachmentId);

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const result = await conversationService.markAsRead(id, userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await conversationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async addParticipant(req: Request, res: Response, next: NextFunction) {
    try {
      const addedBy = req.user!.userId;
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: { message: 'userId is required' },
        });
      }

      const conversation = await conversationService.addParticipant(id, userId, addedBy);

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  },

  async removeParticipant(req: Request, res: Response, next: NextFunction) {
    try {
      const removedBy = req.user!.userId;
      const { id, participantId } = req.params;

      const result = await conversationService.removeParticipant(id, participantId, removedBy);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
