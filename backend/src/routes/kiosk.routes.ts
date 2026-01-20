import { Router } from 'express';
import { kioskController } from '../controllers/kiosk.controller';
import { validateKioskPin } from '../middlewares/kiosk-auth.middleware';

const router = Router();

// POST /api/kiosk/validate-pin - Validate PIN (no auth required, this IS the auth)
router.post('/validate-pin', kioskController.validatePin);

// All other routes require valid PIN in header
router.use(validateKioskPin);

// GET /api/kiosk/users - Get all active users with session status
router.get('/users', kioskController.getUsers);

// POST /api/kiosk/clock-in/:userId - Clock in for a user
router.post('/clock-in/:userId', kioskController.clockIn);

// POST /api/kiosk/clock-out/:userId - Clock out for a user
router.post('/clock-out/:userId', kioskController.clockOut);

export default router;
