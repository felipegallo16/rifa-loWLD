import { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { AppError } from './errorHandler';

const prisma = new PrismaClient();

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
    where: { nullifierHash },
  });

  if (!user) {
    throw new AppError(401, 'Usuario no encontrado');
  }

  req.user = user;
  next();
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, async () => {
    if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
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
    if (req.user?.role !== UserRole.SUPER_ADMIN) {
      throw new AppError(403, 'Acceso denegado: Se requieren permisos de super administrador');
    }
    next();
  });
}; 