import 'dotenv/config';
import { Server } from 'socket.io';
import app from './app.js';
import prisma from './services/prisma.service.js';
import { setIoInstance } from './socket/socket.service.js';
import { initSocket } from './socket/socket.handler.js';

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
async function startServer() {
  try {
    // Test the database connection
    await prisma.$connect();
    console.log('Successfully connected to the PostgreSQL database via Prisma.');

    const server = app.listen(PORT, () => {
      console.log(`ResQAI Backend Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });

    const io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
    });

    setIoInstance(io);
    initSocket(io);

    // Handle Graceful Shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        await prisma.$disconnect();
        console.log('Database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Fatal error starting the server:', error);
    process.exit(1);
  }
}

// Global Exception/Rejection handling
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  process.exit(1);
});

startServer();
