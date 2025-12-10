import type { Request, Response, NextFunction } from 'express';
import { commentService } from '../services/comment.service';
import type { CreateCommentInput, UpdateCommentInput } from '../schemas/comment.schema';

export const commentController = {
  async getByTaskId(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const comments = await commentService.findByTaskId(taskId);

      res.json({
        success: true,
        data: comments,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const input = req.body as CreateCommentInput;
      const comment = await commentService.create(taskId, input, req.user!.userId);

      res.status(201).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = req.body as UpdateCommentInput;
      const comment = await commentService.update(id, input, req.user!.userId);

      res.json({
        success: true,
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await commentService.delete(id, req.user!.userId, req.user!.role);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
