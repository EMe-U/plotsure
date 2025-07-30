const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const twoFactorAuth = require('../utils/twoFactorAuth');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Setup 2FA (generate secret and QR code)
router.post('/setup', 
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const result = await twoFactorAuth.generateSecret(req.user.id);
      
      if (result.success) {
        const backupCodes = twoFactorAuth.generateBackupCodes();
        const { User } = require('../models');
        const user = await User.findByPk(req.user.id);
        await user.update({ backup_codes: JSON.stringify(backupCodes) });

        res.status(200).json({
          success: true,
          message: '2FA setup initiated',
          data: {
            secret: result.secret,
            qrCode: result.qrCode,
            backupCodes: backupCodes
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to setup 2FA'
      });
    }
  }
);

// Verify 2FA token
router.post('/verify', 
  authenticateToken,
  [body('token').notEmpty().isLength({ min: 6, max: 6 })],
  async (req, res) => {
    try {
      const result = await twoFactorAuth.verifyToken(req.user.id, req.body.token);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: '2FA verification successful'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to verify 2FA token'
      });
    }
  }
);

// Disable 2FA
router.post('/disable',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const result = await twoFactorAuth.disable2FA(req.user.id);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: '2FA disabled successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to disable 2FA'
      });
    }
  }
);

module.exports = router; 