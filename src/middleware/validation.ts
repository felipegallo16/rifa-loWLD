import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Esquemas de validación
export const ticketPurchaseSchema = z.object({
  raffleId: z.string().uuid(),
  quantity: z.number().int().positive().max(10),
});

export const worldIDProofSchema = z.object({
  merkle_root: z.string(),
  nullifier_hash: z.string(),
  proof: z.string(),
  credential_type: z.string(),
  action: z.string(),
  signal: z.string().optional(),
});

export const createRaffleSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  price: z.number().positive(),
  totalTickets: z.number().int().positive().max(1000),
  endDate: z.string().datetime(),
});

// Middleware de validación
export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}; 