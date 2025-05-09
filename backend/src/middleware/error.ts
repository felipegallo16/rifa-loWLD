import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Por favor, verifica tu identidad con World ID'
    });
  }

  return res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
}; 