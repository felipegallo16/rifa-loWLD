import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  nullifierHash?: string;
}

export const requireWorldID = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const nullifierHash = req.headers['x-worldid-nullifier'] as string;

  if (!nullifierHash) {
    return res.status(401).json({
      success: false,
      error: 'Se requiere verificación de World ID'
    });
  }

  try {
    // Aquí podrías verificar en la base de datos si el nullifier_hash
    // corresponde a una verificación válida y no expirada
    
    // Por ahora solo pasamos el nullifier_hash a la request
    req.nullifierHash = nullifierHash;
    next();
  } catch (error) {
    console.error('Error en middleware de World ID:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar la autenticación'
    });
  }
}; 