import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from './errorHandler';

const prisma = new PrismaClient();

type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        nullifier_hash: string;
        role: UserRole;
      };
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const nullifierHash = req.headers['x-worldid-nullifier'] as string;

  if (!nullifierHash) {
    throw new AppError(401, 'Usuario no autenticado');
  }

  const user = await prisma.user.findUnique({
    where: { nullifier_hash: nullifierHash },
  });

  if (!user) {
    throw new AppError(401, 'Usuario no encontrado');
  }

  req.user = {
    id: user.id,
    nullifier_hash: user.nullifier_hash,
    role: user.role as UserRole
  };
  
  next();
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, async () => {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      throw new AppError(403, 'Acceso denegado: Se requieren permisos de administrador');
    }
    next();
  });
};

export const requireSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, async () => {
    if (req.user?.role !== 'SUPER_ADMIN') {
      throw new AppError(403, 'Acceso denegado: Se requieren permisos de super administrador');
    }
    next();
  });
}; 