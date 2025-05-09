import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { Request, Response } from 'express';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

// Configuraciones específicas para diferentes tipos de rutas
export const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos de autenticación, por favor espera 15 minutos',
  standardHeaders: true,
  legacyHeaders: false,
});

export const purchaseLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)),
  }),
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 intentos
  message: 'Has excedido el límite de intentos de compra, por favor espera 1 hora',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)),
  }),
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 solicitudes por minuto
  message: 'Demasiadas solicitudes, por favor intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware personalizado para rutas críticas
export const criticalActionLimiter = (
  req: Request,
  res: Response,
  next: Function
) => {
  const userId = req.user?.nullifierHash;
  if (!userId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const key = `critical:${userId}`;
  redis.incr(key, (err, count) => {
    if (err) {
      console.error('Error en rate limiting:', err);
      return next();
    }

    // Primera vez que se ve esta key
    if (count === 1) {
      redis.expire(key, 3600); // Expira en 1 hora
    }

    if (count > 10) { // Máximo 10 acciones críticas por hora
      return res.status(429).json({
        error: 'Has excedido el límite de acciones críticas',
        resetTime: redis.ttl(key)
      });
    }

    next();
  });
}; 