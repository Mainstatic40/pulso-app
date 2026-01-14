import type { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/task.service';
import type {
  ListTasksQuery,
  CreateTaskInput,
  UpdateTaskInput,
  UpdateStatusInput,
} from '../schemas/task.schema';

export const taskController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ListTasksQuery;
      const { userId, role } = req.user!;
      const result = await taskService.findAll(query, userId, role);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const task = await taskService.findById(id);

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as CreateTaskInput;
      const task = await taskService.create(input, req.user!.userId);

      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = req.body as UpdateTaskInput;
      const task = await taskService.update(id, input);

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = req.body as UpdateStatusInput;
      const task = await taskService.updateStatus(
        id,
        input,
        req.user!.userId,
        req.user!.role
      );

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await taskService.delete(id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async removeAssignee(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, userId } = req.params;
      const task = await taskService.removeAssignee(id, userId);

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },

  async replaceAssignee(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, userId } = req.params;
      const { newUserId } = req.body;

      if (!newUserId) {
        return res.status(400).json({
          success: false,
          error: 'newUserId is required',
        });
      }

      const task = await taskService.replaceAssignee(id, userId, newUserId);

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },

  async releaseEquipment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, userId } = req.params;
      const task = await taskService.releaseEquipment(id, userId);

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },

  async transferEquipment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, userId } = req.params;
      const { toUserId } = req.body;

      if (!toUserId) {
        return res.status(400).json({
          success: false,
          error: 'toUserId is required',
        });
      }

      const task = await taskService.transferEquipment(id, userId, toUserId);

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },
};
