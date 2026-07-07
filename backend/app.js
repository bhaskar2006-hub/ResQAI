import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error.middleware.js';
import AppError from './utils/appError.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import hospitalRouter from './routes/hospital.routes.js';
import shelterRouter from './routes/shelter.routes.js';
import resourceRouter from './routes/resource.routes.js';
import sosRouter from './routes/sos.routes.js';
import reportRouter from './routes/report.routes.js';
import uploadRouter from './routes/upload.routes.js';
import agentRouter from './routes/agent.routes.js';
import disasterRouter from './routes/disaster.routes.js';
import dataRouter from './routes/data.routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

const app = express();

// Set security HTTP headers with cross-origin policy enabled for media assets
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Limit requests from same API client/IP
const limiter = rateLimit({
  max: 10000, // Limit each IP to 10000 requests per windowMs
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests from this IP, please try again in 15 minutes!',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', limiter);

// CORS configuration
app.use(cors({
  origin: '*', // Customize this configuration for production as needed
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Gzip compression
app.use(compression());

// Serve static storage directory
app.use('/storage', express.static('storage'));

// API Routes
app.get('/api/v1/config/maps-key', (req, res) => {
  res.status(200).json({
    success: true,
    mapsApiKey: process.env.MAPS_API_KEY || 'your-maps-api-key'
  });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/hospitals', hospitalRouter);
app.use('/api/v1/shelters', shelterRouter);
app.use('/api/v1/resources', resourceRouter);
app.use('/api/v1/sos', sosRouter);
app.use('/api/v1/reports', reportRouter);
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/agents', agentRouter);
app.use('/api/v1/disasters', disasterRouter);
app.use('/api/v1/data', dataRouter);

// Swagger Documentation API
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check API
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ResQAI Backend is healthy and running.',
    timestamp: new Date().toISOString(),
  });
});

// Handle unhandled routes (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(errorHandler);

export default app;
