import { Router } from 'express';
import { conversationController } from '../controllers/conversation.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/conversations/unread-count - Get unread count (must be before /:id)
router.get('/unread-count', conversationController.getUnreadCount);

// GET /api/conversations - List all conversations for user
router.get('/', conversationController.getAll);

// POST /api/conversations - Create conversation (1:1 or group)
router.post('/', conversationController.create);

// GET /api/conversations/:id - Get conversation with messages
router.get('/:id', conversationController.getById);

// GET /api/conversations/:id/messages - Get messages (paginated)
router.get('/:id/messages', conversationController.getMessages);

// POST /api/conversations/:id/messages - Send message
router.post('/:id/messages', conversationController.sendMessage);

// POST /api/conversations/:id/read - Mark as read
router.post('/:id/read', conversationController.markAsRead);

// POST /api/conversations/:id/participants - Add participant (groups only)
router.post('/:id/participants', conversationController.addParticipant);

// DELETE /api/conversations/:id/participants/:participantId - Remove participant
router.delete('/:id/participants/:participantId', conversationController.removeParticipant);

export default router;
