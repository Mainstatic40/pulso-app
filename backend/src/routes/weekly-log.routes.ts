import { Router } from 'express';
import { weeklyLogController } from '../controllers/weekly-log.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  listWeeklyLogsSchema,
  getWeeklyLogSchema,
  summarySchema,
  createWeeklyLogSchema,
  updateWeeklyLogSchema,
} from '../schemas/weekly-log.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/weekly-logs - List weekly logs
router.get(
  '/',
  validate(listWeeklyLogsSchema),
  weeklyLogController.getAll
);

// GET /api/weekly-logs/current-week - Get or prepare current week's log
router.get('/current-week', weeklyLogController.getCurrentWeek);

// GET /api/weekly-logs/summary - Get summary for creating a log
router.get(
  '/summary',
  validate(summarySchema),
  weeklyLogController.getSummary
);

// GET /api/weekly-logs/:id - Get weekly log by ID
router.get(
  '/:id',
  validate(getWeeklyLogSchema),
  weeklyLogController.getById
);

// POST /api/weekly-logs - Create weekly log
router.post(
  '/',
  validate(createWeeklyLogSchema),
  weeklyLogController.create
);

// PUT /api/weekly-logs/:id - Update weekly log (author only)
router.put(
  '/:id',
  validate(updateWeeklyLogSchema),
  weeklyLogController.update
);

export default router;
