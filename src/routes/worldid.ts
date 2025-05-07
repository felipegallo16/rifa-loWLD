import { Router } from 'express';
import { WorldIDController } from '../controllers/WorldIDController';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const worldIDController = new WorldIDController();

// Esquemas de validación
const verifySchema = z.object({
  merkle_root: z.string(),
  nullifier_hash: z.string(),
  proof: z.string(),
  credential_type: z.string(),
  action: z.string(),
  signal: z.string().optional(),
});

// Rutas de World ID
router.post(
  '/verify',
  validateRequest(verifySchema),
  worldIDController.verifyProof
);

router.get('/credential-types', worldIDController.getCredentialTypes);

export default router; 