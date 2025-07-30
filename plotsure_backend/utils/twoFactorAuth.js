const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { User } = require('../models');

// Generate 2FA secret for a user
exports.generateSecret = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `PlotSure Connect (${user.email})`,
      issuer: 'PlotSure Connect',
      length: 32
    });

    // Update user with 2FA secret
    await user.update({
      two_factor_secret: secret.base32,
      two_factor_enabled: false // Will be enabled after first verification
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      otpauthUrl: secret.otpauth_url
    };
  } catch (error) {
    console.error('Error generating 2FA secret:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Verify 2FA token
exports.verifyToken = async (userId, token) => {
  try {
    const user = await User.findByPk(userId);
    if (!user || !user.two_factor_secret) {
      return {
        success: false,
        error: '2FA not set up for this user'
      };
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps in case of slight time differences
    });

    if (verified) {
      // If this is the first verification, enable 2FA
      if (!user.two_factor_enabled) {
        await user.update({ two_factor_enabled: true });
      }
      
      return {
        success: true,
        message: '2FA token verified successfully'
      };
    } else {
      return {
        success: false,
        error: 'Invalid 2FA token'
      };
    }
  } catch (error) {
    console.error('Error verifying 2FA token:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Disable 2FA for a user
exports.disable2FA = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    await user.update({
      two_factor_secret: null,
      two_factor_enabled: false
    });

    return {
      success: true,
      message: '2FA disabled successfully'
    };
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Check if 2FA is required for login
exports.is2FARequired = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    return user && user.two_factor_enabled;
  } catch (error) {
    console.error('Error checking 2FA requirement:', error);
    return false;
  }
};

// Generate backup codes for 2FA
exports.generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 8; i++) {
    codes.push(speakeasy.generateSecret({ length: 10 }).base32);
  }
  return codes;
};

// Verify backup code
exports.verifyBackupCode = async (userId, backupCode) => {
  try {
    const user = await User.findByPk(userId);
    if (!user || !user.backup_codes) {
      return {
        success: false,
        error: 'No backup codes found'
      };
    }

    const codes = JSON.parse(user.backup_codes);
    const codeIndex = codes.indexOf(backupCode);

    if (codeIndex === -1) {
      return {
        success: false,
        error: 'Invalid backup code'
      };
    }

    // Remove used backup code
    codes.splice(codeIndex, 1);
    await user.update({ backup_codes: JSON.stringify(codes) });

    return {
      success: true,
      message: 'Backup code verified successfully',
      remainingCodes: codes.length
    };
  } catch (error) {
    console.error('Error verifying backup code:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 