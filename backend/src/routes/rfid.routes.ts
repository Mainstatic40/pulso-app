import { Router } from 'express';
import { rfidController } from '../controllers/rfid.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint público para ESP32 (usa API key en header)
router.post('/scan', rfidController.scan);

// Rutas protegidas para gestión
router.use(authenticate);
router.get('/users', authorize('admin', 'supervisor'), rfidController.getUsersWithRfid);
router.post('/link/:userId', authorize('admin', 'supervisor'), rfidController.linkRfid);
router.delete('/unlink/:userId', authorize('admin', 'supervisor'), rfidController.unlinkRfid);
router.get('/check/:rfidTag', authorize('admin', 'supervisor'), rfidController.checkRfidTag);
router.get('/pending', authorize('admin', 'supervisor'), rfidController.getPending);
router.delete('/pending/:rfidTag', authorize('admin', 'supervisor'), rfidController.deletePending);

export default router;
