import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        nullifierHash: string;
        role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
      };
    }
  }
} 