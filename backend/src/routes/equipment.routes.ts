import { Router } from 'express';
import { equipmentController } from '../controllers/equipment.controller';
import { authenticate, authorize, requirePermission } from '../middlewares/auth.middleware';
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

// POST /api/equipment - Create equipment (requires canManageEquipment permission)
router.post(
  '/',
  requirePermission('canManageEquipment'),
  validate(createEquipmentSchema),
  equipmentController.create
);

// PUT /api/equipment/:id - Update equipment (requires canManageEquipment permission)
router.put(
  '/:id',
  requirePermission('canManageEquipment'),
  validate(updateEquipmentSchema),
  equipmentController.update
);

// PATCH /api/equipment/:id/status - Change equipment status (requires canManageEquipment permission)
router.patch(
  '/:id/status',
  requirePermission('canManageEquipment'),
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

// POST /api/equipment/:id/link-rfid - Link RFID to equipment (requires canManageEquipment permission)
router.post(
  '/:id/link-rfid',
  requirePermission('canManageEquipment'),
  equipmentController.linkRfid
);

// DELETE /api/equipment/:id/unlink-rfid - Unlink RFID from equipment (requires canManageEquipment permission)
router.delete(
  '/:id/unlink-rfid',
  requirePermission('canManageEquipment'),
  equipmentController.unlinkRfid
);

export default router;
