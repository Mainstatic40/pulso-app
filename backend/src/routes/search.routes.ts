import { Router } from 'express';
import { searchController } from '../controllers/search.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All search routes require authentication
router.use(authenticate);

// GET /api/search?q=query
router.get('/', searchController.search);

export default router;
