import type { Request, Response, NextFunction } from 'express';
import { rfidService } from '../services/rfid.service';

export const rfidController = {
  // POST /api/rfid/scan - Toggle clock in/out
  async scan(req: Request, res: Response, next: NextFunction) {
    try {
      const { rfidTag } = req.body;

      if (!rfidTag) {
        return res.status(400).json({
          success: false,
          error: { message: 'rfidTag is required' },
        });
      }

      const result = await rfidService.toggleClock(rfidTag);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/rfid/users - Lista usuarios con su estado RFID
  async getUsersWithRfid(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await rfidService.getUsersWithRfidStatus();
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/rfid/link/:userId - Vincular RFID a usuario
  async linkRfid(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { rfidTag } = req.body;

      if (!rfidTag) {
        return res.status(400).json({
          success: false,
          error: { message: 'rfidTag is required' },
        });
      }

      const user = await rfidService.linkRfidToUser(userId, rfidTag);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/rfid/unlink/:userId - Desvincular RFID de usuario
  async unlinkRfid(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const user = await rfidService.unlinkRfidFromUser(userId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/rfid/check/:rfidTag - Verificar si un RFID ya está asignado
  async checkRfidTag(req: Request, res: Response, next: NextFunction) {
    try {
      const { rfidTag } = req.params;
      const result = await rfidService.checkRfidTag(rfidTag);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
