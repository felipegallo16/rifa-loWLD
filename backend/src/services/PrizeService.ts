import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { notificationService } from './NotificationService';

const prisma = new PrismaClient();

interface ClaimData {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  preferredDeliveryTime?: string;
  additionalNotes?: string;
}

export class PrizeService {
  constructor() {
    this.createPrize = this.createPrize.bind(this);
    this.claimPrize = this.claimPrize.bind(this);
    this.getPrizeStatus = this.getPrizeStatus.bind(this);
  }

  async createPrize(raffleId: string, winnerId: string) {
    try {
      const prize = await prisma.prize.create({
        data: {
          raffleId,
          winnerId,
          status: 'PENDING'
        },
        include: {
          raffle: true,
          winner: true
        }
      });

      // Enviar notificación al ganador sobre cómo reclamar su premio
      await notificationService.createNotification(
        winnerId,
        raffleId,
        'WINNER',
        `¡Felicitaciones! Has ganado el sorteo "${prize.raffle.title}". Tienes 72 horas para reclamar tu premio. Ingresa a la app y dirígete a la sección de premios.`
      );

      // Programar recordatorio para 48 horas si no ha reclamado
      setTimeout(async () => {
        const updatedPrize = await prisma.prize.findUnique({
          where: { id: prize.id }
        });

        if (updatedPrize && updatedPrize.status === 'PENDING') {
          await notificationService.createNotification(
            winnerId,
            raffleId,
            'REMINDER',
            `¡No olvides reclamar tu premio del sorteo "${prize.raffle.title}"! Te quedan 24 horas.`
          );
        }
      }, 48 * 60 * 60 * 1000); // 48 horas

      return prize;
    } catch (error) {
      logger.error('Error creating prize:', error);
      throw error;
    }
  }

  async claimPrize(prizeId: string, userId: string, claimData: ClaimData) {
    try {
      const prize = await prisma.prize.findUnique({
        where: { id: prizeId },
        include: {
          raffle: true
        }
      });

      if (!prize) {
        throw new Error('Premio no encontrado');
      }

      if (prize.winnerId !== userId) {
        throw new Error('No estás autorizado para reclamar este premio');
      }

      if (prize.status !== 'PENDING') {
        throw new Error('Este premio ya ha sido reclamado');
      }

      // Verificar que no hayan pasado más de 72 horas
      const hoursElapsed = (Date.now() - prize.createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursElapsed > 72) {
        throw new Error('El tiempo para reclamar el premio ha expirado');
      }

      // Actualizar el premio con los datos de reclamo
      const updatedPrize = await prisma.prize.update({
        where: { id: prizeId },
        data: {
          status: 'CLAIMED',
          claimData,
          claimedAt: new Date()
        }
      });

      // Notificar al ganador que su reclamo fue exitoso
      await notificationService.createNotification(
        userId,
        prize.raffleId,
        'UPDATE',
        `Tu premio del sorteo "${prize.raffle.title}" ha sido reclamado exitosamente. Nos pondremos en contacto contigo pronto para coordinar la entrega.`
      );

      return updatedPrize;
    } catch (error) {
      logger.error('Error claiming prize:', error);
      throw error;
    }
  }

  async getPrizeStatus(prizeId: string, userId: string) {
    try {
      const prize = await prisma.prize.findUnique({
        where: { id: prizeId },
        include: {
          raffle: {
            select: {
              title: true,
              description: true
            }
          }
        }
      });

      if (!prize) {
        throw new Error('Premio no encontrado');
      }

      if (prize.winnerId !== userId) {
        throw new Error('No estás autorizado para ver este premio');
      }

      return {
        ...prize,
        canClaim: prize.status === 'PENDING' && 
                 (Date.now() - prize.createdAt.getTime()) / (1000 * 60 * 60) <= 72,
        hoursRemaining: Math.max(
          0,
          72 - (Date.now() - prize.createdAt.getTime()) / (1000 * 60 * 60)
        )
      };
    } catch (error) {
      logger.error('Error getting prize status:', error);
      throw error;
    }
  }
}

export const prizeService = new PrizeService(); 