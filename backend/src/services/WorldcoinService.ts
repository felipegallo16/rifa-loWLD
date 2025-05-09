import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WorldcoinService {
  constructor() {
    this.verifyBalance = this.verifyBalance.bind(this);
    this.processPayment = this.processPayment.bind(this);
  }

  /**
   * Verifica el balance de tokens de un usuario
   */
  async verifyBalance(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { nullifierHash: userId },
        select: { worldcoinBalance: true }
      });

      return user?.worldcoinBalance || 0;
    } catch (error) {
      console.error('Error verifying balance:', error);
      throw new Error('Could not verify Worldcoin balance');
    }
  }

  /**
   * Procesa el pago de tickets usando tokens de Worldcoin
   */
  async processPayment(userId: string, amount: number): Promise<boolean> {
    try {
      // Verificar balance
      const currentBalance = await this.verifyBalance(userId);
      if (currentBalance < amount) {
        throw new Error('Insufficient Worldcoin balance');
      }

      // Realizar la transacción
      await prisma.user.update({
        where: { nullifierHash: userId },
        data: {
          worldcoinBalance: {
            decrement: amount
          },
          transactions: {
            create: {
              type: 'TICKET_PURCHASE',
              amount: amount,
              status: 'COMPLETED'
            }
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error('Payment processing failed');
    }
  }

  /**
   * Reembolsa tokens en caso de error o cancelación
   */
  async refundTokens(userId: string, amount: number): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { nullifierHash: userId },
        data: {
          worldcoinBalance: {
            increment: amount
          },
          transactions: {
            create: {
              type: 'REFUND',
              amount: amount,
              status: 'COMPLETED'
            }
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Error refunding tokens:', error);
      throw new Error('Refund failed');
    }
  }
} 