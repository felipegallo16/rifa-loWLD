import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const rifas = await prisma.rifa.findMany();
    res.json(rifas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las rifas' });
  }
} 