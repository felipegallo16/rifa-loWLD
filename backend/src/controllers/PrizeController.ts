import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { prizeService } from '../services/PrizeService';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class PrizeController {
  async getUserPrizes(req: Request, res: Response) {
    try {
      const userId = req.user?.nullifierHash;
      
      if (!userId) {
        throw new AppError(401, 'Usuario no autenticado');
      }

      const prizes = await prisma.prize.findMany({
        where: {
          winnerId: userId
        },
        include: {
          raffle: {
            select: {
              title: true,
              description: true,
              endDate: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Calcular tiempo restante para reclamar cada premio
      const prizesWithStatus = prizes.map(prize => ({
        ...prize,
        canClaim: prize.status === 'PENDING' && 
                 (Date.now() - prize.createdAt.getTime()) / (1000 * 60 * 60) <= 72,
        hoursRemaining: Math.max(
          0,
          72 - (Date.now() - prize.createdAt.getTime()) / (1000 * 60 * 60)
        )
      }));

      return res.json({
        success: true,
        prizes: prizesWithStatus
      });
    } catch (error) {
      logger.error('Error getting user prizes:', error);
      if (error instanceof AppError) {
        return res.status(error.httpStatus).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async getPrizeDetails(req: Request, res: Response) {
    try {
      const userId = req.user?.nullifierHash;
      const { prizeId } = req.params;
      
      if (!userId) {
        throw new AppError(401, 'Usuario no autenticado');
      }

      const prizeStatus = await prizeService.getPrizeStatus(prizeId, userId);

      return res.json({
        success: true,
        prize: prizeStatus
      });
    } catch (error) {
      logger.error('Error getting prize details:', error);
      if (error instanceof AppError) {
        return res.status(error.httpStatus).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async claimPrize(req: Request, res: Response) {
    try {
      const userId = req.user?.nullifierHash;
      const { prizeId } = req.params;
      const claimData = req.body;
      
      if (!userId) {
        throw new AppError(401, 'Usuario no autenticado');
      }

      const updatedPrize = await prizeService.claimPrize(prizeId, userId, claimData);

      return res.json({
        success: true,
        prize: updatedPrize,
        message: 'Premio reclamado exitosamente'
      });
    } catch (error) {
      logger.error('Error claiming prize:', error);
      if (error instanceof AppError) {
        return res.status(error.httpStatus).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

export const prizeController = new PrizeController(); 