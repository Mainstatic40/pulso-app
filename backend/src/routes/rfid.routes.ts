import { Router } from 'express';
import { rfidController } from '../controllers/rfid.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint público para ESP32 (usa API key en header)
router.post('/scan', rfidController.scan);

// Rutas protegidas para gestión (requires canManageRfid permission)
router.use(authenticate);
router.get('/users', requirePermission('canManageRfid'), rfidController.getUsersWithRfid);
router.post('/link/:userId', requirePermission('canManageRfid'), rfidController.linkRfid);
router.delete('/unlink/:userId', requirePermission('canManageRfid'), rfidController.unlinkRfid);
router.get('/check/:rfidTag', requirePermission('canManageRfid'), rfidController.checkRfidTag);
router.get('/pending', requirePermission('canManageRfid'), rfidController.getPending);
router.delete('/pending/:rfidTag', requirePermission('canManageRfid'), rfidController.deletePending);

export default router;
