import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const updateStatusSchema = z.object({
  status: z.enum(['PREPARING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELAYED', 'CANCELLED']),
  location: z.string().min(2, 'Location is required'),
  notes: z.string().optional(),
});

const addTrackingSchema = z.object({
  statusUpdate: z.string().min(2, 'Status update message is required'),
  location: z.string().min(2, 'Location is required'),
  notes: z.string().optional(),
});

/**
 * @swagger
 * /api/shipments:
 *   get:
 *     summary: Retrieve shipments with route, tracking, and delay risk scores
 *     tags: [Shipments]
 */
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;

    const shipments = await prisma.shipment.findMany({
      where: status ? { status } : undefined,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            totalAmount: true,
            priority: true,
          },
        },
        route: {
          include: {
            originWarehouse: { select: { id: true, code: true, name: true, city: true } },
          },
        },
        riskScores: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
        trackingHistory: {
          orderBy: { checkpointTimestamp: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ success: true, count: shipments.length, data: shipments });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shipments' });
  }
});

/**
 * @swagger
 * /api/shipments/{id}:
 *   get:
 *     summary: Get single shipment with full milestone audit trail
 *     tags: [Shipments]
 */
router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: { product: true },
            },
          },
        },
        route: {
          include: { originWarehouse: true },
        },
        trackingHistory: {
          orderBy: { checkpointTimestamp: 'asc' },
        },
        riskScores: {
          orderBy: { calculatedAt: 'desc' },
        },
      },
    });

    if (!shipment) {
      res.status(404).json({ success: false, message: 'Shipment not found' });
      return;
    }

    res.json({ success: true, data: shipment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving shipment' });
  }
});

/**
 * @swagger
 * /api/shipments/{id}/status:
 *   patch:
 *     summary: Update shipment status and log tracking checkpoint (STAFF, MANAGER, ADMIN)
 *     tags: [Shipments]
 */
router.patch(
  '/:id/status',
  authenticateJWT,
  validateBody(updateStatusSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, location, notes } = req.body;

      const existing = await prisma.shipment.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, message: 'Shipment not found' });
        return;
      }

      const updated = await prisma.shipment.update({
        where: { id },
        data: {
          status,
          currentLocation: location,
          actualDelivery: status === 'DELIVERED' ? new Date() : existing.actualDelivery,
        },
      });

      // Insert tracking history
      await prisma.shipmentTracking.create({
        data: {
          shipmentId: id,
          statusUpdate: `Status changed to ${status}`,
          location,
          checkpointTimestamp: new Date(),
          notes: notes || `Updated by ${req.user!.fullName} (${req.user!.role})`,
        },
      });

      // Also update parent order status if delivered
      if (status === 'DELIVERED') {
        await prisma.order.update({
          where: { id: existing.orderId },
          data: { status: 'DELIVERED' },
        });
      }

      res.json({ success: true, message: 'Shipment status updated', data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update shipment status' });
    }
  }
);

/**
 * @swagger
 * /api/shipments/{id}/tracking:
 *   post:
 *     summary: Append checkpoint event to shipment milestone history
 *     tags: [Shipments]
 */
router.post(
  '/:id/tracking',
  authenticateJWT,
  validateBody(addTrackingSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const { statusUpdate, location, notes } = req.body;

      const tracking = await prisma.shipmentTracking.create({
        data: {
          shipmentId: id,
          statusUpdate,
          location,
          checkpointTimestamp: new Date(),
          notes,
        },
      });

      res.status(201).json({ success: true, data: tracking });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to add tracking event' });
    }
  }
);

export default router;
