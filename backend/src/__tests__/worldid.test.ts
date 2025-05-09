import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { setupApp } from '../app';
import { validateEnv } from '../utils/validateEnv';

describe('World ID Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Validar variables de entorno
    validateEnv();
    
    // Configurar la aplicación
    app = setupApp();
    prisma = new PrismaClient();
    
    // Limpiar la base de datos de prueba
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/worldid/check-environment', () => {
    it('should return environment status', async () => {
      const response = await request(app)
        .get('/api/worldid/check-environment')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('is_development');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('POST /api/worldid/verify', () => {
    it('should reject invalid proof format', async () => {
      const response = await request(app)
        .post('/api/worldid/verify')
        .send({
          proof: 'invalid_proof',
          nullifier_hash: 'invalid_hash',
          merkle_root: 'invalid_root',
          action: 'test_action'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject mismatched action', async () => {
      const response = await request(app)
        .post('/api/worldid/verify')
        .send({
          proof: 'valid_proof_format',
          nullifier_hash: 'valid_hash_format',
          merkle_root: 'valid_root_format',
          action: 'wrong_action'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'INVALID_ACTION');
    });
  });
}); 