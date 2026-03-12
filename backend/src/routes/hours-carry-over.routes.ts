import { Router } from 'express';
import { hoursCarryOverController } from '../controllers/hours-carry-over.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/hours-carry-over/:year/:month - Get carry-overs for all users
router.get('/:year/:month', hoursCarryOverController.getCarryOvers);

// POST /api/hours-carry-over/:year/:month/calculate - Recalculate carry-overs
router.post('/:year/:month/calculate', hoursCarryOverController.recalculate);

export default router;
