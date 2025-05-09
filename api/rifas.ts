import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Para evitar múltiples instancias en desarrollo
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Conectando a la base de datos...');
    
    switch (req.method) {
      case 'GET':
        console.log('Obteniendo rifas...');
        const rifas = await prisma.rifa.findMany();
        console.log('Rifas obtenidas:', rifas);
        return res.status(200).json(rifas);
      
      case 'POST':
        console.log('Creando nueva rifa:', req.body);
        const newRifa = await prisma.rifa.create({
          data: req.body
        });
        console.log('Rifa creada:', newRifa);
        return res.status(201).json(newRifa);
      
      default:
        return res.status(405).json({ error: 'Método no permitido' });
    }
  } catch (error: any) {
    console.error('Error en el endpoint de rifas:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
} 