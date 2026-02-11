/**
 * Response Handler Utility
 * Standarisasi format response API
 */

class ResponseHandler {
  /**
   * Success Response
   * @param {Object} res - Express response object
   * @param {*} data - Data yang akan dikirim
   * @param {string} message - Pesan sukses
   * @param {number} statusCode - HTTP status code
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Error Response
   * @param {Object} res - Express response object
   * @param {string} message - Pesan error
   * @param {number} statusCode - HTTP status code
   * @param {*} errors - Detail error (optional)
   */
  static error(res, message = 'Error occurred', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Validation Error Response
   * @param {Object} res - Express response object
   * @param {Array} errors - Array of validation errors
   */
  static validationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      })),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Not Found Response
   * @param {Object} res - Express response object
   * @param {string} resource - Resource yang tidak ditemukan
   */
  static notFound(res, resource = 'Resource') {
    return res.status(404).json({
      success: false,
      message: `${resource} not found`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Unauthorized Response
   * @param {Object} res - Express response object
   * @param {string} message - Pesan unauthorized
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Forbidden Response
   * @param {Object} res - Express response object
   * @param {string} message - Pesan forbidden
   */
  static forbidden(res, message = 'Access forbidden') {
    return res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Paginated Response
   * @param {Object} res - Express response object
   * @param {Array} data - Data array
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} total - Total items
   * @param {string} message - Success message
   */
  static paginated(res, data, page, limit, total, message = 'Success') {
    const totalPages = Math.ceil(total / limit);
    
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ResponseHandler;