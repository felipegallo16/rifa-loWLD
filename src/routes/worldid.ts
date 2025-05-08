import { Router } from 'express';
import { WorldIDController } from '../controllers/WorldIDController';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import { VerificationLevel } from '@worldcoin/minikit-js';

const router = Router();
const worldIDController = new WorldIDController();

// Esquemas de validación
const verifySchema = z.object({
  proof: z.string(),
  nullifier_hash: z.string(),
  merkle_root: z.string(),
  verification_level: z.nativeEnum(VerificationLevel),
  action: z.string(),
  signal: z.string().optional(),
});

// Rutas de World ID
router.post('/verify', validateRequest(verifySchema), worldIDController.verifyProof);

// Endpoint para verificar si la app está corriendo dentro de World App
router.get('/check-environment', worldIDController.checkEnvironment);

export default router; 