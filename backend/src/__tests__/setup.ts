import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno de prueba
dotenv.config({
  path: path.join(__dirname, '../../.env.test')
});

// Configurar variables de entorno específicas para pruebas
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'file:./test.db';
process.env.WORLD_APP_ID = 'app_test_123456789';
process.env.WORLD_ACTION_ID = 'test_action';
process.env.JWT_SECRET = 'test_secret_key_minimum_32_characters_long';
process.env.FRONTEND_URL = 'http://localhost:3000'; 