import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RaffleWithTickets {
  id: string;
  title: string;
  price: number;
  createdAt: Date;
  tickets: Array<{
    userId: string;
  }>;
}

interface DailyStats {
  date: string;
  rafflesCreated: number;
  ticketsSold: number;
  revenue: number;
}

interface TicketDistribution {
  distribution: Record<string, number>;
  totalUsers: number;
}

interface UserEngagement {
  totalParticipants: number;
  averageTicketsPerUser: number;
  participationDistribution: Record<string, number>;
}

interface TimeSeriesData {
  [date: string]: number;
}

export class StatsService {
  constructor() {
    // Vincular métodos
    this.updateRaffleStats = this.updateRaffleStats.bind(this);
    this.getGlobalStats = this.getGlobalStats.bind(this);
    this.getRaffleTrends = this.getRaffleTrends.bind(this);
    this.getRaffleDetailedStats = this.getRaffleDetailedStats.bind(this);
  }

  // Actualizar estadísticas de un sorteo
  async updateRaffleStats(raffleId: string) {
    const raffle = await prisma.raffle.findUnique({
      where: { id: raffleId },
      include: {
        tickets: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!raffle) {
      throw new Error('Raffle not found');
    }

    const uniqueParticipants = new Set(raffle.tickets.map((ticket: { userId: string }) => ticket.userId)).size;
    const ticketsSold = raffle.tickets.length;
    const totalRevenue = ticketsSold * raffle.price;
    const averageTicketsPerUser = ticketsSold / uniqueParticipants || 0;

    await prisma.raffleStats.upsert({
      where: { raffleId },
      update: {
        totalRevenue,
        ticketsSold,
        uniqueParticipants,
        averageTicketsPerUser,
      },
      create: {
        raffleId,
        totalRevenue,
        ticketsSold,
        uniqueParticipants,
        averageTicketsPerUser,
      },
    });
  }

  // Obtener estadísticas globales
  async getGlobalStats() {
    const [
      totalRaffles,
      totalTicketsSold,
      totalRevenue,
      totalParticipants,
    ] = await Promise.all([
      prisma.raffle.count(),
      prisma.ticket.count(),
      prisma.ticket.aggregate({
        _sum: {
          price: true,
        },
      }),
      prisma.ticket.findMany({
        select: {
          userId: true,
        },
        distinct: ['userId'],
      }),
    ]);

    return {
      totalRaffles,
      totalTicketsSold,
      totalRevenue: totalRevenue._sum.price || 0,
      totalParticipants: totalParticipants.length,
      averageTicketsPerRaffle: totalTicketsSold / totalRaffles || 0,
      averageRevenuePerRaffle: (totalRevenue._sum.price || 0) / totalRaffles || 0,
    };
  }

  // Obtener estadísticas de tendencias
  async getRaffleTrends(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const raffles = await prisma.raffle.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        tickets: true,
        stats: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Agrupar por día
    const dailyStats = (raffles as RaffleWithTickets[]).reduce<Record<string, DailyStats>>((acc, raffle) => {
      const date = raffle.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          rafflesCreated: 0,
          ticketsSold: 0,
          revenue: 0,
        };
      }

      acc[date].rafflesCreated++;
      acc[date].ticketsSold += raffle.tickets.length;
      acc[date].revenue += raffle.tickets.length * raffle.price;

      return acc;
    }, {});

    return Object.values(dailyStats);
  }

  // Obtener estadísticas de un sorteo específico
  async getRaffleDetailedStats(raffleId: string) {
    const raffle = await prisma.raffle.findUnique({
      where: { id: raffleId },
      include: {
        tickets: {
          include: {
            user: true,
          },
        },
        stats: true,
      },
    });

    if (!raffle) {
      throw new Error('Raffle not found');
    }

    const ticketDistribution = await this.calculateTicketDistribution(raffleId);
    const participationTimeline = await this.getParticipationTimeline(raffleId);
    const userEngagement = await this.calculateUserEngagement(raffleId);

    return {
      basicStats: raffle.stats,
      ticketDistribution,
      participationTimeline,
      userEngagement,
    };
  }

  private async calculateTicketDistribution(raffleId: string): Promise<TicketDistribution> {
    const tickets = await prisma.ticket.groupBy({
      by: ['userId'],
      where: { raffleId },
      _count: true,
    });

    const distribution = tickets.reduce<Record<string, number>>((acc, curr) => {
      const range = this.getTicketRange(curr._count);
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {});

    return {
      distribution,
      totalUsers: tickets.length,
    };
  }

  private async getParticipationTimeline(raffleId: string): Promise<TimeSeriesData> {
    const tickets = await prisma.ticket.findMany({
      where: { raffleId },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    return tickets.reduce<TimeSeriesData>((acc, ticket) => {
      const date = ticket.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
  }

  private async calculateUserEngagement(raffleId: string): Promise<UserEngagement> {
    const participants = await prisma.ticket.groupBy({
      by: ['userId'],
      where: { raffleId },
      _count: true,
    });

    const totalParticipants = participants.length;
    const totalTickets = participants.reduce((sum, curr) => sum + curr._count, 0);
    const averageTicketsPerUser = totalTickets / totalParticipants || 0;

    const participationDistribution = participants.reduce<Record<string, number>>((acc, curr) => {
      const range = this.getTicketRange(curr._count);
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {});

    return {
      totalParticipants,
      averageTicketsPerUser,
      participationDistribution,
    };
  }

  private getTicketRange(count: number): string {
    if (count === 1) return '1';
    if (count <= 3) return '2-3';
    if (count <= 5) return '4-5';
    if (count <= 10) return '6-10';
    return '10+';
  }

  private processTimeSeriesData(data: any[], days: number) {
    const result: Record<string, number> = {};
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      result[dateStr] = 0;
    }

    data.forEach(entry => {
      const dateStr = new Date(entry.createdAt).toISOString().split('T')[0];
      result[dateStr] = entry._count;
    });

    return result;
  }

  private processHourlyData(data: any[]) {
    const hourlyData: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }

    data.forEach(entry => {
      const hour = new Date(entry.createdAt).getHours();
      hourlyData[hour] += entry._count;
    });

    return hourlyData;
  }
}

export const statsService = new StatsService(); 