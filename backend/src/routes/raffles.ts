import { Router } from 'express';
import { RaffleController } from '../controllers/RaffleController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const raffleController = new RaffleController();

// Esquemas de validación
const createRaffleSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  price: z.number().positive(),
  totalTickets: z.number()
    .int()
    .min(10, "El sorteo debe tener al menos 10 tickets")
    .max(10000, "El máximo de tickets permitido es 10000")
    .refine((val) => val > 0, {
      message: "La cantidad de tickets debe ser mayor a 0"
    }),
  endDate: z.string().datetime(),
});

const updateRaffleSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(1000).optional(),
  price: z.number().positive().optional(),
  totalTickets: z.number()
    .int()
    .min(10, "El sorteo debe tener al menos 10 tickets")
    .max(10000, "El máximo de tickets permitido es 10000")
    .refine((val) => val > 0, {
      message: "La cantidad de tickets debe ser mayor a 0"
    })
    .optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['OPEN', 'CLOSED', 'CANCELLED']).optional(),
});

// Rutas públicas
router.get('/', requireAuth, raffleController.getAllRaffles);
router.get('/:id', requireAuth, raffleController.getRaffleById);

// Rutas protegidas (requieren autenticación)
router.get('/user/participating', requireAuth, raffleController.getUserParticipatingRaffles);
router.get('/user/created', requireAuth, raffleController.getUserCreatedRaffles);

// Rutas de administración
router.post(
  '/',
  requireAdmin,
  validateRequest(createRaffleSchema),
  raffleController.createRaffle
);

router.put(
  '/:id',
  requireAdmin,
  validateRequest(updateRaffleSchema),
  raffleController.updateRaffle
);

router.delete('/:id', requireAdmin, raffleController.deleteRaffle);

// Rutas especiales
router.post('/:id/draw', requireAdmin, raffleController.drawWinner);
router.post('/:id/cancel', requireAdmin, raffleController.cancelRaffle);

export default router; 