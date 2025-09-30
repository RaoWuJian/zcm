const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// 获取用户通知列表
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type = null,
      isRead = null
    } = req.query;

    const userId = req.user._id;
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      type: type,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : null
    };

    const notifications = await Notification.getByUser(userId, options);
    const totalCount = await Notification.countDocuments({
      recipient: userId,
      ...(type && { type }),
      ...(isRead !== null && { isRead: isRead === 'true' })
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: '获取通知失败',
      error: error.message
    });
  }
});

// 获取用户未读通知
router.get('/unread', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 50;

    const notifications = await Notification.getUnreadByUser(userId, limit);
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({
      success: false,
      message: '获取未读通知失败',
      error: error.message
    });
  }
});

// 获取通知统计信息
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Notification.aggregate([
      { $match: { recipient: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: {
              $cond: [{ $eq: ['$isRead', false] }, 1, 0]
            }
          },
          byType: {
            $push: {
              type: '$type',
              isRead: '$isRead'
            }
          }
        }
      }
    ]);

    const result = stats[0] || { total: 0, unread: 0, byType: [] };
    
    // 按类型统计
    const typeStats = {};
    result.byType.forEach(item => {
      if (!typeStats[item.type]) {
        typeStats[item.type] = { total: 0, unread: 0 };
      }
      typeStats[item.type].total++;
      if (!item.isRead) {
        typeStats[item.type].unread++;
      }
    });

    res.json({
      success: true,
      data: {
        total: result.total,
        unread: result.unread,
        read: result.total - result.unread,
        byType: typeStats
      }
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: '获取通知统计失败',
      error: error.message
    });
  }
});

// 标记通知为已读
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: userId
      },
      {
        isRead: true
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在或无权限访问'
      });
    }

    res.json({
      success: true,
      message: '通知已标记为已读',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: '标记通知失败',
      error: error.message
    });
  }
});

// 批量标记通知为已读
router.patch('/batch/read', protect, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user._id;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的通知ID列表'
      });
    }

    const result = await Notification.markAsRead(notificationIds, userId);

    res.json({
      success: true,
      message: `已标记 ${result.modifiedCount} 条通知为已读`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error batch marking notifications as read:', error);
    res.status(500).json({
      success: false,
      message: '批量标记通知失败',
      error: error.message
    });
  }
});

// 标记所有通知为已读
router.patch('/all/read', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: `已标记 ${result.modifiedCount} 条通知为已读`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: '标记所有通知失败',
      error: error.message
    });
  }
});

// 删除通知
router.delete('/:id', protect, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在或无权限访问'
      });
    }

    res.json({
      success: true,
      message: '通知已删除'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: '删除通知失败',
      error: error.message
    });
  }
});

// 批量删除通知
router.delete('/batch', protect, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user._id;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的通知ID列表'
      });
    }

    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      recipient: userId
    });

    res.json({
      success: true,
      message: `已删除 ${result.deletedCount} 条通知`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Error batch deleting notifications:', error);
    res.status(500).json({
      success: false,
      message: '批量删除通知失败',
      error: error.message
    });
  }
});

module.exports = router;
