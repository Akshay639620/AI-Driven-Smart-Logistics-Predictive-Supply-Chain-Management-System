import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const supplierSchema = z.object({
  name: z.string().min(2, 'Supplier name is required'),
  contactName: z.string().optional(),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  rating: z.number().min(1.0).max(5.0).default(4.5),
  leadTimeDays: z.number().int().positive().default(7),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
});

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: List all suppliers with rating, lead time, and associated product catalog
 *     tags: [Suppliers]
 */
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        productSuppliers: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, category: true, unitPrice: true },
            },
          },
        },
      },
      orderBy: { rating: 'desc' },
    });

    res.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch suppliers' });
  }
});

/**
 * @swagger
 * /api/suppliers/{id}:
 *   get:
 *     summary: Get single supplier details
 *     tags: [Suppliers]
 */
router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        productSuppliers: {
          include: { product: true },
        },
      },
    });

    if (!supplier) {
      res.status(404).json({ success: false, message: 'Supplier not found' });
      return;
    }

    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching supplier' });
  }
});

/**
 * @swagger
 * /api/suppliers:
 *   post:
 *     summary: Create new supplier (ADMIN, MANAGER)
 *     tags: [Suppliers]
 */
router.post(
  '/',
  authenticateJWT,
  requireRole(['ADMIN', 'MANAGER']),
  validateBody(supplierSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const existing = await prisma.supplier.findUnique({ where: { email: req.body.email } });
      if (existing) {
        res.status(409).json({ success: false, message: 'A supplier with this email already exists' });
        return;
      }

      const supplier = await prisma.supplier.create({ data: req.body });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CREATE_SUPPLIER',
          tableName: 'suppliers',
          recordId: supplier.id,
          newData: supplier,
        },
      });

      res.status(201).json({ success: true, data: supplier });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create supplier' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   put:
 *     summary: Update supplier (ADMIN, MANAGER)
 *     tags: [Suppliers]
 */
router.put(
  '/:id',
  authenticateJWT,
  requireRole(['ADMIN', 'MANAGER']),
  validateBody(supplierSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await prisma.supplier.update({
        where: { id },
        data: req.body,
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update supplier' });
    }
  }
);

export default router;
