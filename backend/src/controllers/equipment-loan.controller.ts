import type { Request, Response, NextFunction } from 'express';
import { equipmentLoanService } from '../services/equipment-loan.service';
import { config } from '../config';

export const equipmentLoanController = {
  // POST /api/equipment-loans/scan - Desde ESP32
  async scan(req: Request, res: Response, _next: NextFunction) {
    try {
      const { rfidTag } = req.body;
      const apiKey = req.headers['x-api-key'];

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
          message: 'rfidTag es requerido',
        });
      }

      const result = await equipmentLoanService.processRfidScan(rfidTag.toUpperCase());
      res.json({ success: true, ...result });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      res.status(err.statusCode || 500).json({
        success: false,
        action: 'error',
        message: err.message || 'Error del servidor',
      });
    }
  },

  // GET /api/equipment-loans/history - Historial
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, equipmentId, limit, startDate, endDate } = req.query;

      const logs = await equipmentLoanService.getHistory({
        userId: userId as string,
        equipmentId: equipmentId as string,
        limit: limit ? parseInt(limit as string) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/equipment-loans/equipment/:equipmentId/history - Historial de un equipo
  async getEquipmentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { equipmentId } = req.params;
      const { limit } = req.query;

      const history = await equipmentLoanService.getEquipmentHistory(
        equipmentId,
        limit ? parseInt(limit as string) : undefined
      );

      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/equipment-loans/session - Ver sesión activa
  async getSession(_req: Request, res: Response, next: NextFunction) {
    try {
      const session = equipmentLoanService.getActiveSession();
      res.json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  },
};
