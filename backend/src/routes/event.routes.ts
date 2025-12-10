import { Router } from 'express';
import { eventController } from '../controllers/event.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  listEventsSchema,
  getEventSchema,
  createEventSchema,
  updateEventSchema,
} from '../schemas/event.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/events - List events
router.get(
  '/',
  validate(listEventsSchema),
  eventController.getAll
);

// GET /api/events/upcoming - Get upcoming events (next 7 days)
router.get('/upcoming', eventController.getUpcoming);

// GET /api/events/:id - Get event by ID
router.get(
  '/:id',
  validate(getEventSchema),
  eventController.getById
);

// POST /api/events - Create event (admin only)
router.post(
  '/',
  authorize('admin'),
  validate(createEventSchema),
  eventController.create
);

// PUT /api/events/:id - Update event (admin only)
router.put(
  '/:id',
  authorize('admin'),
  validate(updateEventSchema),
  eventController.update
);

// DELETE /api/events/:id - Delete event (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  validate(getEventSchema),
  eventController.delete
);

export default router;
