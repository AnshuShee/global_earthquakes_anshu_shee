const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/apiError');

/**
 * Custom handler to map rate-limiting triggers into standard ApiError objects
 */
const limitHandler = (req, res, next, options) => {
  next(new ApiError(429, 'Too many requests from this address. Please try again after 15 minutes.'));
};

// 1. Global API rate limiter (100 requests per 15 minutes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: limitHandler
});

// 2. Auth limiter (Stricter security to prevent brute force: 10 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler
});

// 3. Search and aggregation limiter (30 requests per 15 minutes to save DB CPU)
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler
});

module.exports = {
  globalLimiter,
  authLimiter,
  searchLimiter
};
