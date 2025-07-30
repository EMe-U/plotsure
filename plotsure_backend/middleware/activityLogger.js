const { ActivityLog } = require('../models');

// Activity logging middleware
const logActivity = (action, entity, entityId = null, details = null) => {
  return async (req, res, next) => {
    // Store original send method
    const originalSend = res.send;
    
    // Override send method to capture response
    res.send = function(data) {
      // Restore original send method
      res.send = originalSend;
      
      // Log activity after response is sent
      setTimeout(async () => {
        try {
          const userId = req.user ? req.user.id : null;
          
          // Only log if there's a user or it's a public action
          if (userId || action === 'view' || action === 'search') {
            await ActivityLog.create({
              user_id: userId,
              action: action,
              entity: entity,
              entity_id: entityId,
              details: details ? JSON.stringify(details) : null,
              ip_address: req.ip || req.connection.remoteAddress,
              user_agent: req.get('User-Agent')
            });
          }
        } catch (error) {
          console.error('Activity logging error:', error);
        }
      }, 0);
      
      // Call original send method
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Specific activity loggers for common actions
const activityLoggers = {
  // Listing actions
  createListing: logActivity('create', 'listing'),
  updateListing: (req, res, next) => {
    logActivity('update', 'listing', req.params.id)(req, res, next);
  },
  deleteListing: (req, res, next) => {
    logActivity('delete', 'listing', req.params.id)(req, res, next);
  },
  viewListing: (req, res, next) => {
    logActivity('view', 'listing', req.params.id)(req, res, next);
  },
  
  // Inquiry actions
  createInquiry: logActivity('create', 'inquiry'),
  updateInquiry: (req, res, next) => {
    logActivity('update', 'inquiry', req.params.id)(req, res, next);
  },
  assignInquiry: (req, res, next) => {
    logActivity('assign', 'inquiry', req.params.id)(req, res, next);
  },
  
  // User actions
  login: logActivity('login', 'user'),
  logout: logActivity('logout', 'user'),
  updateProfile: logActivity('update', 'user'),
  
  // Admin actions
  verifyListing: (req, res, next) => {
    logActivity('verify', 'listing', req.params.id)(req, res, next);
  },
  toggleFeatured: (req, res, next) => {
    logActivity('toggle_featured', 'listing', req.params.id)(req, res, next);
  },
  
  // Search actions
  searchListings: (req, res, next) => {
    const searchParams = {
      query: req.query.search,
      filters: {
        status: req.query.status,
        land_type: req.query.land_type,
        min_price: req.query.min_price,
        max_price: req.query.max_price
      }
    };
    logActivity('search', 'listing', null, searchParams)(req, res, next);
  },
  
  // 2FA actions
  setup2FA: logActivity('setup', '2fa'),
  verify2FA: logActivity('verify', '2fa'),
  disable2FA: logActivity('disable', '2fa'),
  
  // File actions
  uploadFiles: (req, res, next) => {
    const fileDetails = {
      file_count: req.files ? Object.keys(req.files).length : 0,
      file_types: req.files ? Object.keys(req.files) : []
    };
    logActivity('upload', 'files', null, fileDetails)(req, res, next);
  },
  
  // Contact actions
  submitContact: logActivity('submit', 'contact'),
  
  // Custom action logger
  custom: (action, entity, entityId = null, details = null) => {
    return logActivity(action, entity, entityId, details);
  }
};

module.exports = activityLoggers; 