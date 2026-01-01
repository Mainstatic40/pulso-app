import type { Request, Response, NextFunction } from 'express';
import { timeEntryService } from '../services/time-entry.service';
import { ForbiddenError } from '../utils/app-error';
import type { ListTimeEntriesQuery, ClockInInput, RfidInput, SummaryQuery, CreateTimeEntryInput, UpdateTimeEntryInput } from '../schemas/time-entry.schema';

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

  // Admin: Create manual time entry
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!isAdminOrSupervisor(req.user!.role)) {
        throw new ForbiddenError('Only admins and supervisors can create time entries manually');
      }

      const input = req.body as CreateTimeEntryInput;
      const entry = await timeEntryService.create(input);

      res.status(201).json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Update time entry
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!isAdminOrSupervisor(req.user!.role)) {
        throw new ForbiddenError('Only admins and supervisors can update time entries');
      }

      const { id } = req.params;
      const input = req.body as UpdateTimeEntryInput;
      const entry = await timeEntryService.update(id, input);

      res.json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Delete time entry
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!isAdminOrSupervisor(req.user!.role)) {
        throw new ForbiddenError('Only admins and supervisors can delete time entries');
      }

      const { id } = req.params;
      const result = await timeEntryService.delete(id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
