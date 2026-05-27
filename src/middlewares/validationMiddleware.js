const Joi = require('joi');
const ApiError = require('../utils/apiError');

/**
 * Reusable validation compiler middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      allowUnknown: true, // Allow extraneous parameters but parse known ones
      stripUnknown: true // Remove parameters that are not defined in schema
    });

    if (error) {
      const errorDetails = error.details.map((err) => ({
        field: err.path.join('.'),
        message: err.message.replace(/"/g, '')
      }));
      return next(ApiError.badRequest('Input validation failed', errorDetails));
    }

    // Replace request body with Joi-validated and sanitized body
    req.body = value;
    next();
  };
};

// --- Earthquakes Validation Schemas ---
const earthquakeCreateSchema = Joi.object({
  id: Joi.string().required().messages({
    'any.required': 'Earthquake unique ID is required'
  }),
  time: Joi.date().required().messages({
    'any.required': 'Date time is required',
    'date.base': 'Please provide a valid ISO date'
  }),
  latitude: Joi.number().min(-90).max(90).required().messages({
    'any.required': 'Latitude coordinate is required',
    'number.min': 'Latitude must be between -90 and 90 degrees',
    'number.max': 'Latitude must be between -90 and 90 degrees'
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    'any.required': 'Longitude coordinate is required',
    'number.min': 'Longitude must be between -180 and 180 degrees',
    'number.max': 'Longitude must be between -180 and 180 degrees'
  }),
  depth: Joi.number().required().messages({
    'any.required': 'Depth is required'
  }),
  mag: Joi.number().min(0).max(10).required().messages({
    'any.required': 'Magnitude is required',
    'number.min': 'Magnitude must be a positive value'
  }),
  magType: Joi.string().required().messages({
    'any.required': 'Magnitude type is required'
  }),
  nst: Joi.number().integer().allow(null, '').optional(),
  gap: Joi.number().allow(null, '').optional(),
  dmin: Joi.number().allow(null, '').optional(),
  rms: Joi.number().allow(null, '').optional(),
  net: Joi.string().required().messages({
    'any.required': 'Network code is required'
  }),
  updated: Joi.date().required().messages({
    'any.required': 'Updated date is required'
  }),
  place: Joi.string().required().messages({
    'any.required': 'Place location description is required'
  }),
  type: Joi.string().default('earthquake'),
  horizontalError: Joi.number().allow(null, '').optional(),
  depthError: Joi.number().allow(null, '').optional(),
  magError: Joi.number().allow(null, '').optional(),
  magNst: Joi.number().integer().allow(null, '').optional(),
  status: Joi.string().valid('reviewed', 'automatic').required().messages({
    'any.required': 'Review status is required',
    'any.only': 'Status must be reviewed or automatic'
  }),
  locationSource: Joi.string().required(),
  magSource: Joi.string().required()
});

const earthquakeUpdateSchema = earthquakeCreateSchema.fork(
  ['id', 'time', 'latitude', 'longitude', 'depth', 'mag', 'magType', 'net', 'updated', 'place', 'status', 'locationSource', 'magSource'],
  (schema) => schema.optional()
);

// --- Authentication Validation Schemas ---
const userRegisterSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'any.required': 'Valid email is required',
    'string.email': 'Please provide a valid email format'
  }),
  password: Joi.string().min(6).required().messages({
    'any.required': 'Password is required',
    'string.min': 'Password must be at least 6 characters'
  }),
  role: Joi.string().valid('user', 'admin').default('user')
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

module.exports = {
  validate,
  earthquakeCreateSchema,
  earthquakeUpdateSchema,
  userRegisterSchema,
  userLoginSchema
};
