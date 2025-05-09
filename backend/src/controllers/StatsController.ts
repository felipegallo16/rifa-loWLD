import { Request, Response } from 'express';
import { statsService } from '../services/StatsService';
import { AppError } from '../middleware/errorHandler';

export class StatsController {
  // Obtener estadísticas globales
  async getGlobalStats(req: Request, res: Response) {
    try {
      const stats = await statsService.getGlobalStats();
      return res.json({
        success: true,
        stats,
      });
    } catch (error) {
      throw new AppError(500, 'Error al obtener estadísticas globales');
    }
  }

  // Obtener estadísticas de tendencias
  async getTrendStats(req: Request, res: Response) {
    try {
      const { days = 30 } = req.query;
      const stats = await statsService.getTrendStats(Number(days));
      return res.json({
        success: true,
        stats,
      });
    } catch (error) {
      throw new AppError(500, 'Error al obtener estadísticas de tendencias');
    }
  }

  // Obtener estadísticas detalladas de un sorteo
  async getRaffleStats(req: Request, res: Response) {
    try {
      const { raffleId } = req.params;
      const stats = await statsService.getRaffleDetailedStats(raffleId);
      return res.json({
        success: true,
        stats,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Sorteo no encontrado') {
        throw new AppError(404, 'Sorteo no encontrado');
      }
      throw new AppError(500, 'Error al obtener estadísticas del sorteo');
    }
  }

  // Actualizar estadísticas de un sorteo
  async updateRaffleStats(req: Request, res: Response) {
    try {
      const { raffleId } = req.params;
      await statsService.updateRaffleStats(raffleId);
      return res.json({
        success: true,
        message: 'Estadísticas actualizadas correctamente',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Sorteo no encontrado') {
        throw new AppError(404, 'Sorteo no encontrado');
      }
      throw new AppError(500, 'Error al actualizar estadísticas del sorteo');
    }
  }
} 