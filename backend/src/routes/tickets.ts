import { Router } from 'express';
import { TicketController } from '../controllers/TicketController';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const ticketController = new TicketController();

// Esquemas de validación
const purchaseTicketsSchema = z.object({
  raffleId: z.string().uuid(),
  selectedNumbers: z.array(z.number().int().positive())
    .min(1, "Debes seleccionar al menos un número")
    .refine(
      numbers => new Set(numbers).size === numbers.length,
      "No puedes seleccionar el mismo número más de una vez"
    )
});

const reserveNumbersSchema = z.object({
  numbers: z.array(z.number().int().positive())
    .min(1, "Debes seleccionar al menos un número")
    .max(10, "Puedes reservar máximo 10 números a la vez")
    .refine(
      numbers => new Set(numbers).size === numbers.length,
      "No puedes reservar el mismo número más de una vez"
    )
});

// Rutas protegidas (requieren autenticación)
router.get('/user', requireAuth, ticketController.getUserTickets);
router.get('/raffle/:raffleId', requireAuth, ticketController.getRaffleTickets);
router.get('/:id', requireAuth, ticketController.getTicketById);

// Rutas de números
router.get(
  '/raffle/:raffleId/available',
  requireAuth,
  ticketController.getAvailableNumbers
);

router.get(
  '/raffle/:raffleId/random',
  requireAuth,
  ticketController.getRandomNumber
);

router.get(
  '/raffle/:raffleId/search',
  requireAuth,
  ticketController.searchNumbers
);

router.get(
  '/raffle/:raffleId/suggest',
  requireAuth,
  ticketController.getSuggestedNumbers
);

// Reserva y compra de tickets
router.post(
  '/raffle/:raffleId/reserve',
  requireAuth,
  validateRequest(reserveNumbersSchema),
  ticketController.reserveNumbers
);

router.post(
  '/purchase',
  requireAuth,
  validateRequest(purchaseTicketsSchema),
  ticketController.purchaseTickets
);

// Verificar ticket
router.get(
  '/:id/verify',
  requireAuth,
  ticketController.verifyTicket
);

export default router; 