import { Router } from 'express';
import { equipmentLoanController } from '../controllers/equipment-loan.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint público para ESP32
router.post('/scan', equipmentLoanController.scan);

// Rutas protegidas
router.use(authenticate);

router.get('/history', equipmentLoanController.getHistory);
router.get('/equipment/:equipmentId/history', equipmentLoanController.getEquipmentHistory);
router.get('/session', equipmentLoanController.getSession);

export default router;
