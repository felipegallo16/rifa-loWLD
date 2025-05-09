import { verifyIDKitProof } from '@worldcoin/idkit-core';

export interface WorldIDVerification {
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  credential_type: string;
  action: string;
  signal?: string;
}

export async function verifyProof(verification: WorldIDVerification): Promise<boolean> {
  try {
    const result = await verifyIDKitProof({
      root: verification.merkle_root,
      nullifier_hash: verification.nullifier_hash,
      proof: verification.proof,
      credential_type: verification.credential_type as any,
      action: verification.action,
      signal: verification.signal || '',
      app_id: process.env.WORLDCOIN_APP_ID || ''
    });

    return result.success;
  } catch (error) {
    console.error('Error verifying World ID proof:', error);
    return false;
  }
} 