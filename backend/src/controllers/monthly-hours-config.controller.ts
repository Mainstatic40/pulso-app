import type { Request, Response, NextFunction } from 'express';
import { monthlyHoursConfigService } from '../services/monthly-hours-config.service';
import { ForbiddenError } from '../utils/app-error';
import type { GetByMonthParams, UpsertBody, ListQuery } from '../schemas/monthly-hours-config.schema';

function isAdmin(role: string): boolean {
  return role === 'admin';
}

export const monthlyHoursConfigController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!isAdmin(req.user!.role)) {
        throw new ForbiddenError('Only admins can list all configurations');
      }

      const query = req.query as unknown as ListQuery;
      const configs = await monthlyHoursConfigService.findAll(query.year);

      res.json({
        success: true,
        data: configs,
      });
    } catch (error) {
      next(error);
    }
  },

  async getByMonth(req: Request, res: Response, next: NextFunction) {
    try {
      const { year, month } = req.params as unknown as GetByMonthParams;

      // Get config or return default
      const config = await monthlyHoursConfigService.findByMonth(year, month);
      const targetHours = await monthlyHoursConfigService.getTargetHours(year, month);

      res.json({
        success: true,
        data: {
          year,
          month,
          targetHours,
          config, // null if using default
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      if (!isAdmin(req.user!.role)) {
        throw new ForbiddenError('Only admins can configure monthly hours');
      }

      const { year, month } = req.params as unknown as GetByMonthParams;
      const { targetHours } = req.body as UpsertBody;

      const config = await monthlyHoursConfigService.upsert(
        year,
        month,
        targetHours,
        req.user!.userId
      );

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  },
};
