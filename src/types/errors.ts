export class WorldIDError extends Error {
  public code: string;
  public httpStatus: number;
  public details?: string;

  constructor(message: string, code: string, httpStatus: number = 400, details?: string) {
    super(message);
    this.name = 'WorldIDError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

export class ProofVerificationError extends WorldIDError {
  constructor(message: string, details?: string) {
    super(message, 'PROOF_VERIFICATION_FAILED', 400, details);
    this.name = 'ProofVerificationError';
  }
}

export class DuplicateVerificationError extends WorldIDError {
  constructor(nullifierHash: string) {
    super(
      'Usuario ya verificado',
      'DUPLICATE_VERIFICATION',
      400,
      `El nullifier_hash ${nullifierHash} ya ha sido verificado para esta acción`
    );
    this.name = 'DuplicateVerificationError';
  }
}

export class InvalidActionError extends WorldIDError {
  constructor(providedAction: string, expectedAction: string) {
    super(
      'Acción inválida',
      'INVALID_ACTION',
      400,
      `La acción proporcionada "${providedAction}" no coincide con la acción configurada "${expectedAction}"`
    );
    this.name = 'InvalidActionError';
  }
} 