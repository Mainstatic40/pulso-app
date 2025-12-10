import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  listUsersSchema,
} from '../schemas/user.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users - List users (admin and supervisor only)
router.get(
  '/',
  authorize('admin', 'supervisor'),
  validate(listUsersSchema),
  userController.getAll
);

// GET /api/users/:id - Get user by ID (all authenticated users)
router.get(
  '/:id',
  validate(getUserSchema),
  userController.getById
);

// POST /api/users - Create user (admin only)
router.post(
  '/',
  authorize('admin'),
  validate(createUserSchema),
  userController.create
);

// PUT /api/users/:id - Update user (admin only)
router.put(
  '/:id',
  authorize('admin'),
  validate(updateUserSchema),
  userController.update
);

// DELETE /api/users/:id - Soft delete user (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  validate(getUserSchema),
  userController.delete
);

export default router;
