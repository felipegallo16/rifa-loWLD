import { Application } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

export const setupMiddleware = (app: Application) => {
  // Seguridad básica
  app.use(helmet());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // límite de 100 peticiones por ventana
  });
  app.use(limiter);

  // Más middleware aquí si es necesario
}; 