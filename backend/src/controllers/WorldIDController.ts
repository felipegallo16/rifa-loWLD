import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyCloudProof, VerificationLevel } from '@worldcoin/minikit-js';
import worldcoinConfig from '../config/worldcoin';
import logger from '../utils/logger';
import { WorldIDError, ProofVerificationError, DuplicateVerificationError, InvalidActionError } from '../types/errors';

const prisma = new PrismaClient();

interface VerifyRequestBody {
  proof: string;
  nullifier_hash: string;
  merkle_root: string;
  verification_level: VerificationLevel;
  action: string;
  signal?: string;
}

export class WorldIDController {
  constructor() {
    this.verifyProof = this.verifyProof.bind(this);
    this.checkEnvironment = this.checkEnvironment.bind(this);
  }

  // Verificar prueba de World ID usando MiniKit
  async verifyProof(req: Request<{}, {}, VerifyRequestBody>, res: Response) {
    const startTime = Date.now();
    try {
      const { proof, nullifier_hash, merkle_root, action, signal } = req.body;

      logger.debug('Iniciando verificación de World ID', {
        nullifier_hash,
        action,
        verification_level: VerificationLevel.Orb
      });

      // Verificar que la acción coincide con la configurada
      if (action !== worldcoinConfig.action_id) {
        throw new InvalidActionError(action, worldcoinConfig.action_id);
      }

      // Verificar si el usuario ya ha sido verificado para esta acción
      const existingVerification = await prisma.user.findUnique({
        where: { nullifier_hash }
      });

      if (existingVerification) {
        throw new DuplicateVerificationError(nullifier_hash);
      }

      // Verificar la prueba usando MiniKit
      const verifyRes = await verifyCloudProof(
        {
          merkle_root,
          nullifier_hash,
          proof,
          verification_level: VerificationLevel.Orb,
        },
        worldcoinConfig.app_id,
        action,
        signal || ''
      );

      if (!verifyRes.success) {
        throw new ProofVerificationError('Verificación de prueba fallida', verifyRes.code);
      }

      // Crear el usuario verificado
      const user = await prisma.user.create({
        data: {
          nullifier_hash,
          role: 'USER',
          wld_balance: 1.0, // Balance inicial
        }
      });

      // Generar token JWT
      const token = this.generateToken(user);

      const responseTime = Date.now() - startTime;
      logger.info('Verificación exitosa', {
        nullifier_hash,
        responseTime,
        verification_level: VerificationLevel.Orb
      });

      return res.json({
        success: true,
        token,
        user: {
          nullifier_hash: user.nullifier_hash,
          role: user.role,
          wld_balance: user.wld_balance
        },
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (error instanceof WorldIDError) {
        logger.warn('Error de verificación controlado', {
          error: error.name,
          code: error.code,
          details: error.details,
          responseTime
        });

        return res.status(error.httpStatus).json({
          error: error.code,
          message: error.message,
          details: error.details
        });
      }

      logger.error('Error no controlado en verificación', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      });

      return res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Error interno del servidor',
        details: worldcoinConfig.is_development && error instanceof Error ? error.message : undefined
      });
    }
  }

  // Verificar si la app está corriendo dentro de World App
  async checkEnvironment(req: Request, res: Response) {
    try {
      logger.debug('Verificando ambiente de la aplicación');
      
      return res.json({
        success: true,
        is_development: worldcoinConfig.is_development,
        environment: worldcoinConfig.environment
      });
    } catch (error) {
      logger.error('Error al verificar ambiente', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return res.status(500).json({ 
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Error interno del servidor' 
      });
    }
  }

  // Método privado para generar token JWT
  private generateToken(user: { nullifier_hash: string; role: string }): string {
    // Implementar generación de JWT según las necesidades del proyecto
    // Por ahora retornamos un placeholder
    return `jwt_${user.nullifier_hash}_${Date.now()}`;
  }
} 