import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyWorldIDProof } from '@worldcoin/idkit-core';

const prisma = new PrismaClient();

const INITIAL_WLD_BALANCE = 1.0; // Balance inicial en WLD

export const verifyProof = async (req: Request, res: Response) => {
  try {
    const { proof, nullifier_hash, merkle_root, signal } = req.body;

    // Verificar la prueba de World ID
    const result = await verifyWorldIDProof({
      signal,
      proof,
      nullifier_hash,
      merkle_root,
      action_id: process.env.WORLD_ID_ACTION_ID as string,
      app_id: process.env.WORLD_ID_APP_ID as string,
    });

    if (!result.success) {
      return res.status(400).json({ error: 'Invalid World ID proof' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { nullifier_hash },
    });

    if (!existingUser) {
      // Crear nuevo usuario con transacción inicial
      const user = await prisma.user.create({
        data: {
          nullifier_hash,
          wld_balance: INITIAL_WLD_BALANCE,
        },
      });

      // Registrar la transacción inicial
      await prisma.wLDTransaction.create({
        data: {
          userId: user.id,
          amount: INITIAL_WLD_BALANCE,
          type: 'REWARD',
          status: 'COMPLETED',
        },
      });

      return res.json({
        success: true,
        message: 'World ID verification successful',
        nullifier_hash,
        wld_balance: INITIAL_WLD_BALANCE,
      });
    }

    return res.json({
      success: true,
      message: 'World ID verification successful',
      nullifier_hash,
      wld_balance: existingUser.wld_balance,
    });
  } catch (error) {
    console.error('Error verifying World ID proof:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 