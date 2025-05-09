import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Clases de error personalizadas
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
    public errorCode?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, true, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(401, message, true, 'AUTHENTICATION_ERROR');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(403, message, true, 'FORBIDDEN_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message, true, 'NOT_FOUND_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string) {
    super(429, message, true, 'RATE_LIMIT_ERROR');
  }
}

export class WorldIDVerificationError extends AppError {
  constructor(message: string) {
    super(400, message, true, 'WORLD_ID_VERIFICATION_ERROR');
  }
}

// Middleware de manejo de errores
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log del error
  logger.error('Error occurred:', {
    error: err,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });

  // Si es un error de la aplicación
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      errorCode: err.errorCode,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Si es un error de validación de Zod
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'Error de validación',
      details: err.message,
    });
  }

  // Si es un error de Prisma
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      errorCode: 'DATABASE_ERROR',
      message: 'Error en la operación de base de datos',
    });
  }

  // Error por defecto
  return res.status(500).json({
    success: false,
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
      stack: err.stack,
    }),
  });
}; 