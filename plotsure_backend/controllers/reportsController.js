const { ActivityLog, User, Listing, Inquiry } = require('../models');
const { Op } = require('sequelize');

// Get activity logs with filtering
exports.getActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      entity,
      user_id,
      start_date,
      end_date,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Build filters
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (user_id) where.user_id = user_id;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    // Search in details
    if (search) {
      where[Op.or] = [
        { action: { [Op.like]: `%${search}%` } },
        { entity: { [Op.like]: `%${search}%` } },
        { details: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: logs } = await ActivityLog.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role'],
          required: false
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalLogs: count,
          hasNextPage: page < Math.ceil(count / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity logs',
      error: error.message
    });
  }
};

// Export activity logs as CSV
exports.exportActivityLogs = async (req, res) => {
  try {
    const {
      action,
      entity,
      user_id,
      start_date,
      end_date
    } = req.query;

    const where = {};

    // Build filters
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (user_id) where.user_id = user_id;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const logs = await ActivityLog.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email', 'role'],
          required: false
        }
      ]
    });

    // Transform data for CSV export
    const csvHeaders = 'Date,Action,Entity,EntityID,User,Email,Role,IPAddress,Details,UserAgent\n';
    const csvData = logs.map(log => {
      const user = log.user || {};
      return `"${log.created_at.toISOString()}","${log.action || ''}","${log.entity || ''}","${log.entity_id || ''}","${user.name || 'Anonymous'}","${user.email || ''}","${user.role || ''}","${log.ip_address || ''}","${log.details || ''}","${log.user_agent || ''}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvHeaders + csvData);

  } catch (error) {
    console.error('Export activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export activity logs',
      error: error.message
    });
  }
};

// Get system statistics
exports.getSystemStats = async (req, res) => {
  try {
    const stats = await Promise.all([
      // User statistics
      User.count(),
      User.count({ where: { role: 'admin' } }),
      User.count({ where: { role: 'broker' } }),
      User.count({ where: { verified: true } }),
      
      // Listing statistics
      Listing.count(),
      Listing.count({ where: { status: 'available' } }),
      Listing.count({ where: { status: 'sold' } }),
      Listing.count({ where: { status: 'reserved' } }),
      Listing.count({ where: { featured: true } }),
      Listing.count({ where: { is_verified: true } }),
      
      // Inquiry statistics
      Inquiry.count(),
      Inquiry.count({ where: { status: 'new' } }),
      Inquiry.count({ where: { status: 'responded' } }),
      Inquiry.count({ where: { status: 'converted' } }),
      
      // Activity statistics
      ActivityLog.count(),
      ActivityLog.count({ 
        where: { 
          created_at: { 
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) 
          } 
        } 
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: stats[0] || 0,
          admins: stats[1] || 0,
          brokers: stats[2] || 0,
          verified: stats[3] || 0
        },
        listings: {
          total: stats[4] || 0,
          available: stats[5] || 0,
          sold: stats[6] || 0,
          reserved: stats[7] || 0,
          featured: stats[8] || 0,
          verified: stats[9] || 0
        },
        inquiries: {
          total: stats[10] || 0,
          new: stats[11] || 0,
          responded: stats[12] || 0,
          converted: stats[13] || 0
        },
        activity: {
          total_logs: stats[14] || 0,
          last_24h: stats[15] || 0
        }
      }
    });

  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system statistics',
      error: error.message
    });
  }
};

// Get user activity summary
exports.getUserActivitySummary = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const userLogs = await ActivityLog.findAll({
      where: {
        user_id: user_id,
        created_at: { [Op.gte]: startDate }
      },
      order: [['created_at', 'DESC']]
    });

    // Group by action type
    const actionSummary = userLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});

    // Get recent activities
    const recentActivities = userLogs.slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        user_id: user_id,
        period_days: days,
        total_activities: userLogs.length,
        action_summary: actionSummary,
        recent_activities: recentActivities
      }
    });

  } catch (error) {
    console.error('Get user activity summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user activity summary',
      error: error.message
    });
  }
};

// Get activity trends
exports.getActivityTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get daily activity counts
    const dailyLogs = await ActivityLog.findAll({
      where: {
        created_at: { [Op.gte]: startDate }
      },
      attributes: [
        [ActivityLog.sequelize.fn('DATE', ActivityLog.sequelize.col('created_at')), 'date'],
        [ActivityLog.sequelize.fn('COUNT', ActivityLog.sequelize.col('id')), 'count']
      ],
      group: [ActivityLog.sequelize.fn('DATE', ActivityLog.sequelize.col('created_at'))],
      order: [[ActivityLog.sequelize.fn('DATE', ActivityLog.sequelize.col('created_at')), 'ASC']]
    });

    // Get action type distribution
    const actionDistribution = await ActivityLog.findAll({
      where: {
        created_at: { [Op.gte]: startDate }
      },
      attributes: [
        'action',
        [ActivityLog.sequelize.fn('COUNT', ActivityLog.sequelize.col('id')), 'count']
      ],
      group: ['action'],
      order: [[ActivityLog.sequelize.fn('COUNT', ActivityLog.sequelize.col('id')), 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        period_days: days,
        daily_activity: dailyLogs,
        action_distribution: actionDistribution
      }
    });

  } catch (error) {
    console.error('Get activity trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity trends',
      error: error.message
    });
  }
}; 