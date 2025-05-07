import { Router } from 'express';
import raffleRoutes from './raffles';
import ticketRoutes from './tickets';
import worldIDRoutes from './worldid';

const router = Router();

// Rutas principales
router.use('/raffles', raffleRoutes);
router.use('/tickets', ticketRoutes);
router.use('/worldid', worldIDRoutes);

export default router; 