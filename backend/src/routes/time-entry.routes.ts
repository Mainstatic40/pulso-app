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
  createTimeEntrySchema,
  updateTimeEntrySchema,
  deleteTimeEntrySchema,
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

// POST /api/time-entries - Create manual time entry (admin/supervisor only)
router.post(
  '/',
  validate(createTimeEntrySchema),
  timeEntryController.create
);

// PUT /api/time-entries/:id - Update time entry (admin/supervisor only)
router.put(
  '/:id',
  validate(updateTimeEntrySchema),
  timeEntryController.update
);

// DELETE /api/time-entries/:id - Delete time entry (admin/supervisor only)
router.delete(
  '/:id',
  validate(deleteTimeEntrySchema),
  timeEntryController.delete
);

export default router;
