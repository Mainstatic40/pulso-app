import type { Request, Response, NextFunction } from 'express';
import { kioskService } from '../services/kiosk.service';

export const kioskController = {
  async validatePin(req: Request, res: Response, next: NextFunction) {
    try {
      const { pin } = req.body as { pin: string };

      if (!pin || typeof pin !== 'string') {
        return res.status(400).json({
          success: false,
          error: { message: 'PIN requerido' },
        });
      }

      const isValid = kioskService.validatePin(pin);

      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: { message: 'PIN invalido' },
        });
      }

      res.json({
        success: true,
        data: { valid: true },
      });
    } catch (error) {
      next(error);
    }
  },

  async getUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await kioskService.getUsersWithStatus();

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },

  async clockIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: { message: 'userId requerido' },
        });
      }

      const entry = await kioskService.clockIn(userId);

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
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: { message: 'userId requerido' },
        });
      }

      const entry = await kioskService.clockOut(userId);

      res.json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  },
};
