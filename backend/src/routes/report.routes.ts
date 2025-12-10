import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication and admin/supervisor role
router.use(authenticate);
router.use(authorize('admin', 'supervisor'));

// GET /api/reports/hours-by-user - Hours worked by user
router.get('/hours-by-user', reportController.getHoursByUser);

// GET /api/reports/hours-by-event - Hours worked by event
router.get('/hours-by-event', reportController.getHoursByEvent);

// GET /api/reports/tasks-summary - Tasks summary
router.get('/tasks-summary', reportController.getTasksSummary);

// GET /api/reports/productivity - Team productivity
router.get('/productivity', reportController.getProductivity);

// GET /api/reports/weekly-logs - Weekly logs report
router.get('/weekly-logs', reportController.getWeeklyLogsReport);

// GET /api/reports/export/:type - Export to Excel
router.get('/export/:type', reportController.exportToExcel);

export default router;
