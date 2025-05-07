import nodemailer from 'nodemailer';
import { PrismaClient, Notification, Prisma } from '@prisma/client';

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
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Vincular métodos
    this.notifyWinner = this.notifyWinner.bind(this);
    this.notifyRaffleUpdate = this.notifyRaffleUpdate.bind(this);
    this.notifyRaffleCancellation = this.notifyRaffleCancellation.bind(this);
  }

  private async sendEmail(config: EmailConfig): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        ...config,
      });
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  private async getWinnerEmail(nullifierHash: string): Promise<string | null> {
    try {
      const winner = await prisma.user.findUnique({
        where: { nullifierHash },
        select: { email: true },
      });
      return winner?.email || null;
    } catch (error) {
      console.error('Error getting winner email:', error);
      return null;
    }
  }

  async createNotification(
    userId: string,
    raffleId: string,
    type: NotificationType,
    content: string
  ): Promise<Notification> {
    try {
      return await prisma.notification.create({
        data: {
          userId,
          raffleId,
          type,
          status: 'PENDING',
          content,
        },
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async notifyWinner(raffle: RaffleWithTickets, winningTicket: { userId: string }) {
    try {
      // Notificar al ganador
      const notification = await this.createNotification(
        winningTicket.userId,
        raffle.id,
        'WINNER',
        `¡Felicitaciones! Has ganado el sorteo "${raffle.title}"`
      );

      // Enviar email al ganador
      const winnerEmail = await this.getWinnerEmail(winningTicket.userId);
      if (winnerEmail) {
        await this.sendEmail({
          to: winnerEmail,
          subject: `¡Felicitaciones! Has ganado el sorteo "${raffle.title}"`,
          html: `
            <h1>¡Felicitaciones!</h1>
            <p>Has resultado ganador del sorteo "${raffle.title}".</p>
            <p>Nos pondremos en contacto contigo pronto para coordinar la entrega del premio.</p>
          `,
        });
      }

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
      console.error('Error notifying winner:', error);
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
      console.error('Error notifying raffle update:', error);
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
      console.error('Error notifying raffle cancellation:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService(); 