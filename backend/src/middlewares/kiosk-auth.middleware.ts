import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function validateKioskPin(req: Request, res: Response, next: NextFunction) {
  const pin = req.headers['x-kiosk-pin'] as string | undefined;

  if (!pin || pin !== config.kiosk.pin) {
    return res.status(401).json({
      success: false,
      error: { message: 'PIN invalido' }
    });
  }

  next();
}
