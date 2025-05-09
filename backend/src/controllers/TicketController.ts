import { Request, Response } from 'express';
import { PrismaClient, Ticket } from '@prisma/client';
import { NotificationService } from '../services/NotificationService';
import { StatsService } from '../services/StatsService';
import { ReservationService } from '../services/ReservationService';
import { WorldcoinService } from '../services/WorldcoinService';

const prisma = new PrismaClient();
const notificationService = new NotificationService();
const statsService = new StatsService();
const reservationService = new ReservationService();
const worldcoinService = new WorldcoinService();

interface TicketNumber {
  number: number;
  isReserved: boolean;
  isSold: boolean;
}

export class TicketController {
  constructor() {
    // Vincular métodos al contexto
    this.getUserTickets = this.getUserTickets.bind(this);
    this.getRaffleTickets = this.getRaffleTickets.bind(this);
    this.getTicketById = this.getTicketById.bind(this);
    this.purchaseTickets = this.purchaseTickets.bind(this);
    this.verifyTicket = this.verifyTicket.bind(this);
    this.getAvailableNumbers = this.getAvailableNumbers.bind(this);
    this.searchNumbers = this.searchNumbers.bind(this);
    this.getSuggestedNumbers = this.getSuggestedNumbers.bind(this);
    this.reserveNumbers = this.reserveNumbers.bind(this);
    this.getRandomNumber = this.getRandomNumber.bind(this);
  }

  // Obtener tickets del usuario
  async getUserTickets(req: Request, res: Response) {
    try {
      const userId = req.user?.nullifierHash;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const tickets = await prisma.ticket.findMany({
        where: {
          userId,
        },
        include: {
          raffle: {
            include: {
              stats: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json(tickets);
    } catch (error) {
      console.error('Error getting user tickets:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Obtener tickets de un sorteo
  async getRaffleTickets(req: Request, res: Response) {
    try {
      const { raffleId } = req.params;
      const userId = req.user?.nullifierHash;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const raffle = await prisma.raffle.findUnique({
        where: { id: raffleId },
        include: {
          tickets: {
            where: {
              userId,
            },
          },
        },
      });

      if (!raffle) {
        return res.status(404).json({ error: 'Raffle not found' });
      }

      return res.json(raffle.tickets);
    } catch (error) {
      console.error('Error getting raffle tickets:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Obtener un ticket específico
  async getTicketById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.nullifierHash;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          raffle: true,
        },
      });

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      // Verificar que el ticket pertenece al usuario
      if (ticket.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to view this ticket' });
      }

      return res.json(ticket);
    } catch (error) {
      console.error('Error getting ticket:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Buscar números específicos
  async searchNumbers(req: Request, res: Response) {
    try {
      const { raffleId } = req.params;
      const { numbers } = req.query;
      
      const searchNumbers = Array.isArray(numbers) 
        ? numbers.map(n => parseInt(n.toString()))
        : [parseInt(numbers?.toString() || '0')];

      const raffle = await prisma.raffle.findUnique({
        where: { id: raffleId },
        include: {
          tickets: {
            select: { number: true }
          }
        }
      });

      if (!raffle) {
        return res.status(404).json({ error: 'Raffle not found' });
      }

      const soldNumbers = raffle.tickets.map(t => t.number);
      const numberStatus = searchNumbers.map(number => ({
        number,
        isAvailable: !soldNumbers.includes(number) && !reservationService.isNumberReserved(raffleId, number),
        isValid: number > 0 && number <= raffle.totalTickets
      }));

      return res.json(numberStatus);
    } catch (error) {
      console.error('Error searching numbers:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Obtener sugerencias de números
  async getSuggestedNumbers(req: Request, res: Response) {
    try {
      const { raffleId } = req.params;
      const { preferences } = req.query;
      
      const raffle = await prisma.raffle.findUnique({
        where: { id: raffleId },
        include: {
          tickets: {
            select: { number: true }
          }
        }
      });

      if (!raffle) {
        return res.status(404).json({ error: 'Raffle not found' });
      }

      const soldNumbers = raffle.tickets.map(t => t.number);
      const allNumbers: TicketNumber[] = Array.from(
        { length: raffle.totalTickets },
        (_, i) => ({
          number: i + 1,
          isSold: soldNumbers.includes(i + 1),
          isReserved: reservationService.isNumberReserved(raffleId, i + 1)
        })
      );

      // Filtrar números disponibles
      const availableNumbers = allNumbers.filter(n => !n.isSold && !n.isReserved);

      // Aplicar preferencias si existen
      let suggestedNumbers = availableNumbers;
      if (preferences) {
        switch (preferences.toString()) {
          case 'sequential':
            // Buscar números secuenciales disponibles
            suggestedNumbers = this.findSequentialNumbers(availableNumbers, 5);
            break;
          case 'lucky':
            // Sugerir números considerados "de la suerte"
            suggestedNumbers = this.findLuckyNumbers(availableNumbers);
            break;
          case 'random':
            // Números aleatorios disponibles
            suggestedNumbers = this.getRandomNumbers(availableNumbers, 5);
            break;
          default:
            // Por defecto, devolver los primeros números disponibles
            suggestedNumbers = availableNumbers.slice(0, 5);
        }
      }

      return res.json(suggestedNumbers);
    } catch (error) {
      console.error('Error getting suggested numbers:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Reservar números
  async reserveNumbers(req: Request, res: Response) {
    try {
      const { raffleId } = req.params;
      const { numbers } = req.body;
      const userId = req.user?.nullifierHash;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const success = await reservationService.reserveNumbers(raffleId, numbers, userId);

      if (!success) {
        return res.status(400).json({ error: 'Some numbers are already reserved' });
      }

      return res.json({ 
        message: 'Numbers reserved successfully',
        expiresIn: '5 minutes'
      });
    } catch (error) {
      console.error('Error reserving numbers:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Obtener números disponibles con filtros
  async getAvailableNumbers(req: Request, res: Response) {
    try {
      const { raffleId } = req.params;
      const { range, page = '1', limit = '100' } = req.query;

      const raffle = await prisma.raffle.findUnique({
        where: { id: raffleId },
        include: {
          tickets: {
            select: {
              number: true
            }
          }
        }
      });

      if (!raffle) {
        return res.status(404).json({ error: 'Raffle not found' });
      }

      if (raffle.status !== 'OPEN') {
        return res.status(400).json({ error: 'Raffle is not open' });
      }

      // Crear array con todos los números posibles
      let allNumbers = Array.from(
        { length: raffle.totalTickets },
        (_, i) => ({
          number: i + 1,
          isSold: false,
          isReserved: false
        })
      );

      // Aplicar filtro de rango si existe
      if (range) {
        const [min, max] = range.toString().split('-').map(Number);
        allNumbers = allNumbers.filter(n => n.number >= min && n.number <= max);
      }

      // Marcar números vendidos y reservados
      const soldNumbers = raffle.tickets.map(t => t.number);
      allNumbers = allNumbers.map(n => ({
        ...n,
        isSold: soldNumbers.includes(n.number),
        isReserved: reservationService.isNumberReserved(raffleId, n.number)
      }));

      // Aplicar paginación
      const pageNum = parseInt(page.toString());
      const limitNum = parseInt(limit.toString());
      const start = (pageNum - 1) * limitNum;
      const paginatedNumbers = allNumbers.slice(start, start + limitNum);

      return res.json({
        totalTickets: raffle.totalTickets,
        totalPages: Math.ceil(allNumbers.length / limitNum),
        currentPage: pageNum,
        numbers: paginatedNumbers,
        filters: {
          range: range || 'all',
          page: pageNum,
          limit: limitNum
        }
      });
    } catch (error) {
      console.error('Error getting available numbers:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Métodos privados de ayuda
  private findSequentialNumbers(numbers: TicketNumber[], count: number): TicketNumber[] {
    const sequences: TicketNumber[][] = [];
    let currentSeq: TicketNumber[] = [];

    for (let i = 0; i < numbers.length; i++) {
      if (i === 0 || numbers[i].number === numbers[i-1].number + 1) {
        currentSeq.push(numbers[i]);
      } else {
        if (currentSeq.length >= count) {
          sequences.push(currentSeq);
        }
        currentSeq = [numbers[i]];
      }
    }

    if (currentSeq.length >= count) {
      sequences.push(currentSeq);
    }

    return sequences.length > 0 ? sequences[0].slice(0, count) : [];
  }

  private findLuckyNumbers(numbers: TicketNumber[]): TicketNumber[] {
    // Números considerados de la suerte en varias culturas
    const luckyNumbers = [3, 7, 8, 9, 11, 13, 21, 88, 99, 100];
    return numbers
      .filter(n => luckyNumbers.includes(n.number))
      .slice(0, 5);
  }

  private getRandomNumbers(numbers: TicketNumber[], count: number): TicketNumber[] {
    const availableNumbers = numbers.filter(n => !n.isSold && !n.isReserved);
    const shuffled = [...availableNumbers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Obtener un número aleatorio
  async getRandomNumber(req: Request, res: Response) {
    try {
      const { raffleId } = req.params;
      
      const raffle = await prisma.raffle.findUnique({
        where: { id: raffleId },
        include: {
          tickets: {
            select: { number: true }
          }
        }
      });

      if (!raffle) {
        return res.status(404).json({ error: 'Raffle not found' });
      }

      const soldNumbers = raffle.tickets.map(t => t.number);
      const allNumbers: TicketNumber[] = Array.from(
        { length: raffle.totalTickets },
        (_, i) => ({
          number: i + 1,
          isSold: soldNumbers.includes(i + 1),
          isReserved: reservationService.isNumberReserved(raffleId, i + 1)
        })
      );

      const randomNumber = this.getRandomNumbers(allNumbers, 1)[0];

      if (!randomNumber) {
        return res.status(404).json({ error: 'No available numbers found' });
      }

      // Reservar automáticamente el número por 5 minutos
      await this.reserveNumbers(req, res);

      return res.json({
        number: randomNumber.number,
        message: 'Number has been reserved for 5 minutes'
      });
    } catch (error) {
      console.error('Error getting random number:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Comprar tickets con números específicos
  async purchaseTickets(req: Request, res: Response) {
    try {
      const { raffleId, selectedNumbers } = req.body;
      const userId = req.user?.nullifierHash;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Verificar el sorteo
      const raffle = await prisma.raffle.findUnique({
        where: { id: raffleId },
        include: {
          tickets: {
            select: {
              number: true
            }
          }
        }
      });

      if (!raffle) {
        return res.status(404).json({ error: 'Raffle not found' });
      }

      if (raffle.status !== 'OPEN') {
        return res.status(400).json({ error: 'Raffle is not open' });
      }

      // Verificar que los números seleccionados son válidos
      const invalidNumbers = selectedNumbers.filter(num => num > raffle.totalTickets || num < 1);
      if (invalidNumbers.length > 0) {
        return res.status(400).json({ 
          error: 'Invalid numbers selected', 
          invalidNumbers 
        });
      }

      // Verificar que los números están disponibles
      const soldNumbers = raffle.tickets.map(t => t.number);
      const unavailableNumbers = selectedNumbers.filter(num => soldNumbers.includes(num));
      
      if (unavailableNumbers.length > 0) {
        return res.status(400).json({ 
          error: 'Some numbers are already taken', 
          unavailableNumbers 
        });
      }

      // Verificar y procesar el pago (1 token por ticket)
      const totalCost = selectedNumbers.length; // 1 token por ticket
      try {
        await worldcoinService.processPayment(userId, totalCost);
      } catch (error) {
        return res.status(400).json({ 
          error: 'Payment failed',
          message: error instanceof Error ? error.message : 'Insufficient Worldcoin balance'
        });
      }

      try {
        // Crear los tickets con los números seleccionados
        const tickets = selectedNumbers.map(number => ({
          userId,
          raffleId,
          number,
          transferable: false,
          price: 1 // 1 token de Worldcoin
        }));

        // Crear tickets y actualizar estadísticas en una transacción
        const [createdTickets] = await prisma.$transaction([
          prisma.ticket.createMany({
            data: tickets
          }),
          prisma.raffle.update({
            where: { id: raffleId },
            data: {
              soldTickets: {
                increment: selectedNumbers.length
              }
            }
          })
        ]);

        // Liberar cualquier reserva que tuviera el usuario
        reservationService.releaseReservation(raffleId, userId);

        // Actualizar estadísticas
        await statsService.updateRaffleStats(raffleId);

        // Notificar al usuario
        await notificationService.createNotification(
          userId,
          raffleId,
          'PURCHASE',
          `Has comprado ${selectedNumbers.length} ticket(s) para el sorteo "${raffle.title}"`
        );

        return res.status(201).json({
          tickets: createdTickets,
          payment: {
            amount: totalCost,
            currency: 'WLD',
            status: 'completed'
          }
        });

      } catch (error) {
        // Si algo falla después del pago, reembolsar los tokens
        await worldcoinService.refundTokens(userId, totalCost);
        throw error;
      }

    } catch (error) {
      console.error('Error purchasing tickets:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Verificar ticket
  async verifyTicket(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.nullifierHash;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          raffle: true,
          user: {
            select: {
              nullifierHash: true,
            },
          },
        },
      });

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      // Verificar la autenticidad del ticket
      const isAuthentic = await this.verifyTicketAuthenticity(ticket);

      return res.json({
        ticket,
        isAuthentic,
        ownership: {
          isOwner: ticket.userId === userId,
          owner: ticket.user.nullifierHash,
        },
        raffle: {
          status: ticket.raffle.status,
          isWinner: ticket.raffle.winnerId === ticket.userId,
        },
      });
    } catch (error) {
      console.error('Error verifying ticket:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Método privado para verificar la autenticidad de un ticket
  private async verifyTicketAuthenticity(ticket: any): Promise<boolean> {
    try {
      // Verificar que el ticket existe en la base de datos y que sus datos no han sido alterados
      const storedTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
        include: {
          raffle: true,
        },
      });

      if (!storedTicket) {
        return false;
      }

      // Verificar que los datos coinciden
      return (
        storedTicket.number === ticket.number &&
        storedTicket.userId === ticket.userId &&
        storedTicket.raffleId === ticket.raffleId
      );
    } catch (error) {
      console.error('Error verifying ticket authenticity:', error);
      return false;
    }
  }
} 