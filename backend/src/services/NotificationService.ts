import { PrismaClient, Notification, Prisma } from '@prisma/client';
import { MiniKit } from '@worldcoin/minikit-js';
import worldcoinConfig from '../config/worldcoin';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface RaffleWithTickets {
  id: string;
  title: string;
  status: string;
  tickets: Array<{
    userId: string;
  }>;
}

type Ticket = Prisma.TicketGetPayload<{}>;

export class NotificationService {
  constructor() {
    // Vincular métodos
    this.notifyWinner = this.notifyWinner.bind(this);
    this.notifyRaffleUpdate = this.notifyRaffleUpdate.bind(this);
    this.notifyRaffleCancellation = this.notifyRaffleCancellation.bind(this);
  }

  private async sendWorldAppNotification(
    nullifierHash: string,
    title: string,
    message: string,
    path?: string
  ): Promise<boolean> {
    try {
      await fetch('https://developer.worldcoin.org/api/v2/minikit/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WORLD_DEVELOPER_API_KEY}`
        },
        body: JSON.stringify({
          app_id: worldcoinConfig.app_id,
          nullifier_hashes: [nullifierHash],
          title: title.substring(0, 30), // Límite de 30 caracteres
          message: message.substring(0, 200), // Límite de 200 caracteres
          path: path || '/' // Ruta dentro de la mini-app a la que dirigir al usuario
        })
      });
      return true;
    } catch (error) {
      logger.error('Error sending World App notification:', error);
      return false;
    }
  }

  async createNotification(
    userId: string,
    raffleId: string,
    type: NotificationType,
    content: string
  ): Promise<Notification> {
    try {
      // Crear la notificación en la base de datos
      const notification = await prisma.notification.create({
        data: {
          userId,
          raffleId,
          type,
          status: 'PENDING',
          content,
        },
      });

      // Enviar notificación a través de World App
      const title = type === 'WINNER' ? '¡Felicitaciones!' : 'Actualización del Sorteo';
      const path = `/raffles/${raffleId}`;
      await this.sendWorldAppNotification(userId, title, content, path);

      // Actualizar estado de la notificación
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'SENT' }
      });

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  async notifyWinner(raffle: RaffleWithTickets, winningTicket: { userId: string }) {
    try {
      // Notificar al ganador
      await this.createNotification(
        winningTicket.userId,
        raffle.id,
        'WINNER',
        `¡Felicitaciones! Has ganado el sorteo "${raffle.title}". Ingresa a la app para ver los detalles de tu premio.`
      );

      // Notificar a los demás participantes
      const participants = await prisma.ticket.findMany({
        where: {
          raffleId: raffle.id,
          NOT: {
            userId: winningTicket.userId,
          },
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });

      await Promise.all(
        participants.map((participant) =>
          this.createNotification(
            participant.userId,
            raffle.id,
            'UPDATE',
            `El sorteo "${raffle.title}" ha finalizado. ¡Gracias por participar!`
          )
        )
      );
    } catch (error) {
      logger.error('Error notifying winner:', error);
      throw error;
    }
  }

  async notifyRaffleUpdate(raffle: RaffleWithTickets) {
    try {
      const participants = await prisma.ticket.findMany({
        where: {
          raffleId: raffle.id,
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });

      await Promise.all(
        participants.map((participant) =>
          this.createNotification(
            participant.userId,
            raffle.id,
            'UPDATE',
            `El sorteo "${raffle.title}" ha sido actualizado. Estado: ${raffle.status}`
          )
        )
      );
    } catch (error) {
      logger.error('Error notifying raffle update:', error);
      throw error;
    }
  }

  async notifyRaffleCancellation(raffle: RaffleWithTickets) {
    try {
      const participants = await prisma.ticket.findMany({
        where: {
          raffleId: raffle.id,
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });

      await Promise.all(
        participants.map((participant) =>
          this.createNotification(
            participant.userId,
            raffle.id,
            'UPDATE',
            `El sorteo "${raffle.title}" ha sido cancelado. Se procesará el reembolso de tus tickets.`
          )
        )
      );
    } catch (error) {
      logger.error('Error notifying raffle cancellation:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService(); 