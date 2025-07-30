const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  body('role')
    .optional()
    .isIn(['broker', 'admin'])
    .withMessage('Role must be either broker or admin')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);

// One-time initialization endpoint to create default users (public)
router.get('/init-users', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { User } = require('../models');
    
    let createdUsers = [];
    
    // Check and create admin user
    const adminExists = await User.findOne({ where: { email: 'admin@plotsure.com' } });
    if (!adminExists) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      const admin = await User.create({
        name: 'System Administrator',
        email: 'admin@plotsure.com',
        password: adminPassword,
        phone: '+250 791 000 000',
        role: 'admin',
        is_active: true,
        verified: true
      });
      createdUsers.push({ email: 'admin@plotsure.com', password: 'admin123', role: 'admin' });
    } else {
      // Update admin password to ensure it's correct
      const adminPassword = await bcrypt.hash('admin123', 10);
      await adminExists.update({ password: adminPassword });
      createdUsers.push({ email: 'admin@plotsure.com', password: 'admin123', role: 'admin' });
    }
    
    // Check and create broker user
    const brokerExists = await User.findOne({ where: { email: 'broker@plotsure.com' } });
    if (!brokerExists) {
      const brokerPassword = await bcrypt.hash('password123', 10);
      const broker = await User.create({
        name: 'Test Broker',
        email: 'broker@plotsure.com',
        password: brokerPassword,
        phone: '+250 791 845 708',
        role: 'broker',
        is_active: true,
        verified: true
      });
      createdUsers.push({ email: 'broker@plotsure.com', password: 'password123', role: 'broker' });
    } else {
      // Update broker password to ensure it's correct
      const brokerPassword = await bcrypt.hash('password123', 10);
      await brokerExists.update({ password: brokerPassword });
      createdUsers.push({ email: 'broker@plotsure.com', password: 'password123', role: 'broker' });
    }
    
    if (createdUsers.length > 0) {
      res.json({
        success: true,
        message: 'Default users created/updated successfully',
        users: createdUsers
      });
    } else {
      res.json({
        success: true,
        message: 'Default users already exist',
        users: [
          { email: 'admin@plotsure.com', password: 'admin123', role: 'admin' },
          { email: 'broker@plotsure.com', password: 'password123', role: 'broker' }
        ]
      });
    }
  } catch (error) {
    console.error('Error creating default users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create default users',
      error: error.message
    });
  }
});

// Protected routes (require authentication)
router.use(authenticateToken); // All routes below require authentication

router.get('/profile', authController.getProfile);
router.put('/profile', updateProfileValidation, authController.updateProfile);
router.put('/change-password', changePasswordValidation, authController.changePassword);
router.post('/logout', authController.logout);

// Admin only routes
router.get('/users', requireRole(['admin']), authController.getAllUsers);
router.put('/users/:userId/deactivate', requireRole(['admin']), authController.deactivateUser);
router.put('/users/:userId/activate', requireRole(['admin']), authController.activateUser);

module.exports = router;