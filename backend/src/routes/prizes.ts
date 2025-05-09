import { Router } from 'express';
import { PrizeController } from '../controllers/PrizeController';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const prizeController = new PrizeController();

// Esquemas de validación
const claimPrizeSchema = z.object({
  fullName: z.string().min(3).max(100),
  phone: z.string().min(8).max(20),
  email: z.string().email(),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  country: z.string().min(2).max(100),
  postalCode: z.string().min(3).max(20),
  preferredDeliveryTime: z.string().optional(),
  additionalNotes: z.string().max(500).optional()
});

// Rutas
router.get('/user/prizes', requireAuth, prizeController.getUserPrizes);
router.get('/prize/:prizeId', requireAuth, prizeController.getPrizeDetails);
router.post(
  '/prize/:prizeId/claim',
  requireAuth,
  validateRequest(claimPrizeSchema),
  prizeController.claimPrize
);

export default router; 