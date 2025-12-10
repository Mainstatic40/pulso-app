import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  listCommentsSchema,
  createCommentSchema,
  updateCommentSchema,
  deleteCommentSchema,
} from '../schemas/comment.schema';

// Router for task-nested routes: /api/tasks/:taskId/comments
export const taskCommentsRouter = Router({ mergeParams: true });

taskCommentsRouter.use(authenticate);

// GET /api/tasks/:taskId/comments - List comments for a task
taskCommentsRouter.get(
  '/',
  validate(listCommentsSchema),
  commentController.getByTaskId
);

// POST /api/tasks/:taskId/comments - Add comment to a task
taskCommentsRouter.post(
  '/',
  validate(createCommentSchema),
  commentController.create
);

// Router for standalone comment routes: /api/comments
export const commentsRouter = Router();

commentsRouter.use(authenticate);

// PUT /api/comments/:id - Update comment (author only)
commentsRouter.put(
  '/:id',
  validate(updateCommentSchema),
  commentController.update
);

// DELETE /api/comments/:id - Delete comment (author or admin)
commentsRouter.delete(
  '/:id',
  validate(deleteCommentSchema),
  commentController.delete
);
