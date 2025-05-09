import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extraer la ruta de la URL
  const path = req.url?.split('?')[0] || '/';

  if (req.method === 'GET') {
    // Health check
    if (path === '/api/health' || path === '/health') {
      return res.json({ status: 'ok' });
    }
    
    // Rifas endpoint
    if (path === '/api/rifas' || path === '/rifas') {
      try {
        const rifas = await prisma.rifa.findMany();
        return res.json(rifas);
      } catch (error) {
        return res.status(500).json({ error: 'Error al obtener las rifas' });
      }
    }
  }
  
  // Log para debugging
  console.log('Request path:', path);
  console.log('Request method:', req.method);
  
  return res.status(404).json({ error: 'Not found', path });
} 