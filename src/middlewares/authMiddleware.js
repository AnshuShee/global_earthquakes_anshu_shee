const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authentication protector middleware.
 * Verifies the Bearer JWT token in Authorization header, checks user existence, and updates req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check if Bearer token is provided in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Check if token is missing
  if (!token) {
    return next(ApiError.unauthorized('Please provide a valid security token to access this resource.'));
  }

  // 3. Verify security token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 4. Verify user still exists in DB
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(ApiError.unauthorized('The user session is no longer active. Please log in again.'));
  }

  // 5. Grant access: attach user context to request object
  req.user = currentUser;
  next();
});

/**
 * Role-Based Access Control (RBAC) middleware.
 * Restricts endpoint access to specific user roles (e.g. 'admin').
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Please log in to perform this action.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this administrative task.'));
    }

    next();
  };
};

module.exports = {
  protect,
  restrictTo
};
