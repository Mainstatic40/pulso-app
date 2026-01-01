import { Router } from 'express';
import { rfidController } from '../controllers/rfid.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Clock in/out via RFID (simulated scan)
router.post('/scan', rfidController.scan);

// Gestión de RFID (solo admin/supervisor)
router.get('/users', authorize('admin', 'supervisor'), rfidController.getUsersWithRfid);
router.post('/link/:userId', authorize('admin', 'supervisor'), rfidController.linkRfid);
router.delete('/unlink/:userId', authorize('admin', 'supervisor'), rfidController.unlinkRfid);
router.get('/check/:rfidTag', authorize('admin', 'supervisor'), rfidController.checkRfidTag);

export default router;
