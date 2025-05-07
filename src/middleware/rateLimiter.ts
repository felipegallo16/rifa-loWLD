import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limiter para endpoints generales
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana por IP
  message: { error: 'Demasiadas peticiones, por favor intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter específico para verificación de World ID
export const worldIDLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // límite de 5 intentos de verificación por hora por IP
  message: { error: 'Demasiados intentos de verificación, por favor espera una hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para compra de tickets
export const ticketPurchaseLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // límite de 10 compras por 5 minutos
  message: { error: 'Demasiadas compras en poco tiempo, por favor espera unos minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
}); 