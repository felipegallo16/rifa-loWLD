import { Router } from 'express';
import { RaffleController } from '../controllers/RaffleController';

const router = Router();
const raffleController = new RaffleController();

// Rutas de prueba (sin autenticación)
router.get('/raffles', raffleController.getAllRaffles);
router.get('/raffles/:id', raffleController.getRaffleById);
router.post('/raffles', raffleController.createRaffle);
router.post('/raffles/:id/draw', raffleController.drawWinner);

export default router; 