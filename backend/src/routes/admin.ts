import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { requireAdmin, requireSuperAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const adminController = new AdminController();

// Esquemas de validación
const updateSettingsSchema = z.object({
  maxTicketsPerUser: z.number().int().min(1).max(100),
  minTicketPrice: z.number().min(0.1),
  maxTicketPrice: z.number().min(0.1),
  platformFee: z.number().min(0).max(1),
});

const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
});

// Rutas del dashboard
router.get('/dashboard', requireAdmin, adminController.getDashboardStats);
router.get('/raffles/:raffleId/stats', requireAdmin, adminController.getRaffleStats);

// Gestión de usuarios
router.get('/users', requireAdmin, adminController.getUsers);
router.patch(
  '/users/role',
  requireSuperAdmin,
  validateRequest(updateUserRoleSchema),
  adminController.updateUserRole
);

// Configuración de la plataforma
router.get('/settings', requireAdmin, adminController.getAdminSettings);
router.put(
  '/settings',
  requireSuperAdmin,
  validateRequest(updateSettingsSchema),
  adminController.updateAdminSettings
);

export default router; 