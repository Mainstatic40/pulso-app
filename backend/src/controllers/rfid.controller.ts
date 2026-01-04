import type { Request, Response, NextFunction } from 'express';
import { rfidService } from '../services/rfid.service';
import { config } from '../config';

export const rfidController = {
  // POST /api/rfid/scan - Toggle clock in/out desde ESP32
  async scan(req: Request, res: Response, _next: NextFunction) {
    try {
      const { rfidTag } = req.body;
      const apiKey = req.headers['x-api-key'];

      // Verificar API key del ESP32
      if (apiKey !== config.rfid.apiKey) {
        return res.status(401).json({
          success: false,
          action: 'error',
          message: 'API key inválida',
        });
      }

      if (!rfidTag) {
        return res.status(400).json({
          success: false,
          action: 'error',
          message: 'rfidTag requerido',
        });
      }

      const result = await rfidService.toggleClock(rfidTag.toUpperCase());

      // Respuesta compatible con frontend (data wrapper) y ESP32 (campos top-level)
      res.json({
        success: true,
        action: result.action,
        userName: result.user?.name || null,
        message: result.message,
        rfidTag: result.rfidTag,
        data: result,
      });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      res.status(err.statusCode || 500).json({
        success: false,
        action: 'error',
        message: err.message || 'Error del servidor',
      });
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

  // GET /api/rfid/pending - Listar credenciales pendientes
  async getPending(_req: Request, res: Response, next: NextFunction) {
    try {
      const pending = await rfidService.getPendingRfids();
      res.json({ success: true, data: pending });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/rfid/pending/:rfidTag - Eliminar/descartar credencial pendiente
  async deletePending(req: Request, res: Response, next: NextFunction) {
    try {
      const { rfidTag } = req.params;
      await rfidService.deletePendingRfid(rfidTag);
      res.json({ success: true, message: 'Credencial descartada' });
    } catch (error) {
      next(error);
    }
  },
};
