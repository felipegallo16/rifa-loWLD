import winston from 'winston';
import { worldcoinConfig } from '../config/worldcoin';

const logger = winston.createLogger({
  level: worldcoinConfig.is_development ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'world-id-service',
    environment: worldcoinConfig.environment 
  },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Si estamos en desarrollo, también log a la consola
if (worldcoinConfig.is_development) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger; 