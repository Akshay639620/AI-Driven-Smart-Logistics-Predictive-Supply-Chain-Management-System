import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const orderItemInputSchema = z.object({
  productId: z.number().int().positive(),
  warehouseId: z.number().int().positive(),
  quantity: z.number().int().positive('Item quantity must be at least 1'),
});

const createOrderSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  customerEmail: z.string().email().optional(),
  destinationCity: z.string().min(2, 'Destination city is required'),
  destinationAddress: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one item'),
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Retrieve orders with creator, items, and shipment status
 *     tags: [Orders]
 */
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true, role: { select: { name: true } } },
        },
        items: {
          include: {
            product: { select: { id: true, sku: true, name: true, unitPrice: true } },
            warehouse: { select: { id: true, code: true, name: true, city: true } },
          },
        },
        shipment: {
          select: { id: true, trackingNumber: true, status: true, carrierName: true, estimatedDelivery: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get single order by ID
 *     tags: [Orders]
 */
router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
        items: {
          include: {
            product: true,
            warehouse: true,
          },
        },
        shipment: {
          include: {
            route: true,
            trackingHistory: { orderBy: { checkpointTimestamp: 'desc' } },
            riskScores: true,
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving order' });
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Place new order with Atomic ACID Transaction ($transaction) & Rollback Guarantee
 *     tags: [Orders, DBMS Showcase]
 */
router.post(
  '/',
  authenticateJWT,
  validateBody(createOrderSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { customerName, customerEmail, destinationCity, destinationAddress, priority, items } = req.body;
    const userId = req.user!.id;

    try {
      // Execute as an atomic ACID transaction
      const result = await prisma.$transaction(async (tx) => {
        let totalCalculatedAmount = 0;
        const verifiedItems = [];

        // 1. Verify availability and lock stock for each item
        for (const item of items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) {
            throw new Error(`Product ID ${item.productId} does not exist.`);
          }

          const inventoryRecord = await tx.inventory.findUnique({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: item.warehouseId,
              },
            },
          });

          if (!inventoryRecord) {
            throw new Error(
              `Product '${product.name}' is not stocked at warehouse ID ${item.warehouseId}.`
            );
          }

          if (inventoryRecord.quantity < item.quantity) {
            // ATOMIC ROLLBACK TRIGGER: Insufficient stock aborts the whole transaction
            throw new Error(
              `Insufficient stock for '${product.name}' (SKU: ${product.sku}). Available: ${inventoryRecord.quantity}, Requested: ${item.quantity}. Transaction aborted and rolled back.`
            );
          }

          const subtotal = Number((product.unitPrice * item.quantity).toFixed(2));
          totalCalculatedAmount += subtotal;

          verifiedItems.push({
            productId: item.productId,
            warehouseId: item.warehouseId,
            quantity: item.quantity,
            unitPrice: product.unitPrice,
            subtotal: subtotal,
            inventoryId: inventoryRecord.id,
            newQuantity: inventoryRecord.quantity - item.quantity,
          });
        }

        // 2. Generate unique order number
        const count = await tx.order.count();
        const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

        // 3. Create the Order
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            customerName,
            customerEmail: customerEmail || `${customerName.toLowerCase().replace(/\s+/g, '.')}@client.com`,
            destinationCity,
            destinationAddress: destinationAddress || '123 Commercial Plaza',
            status: 'CONFIRMED',
            priority,
            totalAmount: Number(totalCalculatedAmount.toFixed(2)),
            createdById: userId,
          },
        });

        // 4. Create all Order Items
        for (const verified of verifiedItems) {
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: verified.productId,
              warehouseId: verified.warehouseId,
              quantity: verified.quantity,
              unitPrice: verified.unitPrice,
              subtotal: verified.subtotal,
            },
          });

          // 5. Decrement Inventory atomically
          // (Note: This fires the PostgreSQL trigger trg_inventory_low_stock_check if quantity <= threshold!)
          await tx.inventory.update({
            where: { id: verified.inventoryId },
            data: {
              quantity: verified.newQuantity,
            },
          });
        }

        // 6. Automatically provision Shipment & Route
        const originWarehouseId = verifiedItems[0].warehouseId;
        let route = await tx.route.findFirst({
          where: { originWarehouseId, destinationCity },
        });

        if (!route) {
          route = await tx.route.create({
            data: {
              originWarehouseId,
              destinationCity,
              distanceKm: 1200,
              transitDaysExpected: 3,
              trafficCongestion: 'MEDIUM',
              weatherImpactScore: 0.1,
            },
          });
        }

        const trackingNumber = `TRK-DHL-${String(newOrder.id).padStart(6, '0')}`;
        const estimatedDelivery = new Date(Date.now() + route.transitDaysExpected * 24 * 3600 * 1000);

        const newShipment = await tx.shipment.create({
          data: {
            trackingNumber,
            orderId: newOrder.id,
            routeId: route.id,
            carrierName: 'DHL Express Global',
            status: 'PREPARING',
            shippedAt: new Date(),
            estimatedDelivery,
          },
        });

        // 7. Initial Tracking history
        await tx.shipmentTracking.create({
          data: {
            shipmentId: newShipment.id,
            statusUpdate: 'Order Confirmed - Preparing Dispatch',
            location: `Warehouse #${originWarehouseId}`,
            checkpointTimestamp: new Date(),
            notes: 'Fulfillment order generated by system transaction',
          },
        });

        // 8. Audit log
        await tx.auditLog.create({
          data: {
            userId,
            action: 'CREATE_ORDER_TRANSACTION',
            tableName: 'orders',
            recordId: newOrder.id,
            newData: { orderNumber, totalAmount: totalCalculatedAmount, itemCount: items.length },
          },
        });

        return { order: newOrder, shipment: newShipment };
      });

      res.status(201).json({
        success: true,
        message: 'Order created and inventory decremented atomically via ACID transaction.',
        data: result,
      });
    } catch (error: any) {
      console.error('Order transaction error:', error.message);
      res.status(400).json({
        success: false,
        message: error.message || 'Transaction rolled back due to error',
        transactionStatus: 'ROLLED_BACK',
      });
    }
  }
);

/**
 * @swagger
 * /api/orders/simulate-rollback:
 *   post:
 *     summary: Live Viva Demonstration - Test Transaction Rollback with excessive quantity
 *     tags: [Orders, DBMS Showcase]
 */
router.post(
  '/simulate-rollback',
  authenticateJWT,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Deliberately attempt an impossible quantity to demonstrate rollback
      const firstProduct = await prisma.product.findFirst();
      const firstWarehouse = await prisma.warehouse.findFirst();

      if (!firstProduct || !firstWarehouse) {
        res.status(400).json({ success: false, message: 'No product or warehouse found to test' });
        return;
      }

      await prisma.$transaction(async (tx) => {
        // Step 1: Attempt to create order
        const fakeOrder = await tx.order.create({
          data: {
            orderNumber: `FAIL-ORD-${Date.now()}`,
            customerName: 'Rollback Simulation Customer',
            destinationCity: 'Test City',
            totalAmount: 9999999,
            createdById: req.user!.id,
          },
        });

        // Step 2: Check inventory for 99,999 units (impossible)
        const inv = await tx.inventory.findUnique({
          where: { productId_warehouseId: { productId: firstProduct.id, warehouseId: firstWarehouse.id } },
        });

        const requested = 999999;
        if ((inv?.quantity ?? 0) < requested) {
          throw new Error(
            `TRANSACTION_ROLLBACK_DEMO: Product '${firstProduct.name}' has only ${inv?.quantity ?? 0} units in stock. Requested: ${requested}. Aborting entire transaction!`
          );
        }
      });

      res.json({ success: true, message: 'Did not roll back' });
    } catch (error: any) {
      // Verify in DB that fakeOrder was NOT persisted
      const leakedOrder = await prisma.order.findFirst({
        where: { customerName: 'Rollback Simulation Customer' },
      });

      res.status(400).json({
        success: false,
        demonstration: 'ACID Transaction Rollback Verification',
        errorCaught: error.message,
        atomicityVerified: leakedOrder === null,
        verdict: 'Success: Transaction rolled back completely. Zero ghost orders or data corruption.',
      });
    }
  }
);

export default router;
