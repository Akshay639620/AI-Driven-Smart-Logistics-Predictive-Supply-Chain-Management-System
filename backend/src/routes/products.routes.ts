import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const createProductSchema = z.object({
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  name: z.string().min(2, 'Name is required'),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.number().positive('Unit price must be positive'),
  unitCost: z.number().positive('Unit cost must be positive'),
  weightKg: z.number().positive().optional(),
  dimensions: z.string().optional(),
});

const linkSupplierSchema = z.object({
  supplierId: z.number().int().positive(),
  supplierSku: z.string().optional(),
  supplyPrice: z.number().positive(),
  isPrimary: z.boolean().optional().default(false),
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Retrieve all products with inventory levels and supplier relationships
 *     tags: [Products]
 */
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      include: {
        productSuppliers: {
          include: {
            supplier: {
              select: { id: true, name: true, rating: true, country: true, leadTimeDays: true },
            },
          },
        },
        inventory: {
          include: {
            warehouse: {
              select: { id: true, code: true, name: true, city: true },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    // Compute aggregated total stock across warehouses
    const data = products.map((p) => {
      const totalStock = p.inventory.reduce((sum, item) => sum + item.quantity, 0);
      const isLowStock = p.inventory.some((item) => item.quantity <= item.reorderThreshold);
      return {
        ...p,
        totalStock,
        isLowStock,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get single product details
 *     tags: [Products]
 */
router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productSuppliers: {
          include: { supplier: true },
        },
        inventory: {
          include: { warehouse: true },
        },
        demandForecasts: {
          take: 5,
          orderBy: { generatedAt: 'desc' },
        },
      },
    });

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching product' });
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create new product (ADMIN or MANAGER)
 *     tags: [Products]
 */
router.post(
  '/',
  authenticateJWT,
  requireRole(['ADMIN', 'MANAGER']),
  validateBody(createProductSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const existing = await prisma.product.findUnique({ where: { sku: req.body.sku } });
      if (existing) {
        res.status(409).json({ success: false, message: 'A product with this SKU already exists' });
        return;
      }

      const product = await prisma.product.create({
        data: req.body,
      });

      // Automatically create baseline inventory record across all warehouses
      const warehouses = await prisma.warehouse.findMany({ select: { id: true } });
      if (warehouses.length > 0) {
        await prisma.inventory.createMany({
          data: warehouses.map((wh) => ({
            productId: product.id,
            warehouseId: wh.id,
            quantity: 25,
            reorderThreshold: 15,
            maxCapacity: 400,
          })),
        });
      }

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CREATE_PRODUCT',
          tableName: 'products',
          recordId: product.id,
          newData: product,
        },
      });

      res.status(201).json({ success: true, data: product });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create product' });
    }
  }
);

/**
 * @swagger
 * /api/products/{id}/suppliers:
 *   post:
 *     summary: Link supplier to product resolving M:N (ADMIN or MANAGER)
 *     tags: [Products]
 */
router.post(
  '/:id/suppliers',
  authenticateJWT,
  requireRole(['ADMIN', 'MANAGER']),
  validateBody(linkSupplierSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const productId = parseInt(req.params.id, 10);
      const { supplierId, supplierSku, supplyPrice, isPrimary } = req.body;

      // If set as primary, unmark any existing primary for this product
      if (isPrimary) {
        await prisma.productSupplier.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      const link = await prisma.productSupplier.upsert({
        where: {
          productId_supplierId: { productId, supplierId },
        },
        update: {
          supplierSku,
          supplyPrice,
          isPrimary,
        },
        create: {
          productId,
          supplierId,
          supplierSku,
          supplyPrice,
          isPrimary,
        },
        include: { supplier: true },
      });

      res.json({
        success: true,
        message: 'Supplier linked to product successfully (Resolved M:N relation)',
        data: link,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to link supplier to product' });
    }
  }
);

export default router;
