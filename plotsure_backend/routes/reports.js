const express = require('express');
const { query } = require('express-validator');
const router = express.Router();

const reportsController = require('../controllers/reportsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Validation rules
const activityLogsValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601()
];

// Get activity logs (admin only)
router.get('/activity-logs',
  authenticateToken,
  requireRole(['admin']),
  activityLogsValidation,
  reportsController.getActivityLogs
);

// Export activity logs as CSV (admin only)
router.get('/activity-logs/export',
  authenticateToken,
  requireRole(['admin']),
  reportsController.exportActivityLogs
);

// Get system statistics (admin only)
router.get('/system-stats',
  authenticateToken,
  requireRole(['admin']),
  reportsController.getSystemStats
);

// Get user activity summary (admin only)
router.get('/user-activity/:user_id',
  authenticateToken,
  requireRole(['admin']),
  [query('days').optional().isInt({ min: 1, max: 365 })],
  reportsController.getUserActivitySummary
);

// Get activity trends (admin only)
router.get('/activity-trends',
  authenticateToken,
  requireRole(['admin']),
  [query('days').optional().isInt({ min: 1, max: 365 })],
  reportsController.getActivityTrends
);

module.exports = router; 