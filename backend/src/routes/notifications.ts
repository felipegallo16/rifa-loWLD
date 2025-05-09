import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const notificationController = new NotificationController();

// Esquemas de validación
const sendWinnerNotificationSchema = z.object({
  raffleId: z.string().uuid(),
  winnerNullifierHash: z.string(),
});

const sendUpdateNotificationSchema = z.object({
  raffleId: z.string().uuid(),
  message: z.string().min(10).max(1000),
});

// Rutas
router.get('/', notificationController.getNotifications);
router.put('/:notificationId/read', notificationController.markAsRead);
router.post(
  '/winner',
  validateRequest(sendWinnerNotificationSchema),
  notificationController.sendWinnerNotification
);
router.post(
  '/update',
  validateRequest(sendUpdateNotificationSchema),
  notificationController.sendUpdateNotification
);

export default router; 