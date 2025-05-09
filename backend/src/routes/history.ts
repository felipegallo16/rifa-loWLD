import { Router } from 'express';
import { HistoryController } from '../controllers/HistoryController';
import { requireAuth } from '../middleware/auth';

const router = Router();
const historyController = new HistoryController();

// Rutas del historial
router.get('/', requireAuth, historyController.getUserHistory);
router.get('/stats', requireAuth, historyController.getUserStats);
router.get('/:raffleId', requireAuth, historyController.getParticipationDetails);

export default router; 