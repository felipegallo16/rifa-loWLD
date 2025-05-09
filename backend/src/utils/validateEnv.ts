import { z } from 'zod';
import logger from './logger';

const envSchema = z.object({
  // Servidor
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Base de datos
  DATABASE_URL: z.string(),

  // World ID
  WORLD_APP_ID: z.string().startsWith('app_'),
  WORLD_ACTION_ID: z.string(),
  WORLD_DEVELOPER_API_KEY: z.string().startsWith('api_'),

  // Frontend
  FRONTEND_URL: z.string().url(),

  // Seguridad
  JWT_SECRET: z.string().min(32),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    logger.info('Variables de entorno validadas correctamente');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.'));
      logger.error('Error en variables de entorno:', {
        missingVariables: missingVars,
        details: error.errors
      });
      throw new Error(`Variables de entorno faltantes o inválidas: ${missingVars.join(', ')}`);
    }
    throw error;
  }
} 