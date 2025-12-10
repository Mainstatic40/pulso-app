import { Router } from 'express';
import { timeEntryController } from '../controllers/time-entry.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  listTimeEntriesSchema,
  getTimeEntrySchema,
  clockInSchema,
  clockOutSchema,
  rfidSchema,
  summarySchema,
} from '../schemas/time-entry.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/time-entries - List time entries
router.get(
  '/',
  validate(listTimeEntriesSchema),
  timeEntryController.getAll
);

// GET /api/time-entries/active - Get current user's active session
router.get('/active', timeEntryController.getActive);

// GET /api/time-entries/summary - Get hours summary
router.get(
  '/summary',
  validate(summarySchema),
  timeEntryController.getSummary
);

// GET /api/time-entries/:id - Get time entry by ID
router.get(
  '/:id',
  validate(getTimeEntrySchema),
  timeEntryController.getById
);

// POST /api/time-entries/clock-in - Clock in
router.post(
  '/clock-in',
  validate(clockInSchema),
  timeEntryController.clockIn
);

// POST /api/time-entries/clock-out - Clock out
router.post(
  '/clock-out',
  validate(clockOutSchema),
  timeEntryController.clockOut
);

// POST /api/time-entries/rfid - Toggle clock in/out via RFID
router.post(
  '/rfid',
  validate(rfidSchema),
  timeEntryController.rfid
);

export default router;
