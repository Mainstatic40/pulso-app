import express from 'express';
import cors from 'cors';
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

const app = express();

// Middlewares
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());

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
app.use('/api/comments', commentsRouter);
app.use('/api/events', eventRoutes);
app.use('/api/weekly-logs', weeklyLogRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
