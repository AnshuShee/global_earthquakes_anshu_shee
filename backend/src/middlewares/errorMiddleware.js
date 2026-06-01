const ApiError = require('../utils/apiError');

/**
 * Express Global Error Handling Middleware.
 * Captures all standard and operational errors, formats them, and returns standard JSON payloads.
 */
const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // 1. If the error is not an instance of custom ApiError, wrap it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  // 2. Extract operational variables
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Something went wrong';
  let details = error.errors || [];

  // 3. Handle specific MongoDB / Mongoose errors
  // Mongoose Cast Error (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    const customMsg = `Invalid ${err.path}: ${err.value}`;
    error = ApiError.badRequest(customMsg);
    error.statusCode = 400;
  }
  
  // Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const fieldName = Object.keys(err.keyValue)[0];
    const customMsg = `Duplicate field value entered: '${err.keyValue[fieldName]}'. Please use another ${fieldName}.`;
    error = ApiError.badRequest(customMsg);
    error.statusCode = 400;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message,
    }));
    const customMsg = 'Database validation failed';
    error = ApiError.badRequest(customMsg, validationErrors);
    error.statusCode = 400;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid security token. Please log in again.');
    error.statusCode = 401;
  }
  
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Security token has expired. Please refresh your session.');
    error.statusCode = 401;
  }

  // 4. Construct standardized error response
  const responsePayload = {
    success: false,
    message: error.message || message,
    error: {
      status: error.statusCode || statusCode,
      details: error.errors && error.errors.length > 0 ? error.errors : undefined
    }
  };

  // 5. Append stack trace only in development mode to avoid leaking sensitive information
  if (process.env.NODE_ENV === 'development') {
    responsePayload.stack = err.stack;
    
    // Print stack trace to console for easier debugging
    console.error(`[Error Middleware] Catch:`, err);
  }

  return res.status(error.statusCode || statusCode).json(responsePayload);
};

module.exports = errorMiddleware;
