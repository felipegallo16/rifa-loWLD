import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TICKET_PRICE_WLD = 0.1; // Precio en WLD por ticket

export const purchaseTicket = async (req: Request, res: Response) => {
  try {
    const { raffleId, number, nullifier_hash } = req.body;

    // Verificar que el usuario existe y tiene suficiente balance WLD
    const user = await prisma.user.findUnique({
      where: { nullifier_hash },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.wld_balance < TICKET_PRICE_WLD) {
      return res.status(400).json({ error: 'Insufficient WLD balance' });
    }

    // Verificar que el número está disponible
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        raffleId,
        number,
      },
    });

    if (existingTicket) {
      return res.status(400).json({ error: 'Ticket number already taken' });
    }

    // Crear el ticket, actualizar el balance y registrar la transacción
    const [ticket, transaction] = await prisma.$transaction([
      prisma.ticket.create({
        data: {
          number,
          userId: user.id,
          raffleId,
        },
      }),
      prisma.wLDTransaction.create({
        data: {
          userId: user.id,
          amount: -TICKET_PRICE_WLD,
          type: 'PURCHASE',
          status: 'COMPLETED',
          ticketId: ticket.id,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          wld_balance: {
            decrement: TICKET_PRICE_WLD,
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      ticket,
      transaction,
      remaining_balance: user.wld_balance - TICKET_PRICE_WLD,
    });
  } catch (error) {
    console.error('Error purchasing ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAvailableNumbers = async (req: Request, res: Response) => {
  try {
    const { raffleId } = req.params;

    const takenNumbers = await prisma.ticket.findMany({
      where: { raffleId },
      select: { number: true },
    });

    const taken = takenNumbers.map(t => t.number);
    const available = Array.from({ length: 100 }, (_, i) => i + 1)
      .filter(n => !taken.includes(n));

    return res.json({
      success: true,
      available,
    });
  } catch (error) {
    console.error('Error getting available numbers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 