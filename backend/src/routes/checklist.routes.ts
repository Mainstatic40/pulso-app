import { Router } from 'express';
import { checklistController } from '../controllers/checklist.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);

// GET /api/tasks/:taskId/checklist - Get all items for a task
router.get('/', checklistController.getItems);

// POST /api/tasks/:taskId/checklist - Add a new item
router.post('/', checklistController.addItem);

// PUT /api/tasks/:taskId/checklist/:itemId - Update an item
router.put('/:itemId', checklistController.updateItem);

// DELETE /api/tasks/:taskId/checklist/:itemId - Delete an item
router.delete('/:itemId', checklistController.deleteItem);

// PATCH /api/tasks/:taskId/checklist/reorder - Reorder items
router.patch('/reorder', checklistController.reorderItems);

export default router;
