import swaggerJSDoc from 'swagger-jsdoc';

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
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/docs/*.swagger.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJSDoc(options);
