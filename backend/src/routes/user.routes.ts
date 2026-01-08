import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadProfileImage } from '../middlewares/upload.middleware';
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  listUsersSchema,
} from '../schemas/user.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users/me - Get current user profile (all authenticated users)
// Note: This must be before /:id to avoid conflict
router.get('/me', userController.getMe);

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

// DELETE /api/users/:id/permanent - Hard delete user (admin only)
router.delete(
  '/:id/permanent',
  authorize('admin'),
  validate(getUserSchema),
  userController.hardDelete
);

// POST /api/users/:id/profile-image - Upload profile image
// Users can update their own image, admins can update any user's image
router.post(
  '/:id/profile-image',
  validate(getUserSchema),
  uploadProfileImage,
  userController.uploadProfileImage
);

// DELETE /api/users/:id/profile-image - Delete profile image
// Users can delete their own image, admins can delete any user's image
router.delete(
  '/:id/profile-image',
  validate(getUserSchema),
  userController.deleteProfileImage
);

export default router;
