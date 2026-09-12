import swaggerJsdoc from 'swagger-jsdoc';

const PORT = process.env.PORT || 5050;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI-Driven Smart Logistics & Predictive Supply Chain API',
      version: '1.0.0',
      description:
        'DBMS-First RESTful API for Smart Logistics, Inventory, Orders, Shipments, and AI/ML Demand & Risk Forecasting.',
      contact: {
        name: 'DBMS Project Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;

