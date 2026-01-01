import type { Request, Response, NextFunction } from 'express';
import { weeklyLogService } from '../services/weekly-log.service';
import type {
  ListWeeklyLogsQuery,
  SummaryQuery,
  CreateWeeklyLogInput,
  UpdateWeeklyLogInput,
} from '../schemas/weekly-log.schema';

function isAdminOrSupervisor(role: string): boolean {
  return role === 'admin' || role === 'supervisor';
}

export const weeklyLogController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ListWeeklyLogsQuery;
      const result = await weeklyLogService.findAll(
        query,
        req.user!.userId,
        isAdminOrSupervisor(req.user!.role)
      );

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
      const log = await weeklyLogService.findById(
        id,
        req.user!.userId,
        isAdminOrSupervisor(req.user!.role)
      );

      res.json({
        success: true,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  },

  async getCurrentWeek(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await weeklyLogService.getCurrentWeek(req.user!.userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as SummaryQuery;
      const summary = await weeklyLogService.getSummary(query, req.user!.userId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as CreateWeeklyLogInput;
      const log = await weeklyLogService.create(input, req.user!.userId);

      res.status(201).json({
        success: true,
        data: log,
      });
    } catch (error) {
      console.error('[WeeklyLog.create] Error:', error);
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = req.body as UpdateWeeklyLogInput;
      const log = await weeklyLogService.update(id, input, req.user!.userId);

      res.json({
        success: true,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  },
};
