const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/apiError');

/**
 * Custom handler to map rate-limiting triggers into standard ApiError objects
 */
const limitHandler = (req, res, next, options) => {
  next(new ApiError(429, 'Too many requests from this address. Please try again after 15 minutes.'));
};

const isDevOrTest = process.env.NODE_ENV !== 'production';

// 1. Global API rate limiter (500 requests per 15 minutes in prod, 5000 in dev)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevOrTest ? 5000 : 500, // Limit each IP to 500 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: limitHandler
});

// 2. Auth limiter (Stricter security to prevent brute force: 50 requests per 15 minutes in prod, 1000 in dev)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevOrTest ? 1000 : 50, // Limit each IP to 50 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler
});

// 3. Search and aggregation limiter (150 requests per 15 minutes in prod, 2000 in dev)
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevOrTest ? 2000 : 150, // Limit each IP to 150 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler
});

module.exports = {
  globalLimiter,
  authLimiter,
  searchLimiter
};
