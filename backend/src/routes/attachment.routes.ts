import { Router } from 'express';
import { attachmentController } from '../controllers/attachment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadAttachments } from '../middlewares/upload.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/attachments - Upload file(s)
router.post('/', uploadAttachments, attachmentController.upload);

// GET /api/attachments/task/:taskId - Get attachments for a task
router.get('/task/:taskId', attachmentController.getByTask);

// GET /api/attachments/event/:eventId - Get attachments for an event
router.get('/event/:eventId', attachmentController.getByEvent);

// GET /api/attachments/:id/preview - Preview a file (inline)
router.get('/:id/preview', attachmentController.preview);

// GET /api/attachments/:id/download - Download a file
router.get('/:id/download', attachmentController.download);

// DELETE /api/attachments/:id - Delete an attachment
router.delete('/:id', attachmentController.delete);

export default router;
