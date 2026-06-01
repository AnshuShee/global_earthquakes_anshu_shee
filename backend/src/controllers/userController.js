const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

class UserController {
  /**
   * Retrieve all users from MongoDB except password and refresh tokens
   */
  getAll = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password -refreshTokens').sort({ createdAt: -1 });
    return ApiResponse.success(res, 'Users successfully retrieved.', users);
  });

  /**
   * Provision a new user profile via administrative panel
   */
  create = asyncHandler(async (req, res) => {
    const { name, email, password, role, status } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.badRequest('A user with this email address already exists.');
    }

    // Default password for admin-created profiles
    const newUser = await User.create({
      name,
      email,
      password: password || 'SecureAdminCreatedTempPass123!',
      role: role || 'user',
      status: status || 'Active'
    });

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return ApiResponse.success(res, 'User profile successfully provisioned.', userResponse, 201);
  });

  /**
   * Update an existing user profile (name, role, status)
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, role, status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      throw ApiError.notFound('User profile not found.');
    }

    // Protection to avoid lockout or demotion of master admin account
    if (user.email === 'admin@example.com' && (role === 'user' || status === 'Suspended')) {
      throw ApiError.badRequest('The master system administrator account cannot be demoted or suspended.');
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;

    return ApiResponse.success(res, 'User profile successfully updated.', userResponse);
  });

  /**
   * Delete a user profile permanently from MongoDB
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Do not allow deleting own currently logged-in account
    if (req.user._id.toString() === id) {
      throw ApiError.badRequest('You cannot delete your own active administrator profile.');
    }

    const user = await User.findById(id);
    if (!user) {
      throw ApiError.notFound('User profile not found.');
    }

    if (user.email === 'admin@example.com') {
      throw ApiError.badRequest('The master system administrator account cannot be deleted.');
    }

    await User.findByIdAndDelete(id);

    return ApiResponse.success(res, 'User account permanently deleted.');
  });
}

module.exports = new UserController();
