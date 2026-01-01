import { Router } from 'express';
import { monthlyHoursConfigController } from '../controllers/monthly-hours-config.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  listSchema,
  getByMonthSchema,
  upsertSchema,
} from '../schemas/monthly-hours-config.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/monthly-hours-config - List all configurations (admin only)
router.get(
  '/',
  validate(listSchema),
  monthlyHoursConfigController.getAll
);

// GET /api/monthly-hours-config/:year/:month - Get config for specific month
router.get(
  '/:year/:month',
  validate(getByMonthSchema),
  monthlyHoursConfigController.getByMonth
);

// PUT /api/monthly-hours-config/:year/:month - Create/update config (admin only)
router.put(
  '/:year/:month',
  validate(upsertSchema),
  monthlyHoursConfigController.upsert
);

export default router;
