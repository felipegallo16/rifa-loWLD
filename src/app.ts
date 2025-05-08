import express, { Express } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error';
import { setupRoutes } from './routes';
import { setupMiddleware } from './middleware';
import { validateEnv } from './utils/validateEnv';

export function setupApp(): Express {
  // Validar variables de entorno
  validateEnv();

  const app = express();

  // Configuración de CORS
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));

  // Middleware básico
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Configurar middleware personalizado
  setupMiddleware(app);

  // Configurar rutas
  setupRoutes(app);

  // Manejador de errores
  app.use(errorHandler);

  return app;
}

// Solo si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
  const app = setupApp();
  const PORT = process.env.PORT || 3001;

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
} 