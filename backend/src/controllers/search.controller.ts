import { Request, Response, NextFunction } from 'express';
import { searchService } from '../services/search.service';

export const searchController = {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || '';
      const { userId, role: userRole } = req.user!;

      const results = await searchService.search(query, userId, userRole);

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  },
};
