import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
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

// POST /api/tasks - Create task (admin/supervisor only)
router.post(
  '/',
  authorize('admin', 'supervisor'),
  validate(createTaskSchema),
  taskController.create
);

// PUT /api/tasks/:id - Update task (admin/supervisor only)
router.put(
  '/:id',
  authorize('admin', 'supervisor'),
  validate(updateTaskSchema),
  taskController.update
);

// PATCH /api/tasks/:id/status - Change task status (special rules apply)
router.patch(
  '/:id/status',
  validate(updateStatusSchema),
  taskController.updateStatus
);

// DELETE /api/tasks/:id - Delete task (admin/supervisor only)
router.delete(
  '/:id',
  authorize('admin', 'supervisor'),
  validate(getTaskSchema),
  taskController.delete
);

export default router;
