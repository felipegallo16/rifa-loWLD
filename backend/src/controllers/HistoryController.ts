import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class HistoryController {
  // Obtener historial de participaciones del usuario
  async getUserHistory(req: Request, res: Response) {
    const nullifierHash = req.headers['x-worldid-nullifier'] as string;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    try {
      const [participations, total] = await Promise.all([
        prisma.ticket.findMany({
          where: {
            userId: nullifierHash,
          },
          skip,
          take: Number(limit),
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            raffle: {
              select: {
                title: true,
                description: true,
                status: true,
                endDate: true,
                winnerId: true,
                price: true,
              },
            },
          },
        }),
        prisma.ticket.count({
          where: {
            userId: nullifierHash,
          },
        }),
      ]);

      // Agrupar tickets por sorteo
      const participationsByRaffle = participations.reduce((acc, ticket) => {
        const raffleId = ticket.raffleId;
        if (!acc[raffleId]) {
          acc[raffleId] = {
            raffle: ticket.raffle,
            tickets: [],
            totalInvested: 0,
          };
        }
        acc[raffleId].tickets.push(ticket);
        acc[raffleId].totalInvested += ticket.raffle.price;
        return acc;
      }, {} as Record<string, any>);

      return res.json({
        success: true,
        history: Object.values(participationsByRaffle),
        pagination: {
          total,
          pages: Math.ceil(total / Number(limit)),
          currentPage: Number(page),
          perPage: Number(limit),
        },
      });
    } catch (error) {
      throw new AppError(500, 'Error al obtener el historial de participaciones');
    }
  }

  // Obtener estadísticas de participación del usuario
  async getUserStats(req: Request, res: Response) {
    const nullifierHash = req.headers['x-worldid-nullifier'] as string;

    try {
      const [
        totalParticipations,
        wonRaffles,
        totalInvested,
        activeParticipations,
      ] = await Promise.all([
        prisma.ticket.count({
          where: {
            userId: nullifierHash,
          },
        }),
        prisma.raffle.count({
          where: {
            winnerId: nullifierHash,
          },
        }),
        prisma.ticket.findMany({
          where: {
            userId: nullifierHash,
          },
          include: {
            raffle: {
              select: {
                price: true,
              },
            },
          },
        }).then(tickets => 
          tickets.reduce((sum, ticket) => sum + ticket.raffle.price, 0)
        ),
        prisma.ticket.count({
          where: {
            userId: nullifierHash,
            raffle: {
              status: 'OPEN',
            },
          },
        }),
      ]);

      return res.json({
        success: true,
        stats: {
          totalParticipations,
          wonRaffles,
          totalInvested,
          activeParticipations,
          winRate: totalParticipations > 0 
            ? (wonRaffles / totalParticipations) * 100 
            : 0,
        },
      });
    } catch (error) {
      throw new AppError(500, 'Error al obtener las estadísticas del usuario');
    }
  }

  // Obtener detalles de una participación específica
  async getParticipationDetails(req: Request, res: Response) {
    const nullifierHash = req.headers['x-worldid-nullifier'] as string;
    const { raffleId } = req.params;

    try {
      const participation = await prisma.ticket.findMany({
        where: {
          userId: nullifierHash,
          raffleId,
        },
        include: {
          raffle: {
            select: {
              title: true,
              description: true,
              status: true,
              endDate: true,
              winnerId: true,
              price: true,
              totalTickets: true,
              soldTickets: true,
            },
          },
        },
      });

      if (!participation.length) {
        throw new AppError(404, 'No se encontró la participación');
      }

      const totalInvested = participation.reduce((sum, ticket) => 
        sum + ticket.raffle.price, 0
      );

      const winningChance = (participation.length / participation[0].raffle.totalTickets) * 100;

      return res.json({
        success: true,
        participation: {
          tickets: participation,
          totalInvested,
          winningChance,
          isWinner: participation[0].raffle.winnerId === nullifierHash,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error al obtener los detalles de la participación');
    }
  }
} 