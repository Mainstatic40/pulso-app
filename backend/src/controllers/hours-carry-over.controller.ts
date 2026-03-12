import type { Request, Response, NextFunction } from 'express';
import { hoursCarryOverService } from '../services/hours-carry-over.service';

export const hoursCarryOverController = {
  /**
   * GET /api/hours-carry-over/:year/:month
   * Obtiene arrastres de todos los usuarios para un mes.
   */
  async getCarryOvers(req: Request, res: Response, next: NextFunction) {
    try {
      const year = parseInt(req.params.year, 10);
      const month = parseInt(req.params.month, 10);

      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ success: false, message: 'Invalid year or month' });
      }

      const results = await hoursCarryOverService.calculateAllCarryOvers(month, year);

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/hours-carry-over/:year/:month/calculate
   * Recalcula arrastres de todos los usuarios para un mes.
   */
  async recalculate(req: Request, res: Response, next: NextFunction) {
    try {
      const year = parseInt(req.params.year, 10);
      const month = parseInt(req.params.month, 10);

      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ success: false, message: 'Invalid year or month' });
      }

      const results = await hoursCarryOverService.calculateAllCarryOvers(month, year);

      res.json({
        success: true,
        data: results,
        message: `Carry-over recalculated for ${month}/${year}`,
      });
    } catch (error) {
      next(error);
    }
  },
};
