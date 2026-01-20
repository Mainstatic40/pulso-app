import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  listTasksSchema,
  getTaskSchema,
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
} from '../schemas/task.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/tasks - List tasks (all authenticated users can view)
router.get(
  '/',
  validate(listTasksSchema),
  taskController.getAll
);

// GET /api/tasks/:id - Get task by ID with comments
router.get(
  '/:id',
  validate(getTaskSchema),
  taskController.getById
);

// POST /api/tasks - Create task (requires canManageTasks permission)
router.post(
  '/',
  requirePermission('canManageTasks'),
  validate(createTaskSchema),
  taskController.create
);

// PUT /api/tasks/:id - Update task (requires canManageTasks permission)
router.put(
  '/:id',
  requirePermission('canManageTasks'),
  validate(updateTaskSchema),
  taskController.update
);

// PATCH /api/tasks/:id/status - Change task status (special rules apply)
// Note: Moving to 'completed' requires canApproveTasks, checked in service
router.patch(
  '/:id/status',
  validate(updateStatusSchema),
  taskController.updateStatus
);

// DELETE /api/tasks/:id - Delete task (requires canManageTasks permission)
router.delete(
  '/:id',
  requirePermission('canManageTasks'),
  validate(getTaskSchema),
  taskController.delete
);

// DELETE /api/tasks/:id/assignees/:userId - Remove assignee from task (requires canManageTasks permission)
router.delete(
  '/:id/assignees/:userId',
  requirePermission('canManageTasks'),
  taskController.removeAssignee
);

// POST /api/tasks/:id/assignees/:userId/replace - Replace assignee with another (requires canManageTasks permission)
router.post(
  '/:id/assignees/:userId/replace',
  requirePermission('canManageTasks'),
  taskController.replaceAssignee
);

// POST /api/tasks/:id/equipment/:userId/release - Release equipment for a user (requires canManageTasks permission)
router.post(
  '/:id/equipment/:userId/release',
  requirePermission('canManageTasks'),
  taskController.releaseEquipment
);

// POST /api/tasks/:id/equipment/:userId/transfer - Transfer equipment to another user (requires canManageTasks permission)
router.post(
  '/:id/equipment/:userId/transfer',
  requirePermission('canManageTasks'),
  taskController.transferEquipment
);

export default router;
