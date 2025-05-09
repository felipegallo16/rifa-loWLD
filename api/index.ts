import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    if (req.url === '/api/health') {
      return res.json({ status: 'ok' });
    }
    
    if (req.url === '/api/rifas') {
      try {
        const rifas = await prisma.rifa.findMany();
        return res.json(rifas);
      } catch (error) {
        return res.status(500).json({ error: 'Error al obtener las rifas' });
      }
    }
  }
  
  return res.status(404).json({ error: 'Not found' });
} 