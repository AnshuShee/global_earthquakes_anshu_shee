const express = require('express');
const UserController = require('../controllers/userController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Enforce strict protection & role-based restrictions for all user CRUD pathways
router.use(protect, restrictTo('admin'));

router.route('/')
  .get(UserController.getAll)
  .post(UserController.create);

router.route('/:id')
  .patch(UserController.update)
  .delete(UserController.delete);

module.exports = router;
