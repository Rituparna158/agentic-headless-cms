import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerJSDoc from 'swagger-jsdoc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const docsPattern = isProduction
  ? path.join(__dirname, '../docs/*.swagger.js')
  : path.join(__dirname, '../docs/*.swagger.ts');

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Agentic Headless CMS API',
      version: '1.0.0',
      description: 'API documentation for the Agentic Headless CMS',
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API V1',
      },
      {
        url: '/',
        description: 'Root',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key authentication',
        },
        appIdAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-app-id',
          description: 'Application ID header',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [docsPattern, './src/docs/*.swagger.ts', './dist/docs/*.swagger.js'],
};

export const swaggerSpec = swaggerJSDoc(options);
