import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import productsRoutes from './routes/products.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import shipmentsRoutes from './routes/shipments.routes.js';
import suppliersRoutes from './routes/suppliers.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import mlRoutes from './routes/ml.routes.js';
import dbmsRoutes from './routes/dbms.routes.js';

const app: Express = express();

// Security and utility middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI assets
  })
);
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Base health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    system: 'AI-Driven Smart Logistics & Predictive Supply Chain Management System',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/shipments', shipmentsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/dbms', dbmsRoutes);

// Global error handler
app.use(errorHandler);

export default app;

