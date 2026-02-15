import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

interface CustomError extends Error {
  status?: number;
  code?: string;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  // Default error
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  // Handle specific error types
  if (err.code === '23505') {
    // PostgreSQL unique violation
    status = 409;
    message = 'Resource already exists';
  } else if (err.code === '23503') {
    // PostgreSQL foreign key violation
    status = 400;
    message = 'Invalid reference';
  } else if (err.code === '22P02') {
    // PostgreSQL invalid input syntax
    status = 400;
    message = 'Invalid input format';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation error';
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  } else if (err instanceof multer.MulterError) {
    status = 400;

    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded file is too large';
    } else {
      message = 'Invalid file upload';
    }
  } else if (
    err.message === 'Only audio files are allowed' ||
    err.message === 'Only image files are allowed'
  ) {
    status = 400;
    message = err.message;
  }

  // Don't leak error details in production
  const response: any = {
    success: false,
    error: message,
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err;
  }

  res.status(status).json(response);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
};

/**
 * Async handler wrapper to catch errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
