import { Router } from 'express';
import { eventRequestController } from '../controllers/event-request.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// ========== RUTAS PUBLICAS ==========
router.get('/public/validate/:code', eventRequestController.validateAccessCode);
router.post('/public/submit/:accessCode', eventRequestController.submitRequest);
router.get('/public/my-requests/:token', eventRequestController.getByToken);
router.post('/public/recover-access', eventRequestController.recoverAccess);
router.put('/public/update/:id', eventRequestController.updateRequest);
router.get('/public/status/:code', eventRequestController.getStatusByCode);

// ========== RUTAS PRIVADAS ==========
router.use(authenticate);
router.use(authorize('admin', 'supervisor'));

router.get('/', eventRequestController.getAll);
router.get('/pending', eventRequestController.getPending);
router.get('/stats', eventRequestController.getStats);
router.get('/config', eventRequestController.getConfig);
router.put('/config', eventRequestController.updateConfig);
router.get('/recovery', eventRequestController.getRecoveryRequests);
router.post('/recovery/:id/sent', eventRequestController.markRecoveryAsSent);
router.delete('/recovery/:id', eventRequestController.deleteRecoveryRequest);
router.get('/:id', eventRequestController.getById);
router.post('/:id/approve', eventRequestController.approve);
router.post('/:id/reject', eventRequestController.reject);
router.post('/:id/request-changes', eventRequestController.requestChanges);

export default router;
