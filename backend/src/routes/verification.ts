import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyProof, WorldIDVerification } from '../utils/worldcoin';

const router = Router();
const prisma = new PrismaClient();

// Verify World ID proof
router.post('/', async (req, res) => {
  try {
    const verification: WorldIDVerification = {
      nullifier_hash: req.body.nullifier_hash,
      merkle_root: req.body.merkle_root,
      proof: req.body.proof,
      credential_type: req.body.credential_type || 'orb',
      action: 'verify'
    };

    // Validar que tengamos todos los campos necesarios
    if (!verification.nullifier_hash || !verification.merkle_root || !verification.proof) {
      return res.status(400).json({ 
        success: false,
        error: 'Faltan datos de verificación' 
      });
    }

    // Verificar la prueba con World ID
    const isValid = await verifyProof(verification);

    if (!isValid) {
      return res.status(400).json({ 
        success: false,
        error: 'Verificación fallida' 
      });
    }

    // En este punto la verificación fue exitosa
    // Podríamos guardar el nullifier_hash en la base de datos si queremos
    // mantener un registro de usuarios verificados

    res.json({
      success: true,
      nullifier_hash: verification.nullifier_hash,
      credential_type: verification.credential_type
    });
  } catch (error) {
    console.error('Error en la verificación:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error en la verificación' 
    });
  }
});

export default router; 