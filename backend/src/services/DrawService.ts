import crypto from 'crypto';
import { PrismaClient, Raffle, Ticket, Prisma } from '@prisma/client';
import { NotificationService } from './NotificationService';
import { PrizeService } from './PrizeService';
import logger from '../utils/logger';

const prisma = new PrismaClient();
const notificationService = new NotificationService();
const prizeService = new PrizeService();

interface RaffleWithTickets extends Raffle {
  tickets: Ticket[];
}

interface DrawProof {
  timestamp: number;
  seed: string;
  hash: string;
  winningNumber: number;
  attempts: number;
}

export class DrawService {
  constructor() {
    this.performDraw = this.performDraw.bind(this);
    this.verifyDraw = this.verifyDraw.bind(this);
  }

  private async generateVerifiableNumber(
    raffleId: string,
    maxNumber: number,
    attempt: number = 1
  ): Promise<{
    number: number;
    proof: {
      timestamp: number;
      seed: string;
      hash: string;
    };
  }> {
    const timestamp = Date.now();
    const seed = crypto.randomBytes(32).toString('hex');
    const hashInput = `${raffleId}-${timestamp}-${seed}-attempt${attempt}`;
    const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
    const randomBuffer = Buffer.from(hash, 'hex');
    const randomNumber = randomBuffer.readUInt32BE(0);
    const number = (randomNumber % maxNumber) + 1;

    return {
      number,
      proof: {
        timestamp,
        seed,
        hash
      }
    };
  }

  async performDraw(raffleId: string): Promise<{
    winnerId: string;
    proof: DrawProof;
  }> {
    // 1. Obtener el sorteo y todos los tickets vendidos
    const raffle = await prisma.raffle.findUnique({
      where: { id: raffleId },
      include: {
        tickets: {
          where: { 
            userId: { not: undefined } 
          },
          orderBy: { number: 'asc' }
        }
      }
    }) as RaffleWithTickets | null;

    if (!raffle) {
      throw new Error('Sorteo no encontrado');
    }

    if (raffle.status !== 'OPEN') {
      throw new Error('El sorteo no está abierto');
    }

    if (raffle.tickets.length === 0) {
      throw new Error('No hay tickets vendidos');
    }

    // Crear conjunto de números vendidos para búsqueda rápida
    const soldNumbers = new Set(raffle.tickets.map(t => t.number));
    let winningTicket: Ticket | null = null;
    let lastProof = null;
    let attempts = 0;
    const maxAttempts = raffle.tickets.length * 2; // Límite de intentos para evitar bucles infinitos

    // Intentar encontrar un número ganador que corresponda a un ticket vendido
    while (!winningTicket && attempts < maxAttempts) {
      attempts++;
      const result = await this.generateVerifiableNumber(raffleId, raffle.tickets.length, attempts);
      lastProof = result.proof;

      if (soldNumbers.has(result.number)) {
        const foundTicket = raffle.tickets.find(t => t.number === result.number);
        if (foundTicket) {
          winningTicket = foundTicket;
          logger.info(`Ganador encontrado en el intento ${attempts}`, {
            raffleId,
            winningNumber: result.number,
            attempts
          });
          break;
        }
      }

      logger.debug(`Intento ${attempts}: número ${result.number} no vendido, generando nuevo número`, {
        raffleId,
        attemptedNumber: result.number
      });
    }

    if (!winningTicket || !lastProof) {
      throw new Error('No se pudo determinar un ganador después de múltiples intentos');
    }

    const drawProof: DrawProof = {
      ...lastProof,
      winningNumber: winningTicket.number,
      attempts
    };

    // Actualizar el sorteo con el ganador y crear el premio
    await prisma.$transaction(async (tx) => {
      await tx.raffle.update({
        where: { id: raffleId },
        data: {
          status: 'CLOSED',
          drawData: JSON.stringify(drawProof)
        }
      });
      await prizeService.createPrize(raffleId, winningTicket!.userId);
    });

    // Notificar al ganador y participantes
    await notificationService.notifyWinner({
      id: raffleId,
      title: raffle.name,
      status: 'CLOSED',
      tickets: raffle.tickets
    }, winningTicket);

    return {
      winnerId: winningTicket.userId,
      proof: drawProof
    };
  }

  async verifyDraw(raffleId: string): Promise<{
    isValid: boolean;
    details: {
      originalProof: DrawProof;
      verificationHash: string;
      matchesOriginal: boolean;
      attempts: number;
    };
  }> {
    const raffle = await prisma.raffle.findUnique({
      where: { id: raffleId },
      select: {
        drawData: true
      }
    });

    if (!raffle || !raffle.drawData) {
      throw new Error('Sorteo o prueba no encontrada');
    }

    const drawProof = JSON.parse(raffle.drawData) as DrawProof;
    const { timestamp, seed, hash, attempts } = drawProof;

    // Recrear el hash para verificación
    const verificationInput = `${raffleId}-${timestamp}-${seed}-attempt${attempts}`;
    const verificationHash = crypto.createHash('sha256').update(verificationInput).digest('hex');

    return {
      isValid: true,
      details: {
        originalProof: drawProof,
        verificationHash,
        matchesOriginal: hash === verificationHash,
        attempts
      }
    };
  }
} 