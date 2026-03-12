import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
import eventRequestRoutes from './routes/event-request.routes';
import kioskRoutes from './routes/kiosk.routes';
import hoursCarryOverRoutes from './routes/hours-carry-over.routes';

const app = express();

// Confiar en proxy (Cloudflare)
app.set('trust proxy', 1);

// Seguridad: Headers HTTP
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Permitir cargar imagenes
}));

// Ocultar que usamos Express
app.disable('x-powered-by');

// CORS - debe ir ANTES del rate limiter
const allowedOrigins = [
  'https://pulsoumedia.com',
  'https://api.pulsoumedia.com',
  // Solo en desarrollo:
  ...(process.env.NODE_ENV !== 'production' ? [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    config.frontendUrl,
    'http://100.105.8.14:5173'
  ] : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Rate limiting general (más permisivo para uso normal de la app)
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: process.env.NODE_ENV === 'production' ? 200 : 1000, // 200 por minuto en producción, 1000 en desarrollo
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Demasiadas solicitudes, intenta mas tarde' } }
});
app.use(generalLimiter);

// Rate limiting estricto para login
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: process.env.NODE_ENV === 'production' ? 15 : 100, // 15 intentos en 5 min en producción
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Demasiados intentos de login, intenta en 5 minutos' } }
});
app.use('/api/auth/login', loginLimiter);

// Rate limiting para formulario publico
const publicFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 solicitudes por hora
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Has enviado demasiadas solicitudes, intenta mas tarde' } }
});
app.use('/api/event-requests/public/submit', publicFormLimiter);

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
app.use('/api/event-requests', eventRequestRoutes);
app.use('/api/kiosk', kioskRoutes);
app.use('/api/hours-carry-over', hoursCarryOverRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${config.port}`);
});
