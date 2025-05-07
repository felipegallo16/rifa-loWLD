import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../services/NotificationService';
import { StatsService } from '../services/StatsService';

const prisma = new PrismaClient();
const notificationService = new NotificationService();
const statsService = new StatsService();

export class RaffleController {
  constructor() {
    // Vincular los métodos al contexto de la clase
    this.getAllRaffles = this.getAllRaffles.bind(this);
    this.getRaffleById = this.getRaffleById.bind(this);
    this.getUserParticipatingRaffles = this.getUserParticipatingRaffles.bind(this);
    this.getUserCreatedRaffles = this.getUserCreatedRaffles.bind(this);
    this.createRaffle = this.createRaffle.bind(this);
    this.updateRaffle = this.updateRaffle.bind(this);
    this.deleteRaffle = this.deleteRaffle.bind(this);
    this.drawWinner = this.drawWinner.bind(this);
    this.cancelRaffle = this.cancelRaffle.bind(this);
  }

  // Obtener todos los sorteos
  async getAllRaffles(req: Request, res: Response) {
    try {
      const raffles = await prisma.raffle.findMany({
        include: {
          stats: true,
          tickets: {
            select: {
              id: true,
              number: true,
              userId: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json(raffles);
    } catch (error) {
      console.error('Error getting raffles:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Obtener un sorteo por ID
  async getRaffleById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const raffle = await prisma.raffle.findUnique({
        where: { id },
        include: {
          stats: true,
          tickets: {
            select: {
              id: true,
              number: true,
              userId: true,
            },
          },
        },
      });

      if (!raffle) {
        return res.status(404).json({ error: 'Raffle not found' });
      }

      return res.json(raffle);
    } catch (error) {
      console.error('Error getting raffle:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Obtener sorteos en los que participa un usuario
  async getUserParticipatingRaffles(req: Request, res: Response) {
    try {
      const userId = req.user.nullifierHash;
      const raffles = await prisma.raffle.findMany({
        where: {
          tickets: {
            some: {
              userId,
            },
          },
        },
        include: {
          stats: true,
          tickets: {
            where: {
              userId,
            },
            select: {
              id: true,
              number: true,
            },
          },
        },
      });

      return res.json(raffles);
    } catch (error) {
      console.error('Error getting user participating raffles:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Obtener sorteos creados por un usuario (admin)
  async getUserCreatedRaffles(req: Request, res: Response) {
    try {
      const userId = req.user.nullifierHash;
      const raffles = await prisma.raffle.findMany({
        where: {
          createdBy: userId,
        },
        include: {
          stats: true,
          tickets: {
            select: {
              id: true,
              number: true,
              userId: true,
            },
          },
        },
      });

      return res.json(raffles);
    } catch (error) {
      console.error('Error getting user created raffles:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Crear un nuevo sorteo
  async createRaffle(req: Request, res: Response) {
    try {
      const { title, description, price, totalTickets, endDate } = req.body;
      const createdBy = req.user?.nullifierHash;

      if (!createdBy) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const raffle = await prisma.raffle.create({
        data: {
          title,
          description,
          price,
          totalTickets,
          endDate: new Date(endDate),
          createdBy,
          stats: {
            create: {
              totalRevenue: 0,
              ticketsSold: 0,
              uniqueParticipants: 0,
              averageTicketsPerUser: 0,
            },
          },
        },
        include: {
          stats: true,
        },
      });

      // Inicializar estadísticas
      await statsService.updateRaffleStats(raffle.id);

      return res.status(201).json(raffle);
    } catch (error) {
      console.error('Error creating raffle:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Actualizar un sorteo
  async updateRaffle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const raffle = await prisma.raffle.update({
        where: { id },
        data: updateData,
        include: {
          stats: true,
          tickets: true,
        },
      });

      // Actualizar estadísticas si es necesario
      if (updateData.price || raffle.status !== 'OPEN') {
        await statsService.updateRaffleStats(raffle.id);
      }

      // Notificar a los participantes sobre la actualización
      if (raffle.status !== 'OPEN') {
        await notificationService.notifyRaffleUpdate(raffle);
      }

      return res.json(raffle);
    } catch (error) {
      console.error('Error updating raffle:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Eliminar un sorteo
  async deleteRaffle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verificar si el sorteo existe y no tiene tickets vendidos
      const raffle = await prisma.raffle.findUnique({
        where: { id },
        include: { tickets: true },
      });

      if (!raffle) {
        return res.status(404).json({ error: 'Raffle not found' });
      }

      if (raffle.tickets.length > 0) {
        return res.status(400).json({ error: 'Cannot delete raffle with sold tickets' });
      }

      await prisma.raffle.delete({
        where: { id },
      });

      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting raffle:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Realizar el sorteo
  async drawWinner(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const raffle = await prisma.raffle.findUnique({
        where: { id },
        include: { tickets: true },
      });

      if (!raffle) {
        return res.status(404).json({ error: 'Raffle not found' });
      }

      if (raffle.status !== 'OPEN') {
        return res.status(400).json({ error: 'Raffle is not open' });
      }

      if (raffle.tickets.length === 0) {
        return res.status(400).json({ error: 'No tickets sold' });
      }

      // Seleccionar un ticket al azar
      const winningTicket = raffle.tickets[Math.floor(Math.random() * raffle.tickets.length)];

      // Actualizar el sorteo
      const updatedRaffle = await prisma.raffle.update({
        where: { id },
        data: {
          status: 'CLOSED',
          winnerId: winningTicket.userId,
        },
        include: {
          stats: true,
        },
      });

      // Notificar al ganador y a los participantes
      await notificationService.notifyWinner(updatedRaffle, winningTicket);

      return res.json({
        raffle: updatedRaffle,
        winner: winningTicket,
      });
    } catch (error) {
      console.error('Error drawing winner:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Cancelar un sorteo
  async cancelRaffle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const raffle = await prisma.raffle.update({
        where: { id },
        data: {
          status: 'CANCELLED',
        },
        include: {
          stats: true,
          tickets: {
            select: {
              userId: true,
            },
          },
        },
      });

      // Notificar a los participantes sobre la cancelación
      await notificationService.notifyRaffleCancellation(raffle);

      return res.json(raffle);
    } catch (error) {
      console.error('Error cancelling raffle:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 