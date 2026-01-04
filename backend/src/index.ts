import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import timeEntryRoutes from './routes/time-entry.routes';
import taskRoutes from './routes/task.routes';
import eventRoutes from './routes/event.routes';
import { taskCommentsRouter, commentsRouter } from './routes/comment.routes';
import weeklyLogRoutes from './routes/weekly-log.routes';
import reportRoutes from './routes/report.routes';
import equipmentRoutes from './routes/equipment.routes';
import equipmentAssignmentRoutes from './routes/equipment-assignment.routes';
import monthlyHoursConfigRoutes from './routes/monthly-hours-config.routes';
import searchRoutes from './routes/search.routes';
import checklistRoutes from './routes/checklist.routes';
import attachmentRoutes from './routes/attachment.routes';
import conversationRoutes from './routes/conversation.routes';
import notificationRoutes from './routes/notification.routes';
import rfidRoutes from './routes/rfid.routes';
import equipmentLoanRoutes from './routes/equipment-loan.routes';

const app = express();

// Middlewares
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tasks/:taskId/comments', taskCommentsRouter);
app.use('/api/tasks/:taskId/checklist', checklistRoutes);
app.use('/api/comments', commentsRouter);
app.use('/api/events', eventRoutes);
app.use('/api/weekly-logs', weeklyLogRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/equipment-assignments', equipmentAssignmentRoutes);
app.use('/api/monthly-hours-config', monthlyHoursConfigRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rfid', rfidRoutes);
app.use('/api/equipment-loans', equipmentLoanRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
