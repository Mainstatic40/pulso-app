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

// POST /api/events - Create event (admin and supervisor)
router.post(
  '/',
  authorize('admin', 'supervisor'),
  validate(createEventSchema),
  eventController.create
);

// PUT /api/events/:id - Update event (admin and supervisor)
router.put(
  '/:id',
  authorize('admin', 'supervisor'),
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

// POST /api/events/:id/equipment/:userId/release - Release equipment for a user (admin/supervisor only)
router.post(
  '/:id/equipment/:userId/release',
  authorize('admin', 'supervisor'),
  eventController.releaseEquipment
);

// POST /api/events/:id/equipment/:userId/transfer - Transfer equipment to another user (admin/supervisor only)
router.post(
  '/:id/equipment/:userId/transfer',
  authorize('admin', 'supervisor'),
  eventController.transferEquipment
);

// Comments
// GET /api/events/:id/comments - Get event comments
router.get('/:id/comments', eventController.getComments);

// POST /api/events/:id/comments - Add comment to event
router.post('/:id/comments', eventController.addComment);

// Checklist
// GET /api/events/:id/checklist - Get event checklist
router.get('/:id/checklist', eventController.getChecklist);

// POST /api/events/:id/checklist - Add checklist item
router.post('/:id/checklist', eventController.addChecklistItem);

// PATCH /api/events/:id/checklist/:itemId - Update checklist item
router.patch('/:id/checklist/:itemId', eventController.updateChecklistItem);

// DELETE /api/events/:id/checklist/:itemId - Delete checklist item
router.delete('/:id/checklist/:itemId', eventController.deleteChecklistItem);

export default router;
