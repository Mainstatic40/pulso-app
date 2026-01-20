import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticate, requirePermission, requireAnyPermission } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/reports/hours-by-user - Hours worked by user
// Accessible with canViewReports OR canManageTimeEntries (needed for TeamHoursOverview)
router.get('/hours-by-user', requireAnyPermission('canViewReports', 'canManageTimeEntries'), reportController.getHoursByUser);

// GET /api/reports/hours-by-event - Hours worked by event
router.get('/hours-by-event', requirePermission('canViewReports'), reportController.getHoursByEvent);

// GET /api/reports/tasks-summary - Tasks summary
router.get('/tasks-summary', requirePermission('canViewReports'), reportController.getTasksSummary);

// GET /api/reports/productivity - Team productivity
router.get('/productivity', requirePermission('canViewReports'), reportController.getProductivity);

// GET /api/reports/weekly-logs - Weekly logs report
router.get('/weekly-logs', requirePermission('canViewReports'), reportController.getWeeklyLogsReport);

// GET /api/reports/export/:type - Export to Excel
router.get('/export/:type', requirePermission('canViewReports'), reportController.exportToExcel);

export default router;
