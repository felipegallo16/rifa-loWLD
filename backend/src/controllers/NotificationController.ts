import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { notificationService } from '../services/NotificationService';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class NotificationController {
  async getNotifications(req: Request, res: Response) {
    const nullifierHash = req.headers['x-worldid-nullifier'] as string;
    
    if (!nullifierHash) {
      throw new AppError(401, 'Usuario no autenticado');
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: nullifierHash,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        raffle: {
          select: {
            title: true,
            status: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      notifications,
    });
  }

  async markAsRead(req: Request, res: Response) {
    const nullifierHash = req.headers['x-worldid-nullifier'] as string;
    const { notificationId } = req.params;

    if (!nullifierHash) {
      throw new AppError(401, 'Usuario no autenticado');
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: nullifierHash,
      },
    });

    if (!notification) {
      throw new AppError(404, 'Notificación no encontrada');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'SENT' },
    });

    return res.json({
      success: true,
      message: 'Notificación marcada como leída',
    });
  }

  async sendWinnerNotification(req: Request, res: Response) {
    const { raffleId, winnerNullifierHash } = req.body;

    try {
      await notificationService.notifyWinner(raffleId, winnerNullifierHash);
      return res.json({
        success: true,
        message: 'Notificación enviada al ganador',
      });
    } catch (error) {
      throw new AppError(500, 'Error al enviar la notificación al ganador');
    }
  }

  async sendUpdateNotification(req: Request, res: Response) {
    const { raffleId, message } = req.body;

    try {
      await notificationService.notifyParticipants(raffleId, message);
      return res.json({
        success: true,
        message: 'Notificaciones enviadas a los participantes',
      });
    } catch (error) {
      throw new AppError(500, 'Error al enviar las notificaciones');
    }
  }
} 