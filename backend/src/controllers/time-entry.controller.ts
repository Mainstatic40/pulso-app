import type { Request, Response, NextFunction } from 'express';
import { timeEntryService } from '../services/time-entry.service';
import type { ListTimeEntriesQuery, ClockInInput, RfidInput, SummaryQuery } from '../schemas/time-entry.schema';

function isAdminOrSupervisor(role: string): boolean {
  return role === 'admin' || role === 'supervisor';
}

export const timeEntryController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ListTimeEntriesQuery;
      const result = await timeEntryService.findAll(
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
      const entry = await timeEntryService.findById(id);

      res.json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  },

  async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await timeEntryService.getActiveSession(req.user!.userId);

      res.json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  },

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as SummaryQuery;
      const summary = await timeEntryService.getSummary(
        query,
        req.user!.userId,
        isAdminOrSupervisor(req.user!.role)
      );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  },

  async clockIn(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as ClockInInput;
      const entry = await timeEntryService.clockIn(req.user!.userId, input);

      res.status(201).json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  },

  async clockOut(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await timeEntryService.clockOut(req.user!.userId);

      res.json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  },

  async rfid(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as RfidInput;
      const result = await timeEntryService.rfidToggle(input);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
