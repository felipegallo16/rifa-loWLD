import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class AdminController {
  // Dashboard general
  async getDashboardStats(req: Request, res: Response) {
    try {
      const [
        totalRaffles,
        activeRaffles,
        totalRevenue,
        totalUsers,
        recentRaffles
      ] = await Promise.all([
        prisma.raffle.count(),
        prisma.raffle.count({
          where: { status: 'OPEN' }
        }),
        prisma.raffleStats.aggregate({
          _sum: {
            totalRevenue: true
          }
        }),
        prisma.user.count(),
        prisma.raffle.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            stats: true
          }
        })
      ]);

      return res.json({
        success: true,
        stats: {
          totalRaffles,
          activeRaffles,
          totalRevenue: totalRevenue._sum.totalRevenue || 0,
          totalUsers,
          recentRaffles
        }
      });
    } catch (error) {
      throw new AppError(500, 'Error al obtener estadísticas del dashboard');
    }
  }

  // Gestión de sorteos
  async getRaffleStats(req: Request, res: Response) {
    const { raffleId } = req.params;

    const stats = await prisma.raffleStats.findUnique({
      where: { raffleId },
      include: {
        raffle: {
          include: {
            tickets: {
              select: {
                userId: true,
                number: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!stats) {
      throw new AppError(404, 'Estadísticas no encontradas');
    }

    return res.json({
      success: true,
      stats
    });
  }

  // Gestión de usuarios
  async getUsers(req: Request, res: Response) {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: Number(limit),
        include: {
          _count: {
            select: {
              tickets: true,
              notifications: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count()
    ]);

    return res.json({
      success: true,
      users,
      pagination: {
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        perPage: Number(limit)
      }
    });
  }

  // Configuración de la plataforma
  async getAdminSettings(req: Request, res: Response) {
    const settings = await prisma.adminSettings.findFirst();
    return res.json({
      success: true,
      settings
    });
  }

  async updateAdminSettings(req: Request, res: Response) {
    const {
      maxTicketsPerUser,
      minTicketPrice,
      maxTicketPrice,
      platformFee
    } = req.body;

    const settings = await prisma.adminSettings.upsert({
      where: {
        id: (await prisma.adminSettings.findFirst())?.id || ''
      },
      update: {
        maxTicketsPerUser,
        minTicketPrice,
        maxTicketPrice,
        platformFee
      },
      create: {
        maxTicketsPerUser,
        minTicketPrice,
        maxTicketPrice,
        platformFee
      }
    });

    return res.json({
      success: true,
      settings
    });
  }

  // Gestión de roles
  async updateUserRole(req: Request, res: Response) {
    const { userId, role } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });

    return res.json({
      success: true,
      user
    });
  }
} 