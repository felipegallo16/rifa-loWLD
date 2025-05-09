import { Router } from 'express';
import { StatsController } from '../controllers/StatsController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const statsController = new StatsController();

// Esquemas de validación
const trendStatsSchema = z.object({
  days: z.number().int().min(1).max(365).optional(),
});

// Rutas públicas
router.get('/global', statsController.getGlobalStats);
router.get('/trends', validateRequest(trendStatsSchema), statsController.getTrendStats);

// Rutas protegidas
router.get('/raffles/:raffleId', requireAuth, statsController.getRaffleStats);

// Rutas de administración
router.post(
  '/raffles/:raffleId/update',
  requireAdmin,
  statsController.updateRaffleStats
);

export default router; 