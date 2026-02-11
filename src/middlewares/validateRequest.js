/**
 * Validation Request Middleware
 * Middleware untuk memvalidasi request menggunakan express-validator
 */

const { validationResult } = require('express-validator');
const ResponseHandler = require('../utils/responseHandler');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return ResponseHandler.validationError(res, errors.array());
  }
  
  next();
};

module.exports = validateRequest;