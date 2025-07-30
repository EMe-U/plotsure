const express = require('express');
const router = express.Router();
const { ActivityLog, User } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Admin-only: Download activity logs as CSV or JSON
router.get('/activity-logs', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const logs = await ActivityLog.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['created_at', 'DESC']]
    });
    const format = req.query.format || 'json';
    if (format === 'csv') {
      // Simple CSV export without external dependency
      const csvHeaders = 'ID,User ID,User Name,User Email,Action,Entity,Entity ID,Details,Created At\n';
      const csvData = logs.map(log => {
        const user = log.user || {};
        return `${log.id},${log.user_id || ''},"${user.name || ''}","${user.email || ''}","${log.action || ''}","${log.entity || ''}",${log.entity_id || ''},"${log.details || ''}","${log.created_at || ''}"`;
      }).join('\n');
      
      res.header('Content-Type', 'text/csv');
      res.attachment('activity_logs.csv');
      return res.send(csvHeaders + csvData);
    } else {
      return res.json({ success: true, data: logs });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch activity logs', error: err.message });
  }
});

module.exports = router; 