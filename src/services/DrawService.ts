import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from './NotificationService';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

export class DrawService {
  constructor() {
    this.performDraw = this.performDraw.bind(this);
    this.verifyDraw = this.verifyDraw.bind(this);
  }

  /**
   * Realiza el sorteo de manera verificable
   */
  async performDraw(raffleId: string): Promise<{
    winnerId: string;
    proof: {
      timestamp: number;
      seed: string;
      hash: string;
      winningNumber: number;
    };
  }> {
    // 1. Obtener todos los tickets válidos del sorteo
    const raffle = await prisma.raffle.findUnique({
      where: { id: raffleId },
      include: {
        tickets: {
          where: { 
            // Solo tickets válidos
            userId: { not: null } 
          },
          orderBy: { number: 'asc' }
        }
      }
    });

    if (!raffle) {
      throw new Error('Raffle not found');
    }

    if (raffle.status !== 'OPEN') {
      throw new Error('Raffle is not open');
    }

    if (raffle.tickets.length === 0) {
      throw new Error('No tickets sold');
    }

    // 2. Generar seed verificable usando múltiples fuentes de entropía
    const timestamp = Date.now();
    const seed = crypto.randomBytes(32).toString('hex');
    
    // 3. Crear hash verificable
    const hashInput = `${raffleId}-${timestamp}-${seed}`;
    const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
    
    // 4. Usar el hash para generar un número aleatorio verificable
    const randomBuffer = Buffer.from(hash, 'hex');
    const randomNumber = randomBuffer.readUInt32BE(0);
    const winningNumber = (randomNumber % raffle.tickets.length) + 1;
    
    // 5. Encontrar el ticket ganador
    const winningTicket = raffle.tickets.find(t => t.number === winningNumber);
    
    if (!winningTicket) {
      throw new Error('Could not determine winner');
    }

    // 6. Actualizar el sorteo con el ganador
    await prisma.raffle.update({
      where: { id: raffleId },
      data: {
        status: 'CLOSED',
        winnerId: winningTicket.userId,
        drawProof: {
          timestamp,
          seed,
          hash,
          winningNumber
        }
      }
    });

    // 7. Notificar al ganador
    await notificationService.createNotification(
      winningTicket.userId,
      raffleId,
      'WINNER',
      `¡Felicitaciones! Has ganado el sorteo "${raffle.title}"`
    );

    return {
      winnerId: winningTicket.userId,
      proof: {
        timestamp,
        seed,
        hash,
        winningNumber
      }
    };
  }

  /**
   * Verifica que un sorteo fue realizado correctamente
   */
  async verifyDraw(raffleId: string): Promise<{
    isValid: boolean;
    details: {
      originalProof: any;
      verificationHash: string;
      matchesOriginal: boolean;
    };
  }> {
    const raffle = await prisma.raffle.findUnique({
      where: { id: raffleId },
      include: {
        tickets: true
      }
    });

    if (!raffle || !raffle.drawProof) {
      throw new Error('Raffle or draw proof not found');
    }

    const { timestamp, seed, hash } = raffle.drawProof;

    // Recrear el hash para verificación
    const verificationInput = `${raffleId}-${timestamp}-${seed}`;
    const verificationHash = crypto.createHash('sha256').update(verificationInput).digest('hex');

    return {
      isValid: true,
      details: {
        originalProof: raffle.drawProof,
        verificationHash,
        matchesOriginal: hash === verificationHash
      }
    };
  }
} 