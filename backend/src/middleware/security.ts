import helmet from 'helmet';
import cors from 'cors';
import { Express } from 'express';
import { AuditService } from '../services/AuditService';

const auditService = new AuditService();

export const configureSecurityMiddleware = (app: Express) => {
  // Configuración básica de seguridad con Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.worldcoin.org"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: true,
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: true,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }));

  // Configuración de CORS
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 horas
  }));

  // Middleware para detectar y prevenir ataques
  app.use(async (req, res, next) => {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    const path = req.path;
    const method = req.method;

    // Lista de patrones sospechosos
    const suspiciousPatterns = [
      /\.\./,  // Directory traversal
      /<script>/i,  // XSS básico
      /union\s+select/i,  // SQL Injection básico
      /exec\s*\(/i,  // Command injection
    ];

    // Verificar patrones sospechosos en la URL y body
    const reqBody = JSON.stringify(req.body);
    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(path) || pattern.test(reqBody)
    );

    if (isSuspicious) {
      await auditService.logAction({
        userId: req.user?.nullifierHash || 'anonymous',
        action: 'ADMIN_ACTION',
        details: {
          type: 'SECURITY_VIOLATION',
          path,
          method,
          ip,
          userAgent
        }
      });

      return res.status(403).json({ error: 'Acción no permitida' });
    }

    // Verificar y registrar acciones críticas
    const criticalPaths = [
      '/api/raffles/draw',
      '/api/tickets/purchase',
      '/api/admin',
    ];

    if (criticalPaths.some(p => path.startsWith(p))) {
      await auditService.logAction({
        userId: req.user?.nullifierHash || 'anonymous',
        action: 'ADMIN_ACTION',
        details: {
          type: 'CRITICAL_ACTION',
          path,
          method
        },
        ip,
        userAgent
      });
    }

    next();
  });

  // Prevención de clickjacking
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  // Sanitización de datos
  app.use((req, res, next) => {
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key]
            .replace(/[<>]/g, '') // Remover tags HTML
            .trim(); // Remover espacios innecesarios
        }
      });
    }
    next();
  });
}; 