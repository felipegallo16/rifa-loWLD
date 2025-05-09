import { PrismaClient } from '@prisma/client';

declare global {
  type NotificationType = 'WINNER' | 'UPDATE' | 'REMINDER';
  type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';
  type RaffleStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';
  type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

  interface Notification {
    id: string;
    userId: string;
    raffleId: string;
    type: NotificationType;
    status: NotificationStatus;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }

  interface Raffle {
    id: string;
    title: string;
    description: string;
    price: number;
    totalTickets: number;
    soldTickets: number;
    endDate: Date;
    status: RaffleStatus;
    winnerId?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    tickets?: Ticket[];
    stats?: RaffleStats;
  }

  interface Ticket {
    id: string;
    number: number;
    raffleId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }

  interface RaffleStats {
    id: string;
    raffleId: string;
    totalRevenue: number;
    ticketsSold: number;
    uniqueParticipants: number;
    averageTicketsPerUser: number;
    createdAt: Date;
    updatedAt: Date;
  }

  interface User {
    id: string;
    nullifierHash: string;
    email?: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
  }

  interface EmailConfig {
    to: string;
    subject: string;
    html: string;
  }

  interface GroupByResult {
    userId: string;
    _count: number;
  }

  interface TimeSeriesEntry {
    createdAt: Date;
    _count: number;
  }
} 