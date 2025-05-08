import { Express } from 'express';
import worldIDRoutes from './worldid';
import ticketRoutes from './tickets';
import raffleRoutes from './raffles';
import prizeRoutes from './prizes';
import { generalLimiter } from '../middleware/rateLimiter';
import { RaffleController } from '../controllers/RaffleController';

export const setupRoutes = (app: Express) => {
  // Aplicar rate limiter general a todas las rutas
  app.use(generalLimiter);

  // Instanciar controladores
  const raffleController = new RaffleController();

  // Rutas de prueba (sin autenticación)
  app.get('/test/raffles', raffleController.getAllRaffles);
  app.get('/test/raffles/:id', raffleController.getRaffleById);
  app.post('/test/raffles', raffleController.createRaffle);
  app.post('/test/raffles/:id/draw', raffleController.drawWinner);

  // Rutas principales (con autenticación)
  app.use('/api/v1/worldid', worldIDRoutes);
  app.use('/api/v1/tickets', ticketRoutes);
  app.use('/api/v1/raffles', raffleRoutes);
  app.use('/api/v1/prizes', prizeRoutes);

  // Ruta de health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Manejador de rutas no encontradas
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Ruta no encontrada'
    });
  });
}; 