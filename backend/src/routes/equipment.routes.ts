import { Router } from 'express';
import { equipmentController } from '../controllers/equipment.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  listEquipmentSchema,
  availableEquipmentSchema,
  getEquipmentSchema,
  createEquipmentSchema,
  updateEquipmentSchema,
  updateEquipmentStatusSchema,
} from '../schemas/equipment.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/equipment - List equipment (all authenticated users can view)
router.get(
  '/',
  validate(listEquipmentSchema),
  equipmentController.getAll
);

// GET /api/equipment/available - Get equipment available for a time range
// Must be before /:id to avoid matching "available" as an ID
router.get(
  '/available',
  validate(availableEquipmentSchema),
  equipmentController.getAvailable
);

// GET /api/equipment/:id - Get equipment by ID
router.get(
  '/:id',
  validate(getEquipmentSchema),
  equipmentController.getById
);

// POST /api/equipment - Create equipment (admin only)
router.post(
  '/',
  authorize('admin'),
  validate(createEquipmentSchema),
  equipmentController.create
);

// PUT /api/equipment/:id - Update equipment (admin only)
router.put(
  '/:id',
  authorize('admin'),
  validate(updateEquipmentSchema),
  equipmentController.update
);

// PATCH /api/equipment/:id/status - Change equipment status (admin/supervisor)
router.patch(
  '/:id/status',
  authorize('admin', 'supervisor'),
  validate(updateEquipmentStatusSchema),
  equipmentController.updateStatus
);

// DELETE /api/equipment/:id - Delete equipment (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  validate(getEquipmentSchema),
  equipmentController.delete
);

// POST /api/equipment/:id/link-rfid - Link RFID to equipment (admin/supervisor)
router.post(
  '/:id/link-rfid',
  authorize('admin', 'supervisor'),
  equipmentController.linkRfid
);

// DELETE /api/equipment/:id/unlink-rfid - Unlink RFID from equipment (admin/supervisor)
router.delete(
  '/:id/unlink-rfid',
  authorize('admin', 'supervisor'),
  equipmentController.unlinkRfid
);

export default router;
