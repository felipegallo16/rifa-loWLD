import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generalLimiter } from './middleware/rateLimiter';
import { securityMiddleware } from './middleware/security';
import { errorHandler } from './middleware/errorHandler';
import raffleRoutes from './routes/raffles';
import ticketRoutes from './routes/tickets';
import worldIDRoutes from './routes/worldid';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import historyRoutes from './routes/history';
import statsRoutes from './routes/stats';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de seguridad
app.use(securityMiddleware);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting global
app.use(generalLimiter);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/raffles', raffleRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/verify', worldIDRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/stats', statsRoutes);

// Manejo de errores
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 