import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// API routes
app.get('/api/rifas', async (req: Request, res: Response) => {
  try {
    const rifas = await prisma.rifa.findMany();
    res.json(rifas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las rifas' });
  }
});

export default app; 