import { Router } from 'express';
import { equipmentAssignmentController } from '../controllers/equipment-assignment.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  listAssignmentsSchema,
  getAssignmentSchema,
  createAssignmentSchema,
  updateAssignmentSchema,
  returnEquipmentSchema,
} from '../schemas/equipment-assignment.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/equipment-assignments - List assignments (all authenticated users can view)
router.get(
  '/',
  validate(listAssignmentsSchema),
  equipmentAssignmentController.getAll
);

// GET /api/equipment-assignments/:id - Get assignment by ID
router.get(
  '/:id',
  validate(getAssignmentSchema),
  equipmentAssignmentController.getById
);

// POST /api/equipment-assignments - Create assignment (admin/supervisor)
router.post(
  '/',
  authorize('admin', 'supervisor'),
  validate(createAssignmentSchema),
  equipmentAssignmentController.create
);

// PUT /api/equipment-assignments/:id - Update assignment (admin/supervisor)
router.put(
  '/:id',
  authorize('admin', 'supervisor'),
  validate(updateAssignmentSchema),
  equipmentAssignmentController.update
);

// POST /api/equipment-assignments/:id/return - Return equipment (admin/supervisor)
router.post(
  '/:id/return',
  authorize('admin', 'supervisor'),
  validate(returnEquipmentSchema),
  equipmentAssignmentController.returnEquipment
);

// DELETE /api/equipment-assignments/:id - Delete assignment (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  validate(getAssignmentSchema),
  equipmentAssignmentController.delete
);

export default router;
