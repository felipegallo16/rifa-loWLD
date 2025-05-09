import { PrismaClient } from '@prisma/client';
import { createLogger, format, transports } from 'winston';

const prisma = new PrismaClient();

// Configurar Winston logger
const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'logs/audit.log' }),
    new transports.File({ filename: 'logs/error.log', level: 'error' })
  ]
});

// Tipos de acciones auditables
export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE_RAFFLE'
  | 'UPDATE_RAFFLE'
  | 'DELETE_RAFFLE'
  | 'PURCHASE_TICKET'
  | 'TRANSFER_TICKET'
  | 'DRAW_WINNER'
  | 'CLAIM_PRIZE'
  | 'REFUND'
  | 'ADMIN_ACTION';

export interface AuditData {
  userId: string;
  action: AuditAction;
  details: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

export class AuditService {
  constructor() {
    this.logAction = this.logAction.bind(this);
    this.getAuditLogs = this.getAuditLogs.bind(this);
  }

  /**
   * Registra una acción auditable
   */
  async logAction(data: AuditData): Promise<void> {
    try {
      // Guardar en base de datos
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          details: data.details,
          ip: data.ip,
          userAgent: data.userAgent,
          timestamp: new Date()
        }
      });

      // Registrar en archivo de log
      logger.info('Audit action', {
        ...data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error logging audit action', {
        error,
        data
      });
      throw new Error('Failed to log audit action');
    }
  }

  /**
   * Obtiene logs de auditoría con filtros
   */
  async getAuditLogs(filters: {
    userId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        userId,
        action,
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = filters;

      const where: any = {};

      if (userId) where.userId = userId;
      if (action) where.action = action;
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = startDate;
        if (endDate) where.timestamp.lte = endDate;
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: {
            timestamp: 'desc'
          },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.auditLog.count({ where })
      ]);

      return {
        logs,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          limit
        }
      };

    } catch (error) {
      logger.error('Error getting audit logs', { error, filters });
      throw new Error('Failed to get audit logs');
    }
  }

  /**
   * Obtiene acciones sospechosas
   */
  async getSuspiciousActions(): Promise<any[]> {
    try {
      const suspiciousPatterns = [
        // Múltiples intentos de login fallidos
        prisma.auditLog.findMany({
          where: {
            action: 'LOGIN',
            details: {
              path: ['success'],
              equals: false
            },
            timestamp: {
              gte: new Date(Date.now() - 15 * 60 * 1000) // últimos 15 minutos
            }
          },
          groupBy: ['userId', 'ip'],
          having: {
            _count: {
              userId: {
                gt: 5
              }
            }
          }
        }),

        // Múltiples compras en poco tiempo
        prisma.auditLog.findMany({
          where: {
            action: 'PURCHASE_TICKET',
            timestamp: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // últimos 5 minutos
            }
          },
          groupBy: ['userId'],
          having: {
            _count: {
              userId: {
                gt: 10
              }
            }
          }
        }),

        // Múltiples intentos de reclamo de premio
        prisma.auditLog.findMany({
          where: {
            action: 'CLAIM_PRIZE',
            timestamp: {
              gte: new Date(Date.now() - 60 * 60 * 1000) // última hora
            }
          },
          groupBy: ['userId'],
          having: {
            _count: {
              userId: {
                gt: 3
              }
            }
          }
        })
      ];

      const results = await Promise.all(suspiciousPatterns);
      return results.flat();

    } catch (error) {
      logger.error('Error checking suspicious actions', { error });
      throw new Error('Failed to check suspicious actions');
    }
  }
} 