import { ZodError } from 'zod';
import pkg from '@prisma/client';
const { Prisma } = pkg;

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorDetail = err.stack || err;

  // Handle Zod Validation Error
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errorDetail = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  // Handle Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      statusCode = 409;
      message = `Unique constraint failed on field(s): ${err.meta?.target?.join(', ')}`;
      errorDetail = err.meta;
    }
    // Record not found
    if (err.code === 'P2025') {
      statusCode = 404;
      message = err.meta?.cause || 'Record not found';
      errorDetail = err.meta;
    }
  }

  // standard structure for production: don't leak error stacks
  const response = {
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? errorDetail : undefined,
  };

  // If in production and not an operational error, obscure the details
  if (process.env.NODE_ENV === 'production' && !err.isOperational && !(err instanceof ZodError)) {
    response.message = 'Something went wrong on the server';
    response.error = 'Internal Server Error';
  }

  res.status(statusCode).json(response);
};
