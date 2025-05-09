import dotenv from 'dotenv';

dotenv.config();

export const worldcoinConfig = {
  app_id: process.env.WORLD_APP_ID as `app_${string}`,
  action_id: process.env.WORLD_ACTION_ID as string,
  verification_level: 'orb' as const,
  environment: process.env.NODE_ENV || 'development',
  is_development: process.env.NODE_ENV !== 'production',
};

// Validación de configuración
if (!worldcoinConfig.app_id) {
  throw new Error('WORLD_APP_ID no está definido en las variables de entorno');
}

if (!worldcoinConfig.action_id) {
  throw new Error('WORLD_ACTION_ID no está definido en las variables de entorno');
}

// Asegurarse de que app_id tiene el formato correcto
if (!worldcoinConfig.app_id.startsWith('app_')) {
  throw new Error('WORLD_APP_ID debe comenzar con "app_"');
}

export default worldcoinConfig; 