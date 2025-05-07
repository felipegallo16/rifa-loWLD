import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { IDKitWidget, ISuccessResult } from '@worldcoin/idkit';
import { VerificationResponse } from '@worldcoin/idkit-core';

const prisma = new PrismaClient();

export class WorldIDController {
  constructor() {
    this.verifyProof = this.verifyProof.bind(this);
    this.getCredentialTypes = this.getCredentialTypes.bind(this);
  }

  // Verificar prueba de World ID
  async verifyProof(req: Request, res: Response) {
    try {
      const { merkle_root, nullifier_hash, proof, credential_type, action, signal } = req.body;

      // Verificar la prueba con la API de World ID
      const response = await fetch('https://developer.worldcoin.org/api/v1/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merkle_root,
          nullifier_hash,
          proof,
          credential_type,
          action,
          signal,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return res.status(400).json({ error: error.message || 'Verification failed' });
      }

      // Buscar o crear el usuario
      const user = await prisma.user.upsert({
        where: {
          nullifierHash: nullifier_hash,
        },
        update: {},
        create: {
          nullifierHash: nullifier_hash,
          role: 'USER',
        },
      });

      // Generar token JWT (implementar según necesidades)
      const token = this.generateToken(user);

      return res.json({
        success: true,
        token,
        user: {
          nullifierHash: user.nullifierHash,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Error verifying World ID proof:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Obtener tipos de credenciales disponibles
  async getCredentialTypes(req: Request, res: Response) {
    try {
      const credentialTypes = [
        {
          id: 'orb',
          name: 'Orb Verification',
          description: 'Verify with World ID Orb',
        },
        {
          id: 'phone',
          name: 'Phone Verification',
          description: 'Verify with phone number',
        },
      ];

      return res.json(credentialTypes);
    } catch (error) {
      console.error('Error getting credential types:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Método privado para generar token JWT
  private generateToken(user: { nullifierHash: string; role: string }): string {
    // Implementar generación de JWT según las necesidades del proyecto
    // Por ahora retornamos un placeholder
    return `jwt_${user.nullifierHash}_${Date.now()}`;
  }
} 