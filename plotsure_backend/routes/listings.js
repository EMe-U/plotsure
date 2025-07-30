const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const listingController = require('../controllers/listingController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const { uploadListingFiles, handleUploadError } = require('../middleware/upload');

// Validation rules
const createListingValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('sector')
    .notEmpty()
    .withMessage('Sector is required'),
  body('cell')
    .notEmpty()
    .withMessage('Cell is required'),
  body('village')
    .notEmpty()
    .withMessage('Village is required'),
  body('price_amount')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('price_currency')
    .optional()
    .isIn(['RWF', 'USD'])
    .withMessage('Currency must be RWF or USD'),
  body('land_size_value')
    .isFloat({ min: 1 })
    .withMessage('Land size must be a positive number'),
  body('land_size_unit')
    .optional()
    .isIn(['sqm', 'hectares', 'acres'])
    .withMessage('Land size unit must be sqm, hectares, or acres'),
  body('land_type')
    .isIn(['residential', 'commercial', 'agricultural', 'industrial', 'mixed'])
    .withMessage('Invalid land type'),
  body('landowner_name')
    .notEmpty()
    .withMessage('Landowner name is required'),
  body('landowner_phone')
    .notEmpty()
    .withMessage('Landowner phone is required'),
  body('landowner_id_number')
    .notEmpty()
    .withMessage('Landowner ID number is required'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude')
];

const updateListingValidation = [
  body('title')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('price_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('land_size_value')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Land size must be a positive number'),
  body('land_type')
    .optional()
    .isIn(['residential', 'commercial', 'agricultural', 'industrial', 'mixed'])
    .withMessage('Invalid land type'),
  body('status')
    .optional()
    .isIn(['available', 'reserved', 'sold'])
    .withMessage('Invalid status')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid listing ID')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('min_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be positive'),
  query('max_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be positive'),
  query('min_size')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum size must be positive'),
  query('max_size')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum size must be positive')
];

// Public routes (no authentication required)
router.get('/', 
  queryValidation, 
  optionalAuth, 
  listingController.getAllListings
);

// Get listing by ID
router.get('/:id', idValidation, listingController.getListingById);

// Debug endpoint to check listings
router.get('/debug/listings', async (req, res) => {
  try {
    const { Listing, User } = require('../models');
    
    // Get all listings
    const listings = await Listing.findAll({
      include: [
        {
          model: User,
          as: 'broker',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Get listing count
    const totalCount = await Listing.count();
    const availableCount = await Listing.count({ where: { status: 'available' } });
    const reservedCount = await Listing.count({ where: { status: 'reserved' } });
    const soldCount = await Listing.count({ where: { status: 'sold' } });
    
    res.json({
      success: true,
      message: 'Debug listings information',
      data: {
        totalListings: totalCount,
        availableListings: availableCount,
        reservedListings: reservedCount,
        soldListings: soldCount,
        listings: listings.map(listing => ({
          id: listing.id,
          title: listing.title,
          status: listing.status,
          created_at: listing.created_at,
          broker: listing.broker ? listing.broker.name : 'No broker'
        }))
      }
    });
  } catch (error) {
    console.error('Debug listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
});

// Protected routes (require authentication)
router.use(authenticateToken);

// Broker routes (brokers and admins can access)
router.post('/', 
  uploadListingFiles,
  handleUploadError,
  createListingValidation,
  requireRole(['broker', 'admin']),
  listingController.createListing
);

router.put('/:id', 
  idValidation,
  updateListingValidation,
  requireRole(['broker', 'admin']),
  listingController.updateListing
);

router.delete('/:id', 
  idValidation,
  requireRole(['broker', 'admin']),
  listingController.deleteListing
);

// Get broker's own listings
router.get('/broker/my-listings', 
  queryValidation,
  requireRole(['broker', 'admin']),
  listingController.getBrokerListings
);

// Get listing statistics
router.get('/stats/overview', 
  requireRole(['broker', 'admin']),
  listingController.getListingStats
);

// Admin only routes
router.put('/:id/featured', 
  idValidation,
  body('featured').isBoolean().withMessage('Featured must be boolean'),
  requireRole(['admin']),
  listingController.toggleFeatured
);

router.put('/:id/verify', 
  idValidation,
  body('verification_notes').optional().isString(),
  requireRole(['admin']),
  listingController.verifyListing
);

module.exports = router;