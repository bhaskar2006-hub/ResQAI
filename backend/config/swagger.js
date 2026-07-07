import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ResQAI – Disaster Intelligence Platform API',
      version: '1.0.0',
      description: 'API Documentation for the ResQAI Backend Platform. Contains endpoints for authentication, users, hospitals, shelters, resources, SOS emergencies, and incident reports.',
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'V1 API Server Prefix',
      },
      {
        url: 'http://localhost:5000',
        description: 'Root Server',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Paths to files containing OpenAPI specifications
  apis: [
    './backend/routes/*.js',
    './backend/app.js'
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
