/**
 * Not Found Middleware
 * Menangani request ke route yang tidak ada
 */

const ResponseHandler = require('../utils/responseHandler');

const notFoundHandler = (req, res, next) => {
  ResponseHandler.error(
    res,
    `Route ${req.originalUrl} not found`,
    404,
    {
      method: req.method,
      path: req.originalUrl
    }
  );
};

module.exports = notFoundHandler;