/**
 * Global Error Handler Middleware
 * Menangani semua error yang terjadi di aplikasi
 */

const ResponseHandler = require('../utils/responseHandler');

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Database error
  if (err.code === 'ER_DUP_ENTRY') {
    return ResponseHandler.error(
      res,
      'Duplicate entry. This record already exists.',
      409,
      { code: err.code, sqlMessage: err.sqlMessage }
    );
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return ResponseHandler.error(
      res,
      'Referenced record does not exist.',
      400,
      { code: err.code }
    );
  }

  // Validation error dari express-validator
  if (err.name === 'ValidationError') {
    return ResponseHandler.validationError(res, err.errors);
  }

  // JWT error (untuk future authentication)
  if (err.name === 'JsonWebTokenError') {
    return ResponseHandler.unauthorized(res, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return ResponseHandler.unauthorized(res, 'Token expired');
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return ResponseHandler.error(res, message, statusCode, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;