const express = require('express');
const router = express.Router();
const {
  getDailyReports,
  getDailyReport,
  createDailyReport,
  updateDailyReport,
  deleteDailyReport,
  getProductNameSuggestions,
  getUnreadNotifications,
  markDailyReportAsRead,
  getDailyReportReadStatus,
  getDailyReportStatistics,
  exportDailyReports
} = require('../controllers/dailyReportController');
const { protect } = require('../middleware/auth');

// 获取产品名称建议（需要放在 /:id 路由之前）
router.get('/suggestions/product-names',
  protect,
  getProductNameSuggestions
);

// 获取未读通知
router.get('/notifications/unread',
  protect,
  getUnreadNotifications
);

// 获取日报统计数据
router.get('/statistics/summary',
  protect,
  getDailyReportStatistics
);

// 导出日报数据
router.get('/export/data',
  protect,
  exportDailyReports
);

// 获取日报列表
router.get('/',
  protect,
  getDailyReports
);

// 获取单个日报详情
router.get('/:id',
  protect,
  getDailyReport
);



// 创建日报
router.post('/',
  protect,
  createDailyReport
);

// 更新日报
router.put('/:id',
  protect,
  updateDailyReport
);

// 删除日报
router.delete('/:id',
  protect,
  deleteDailyReport
);

// 标记日报为已读
router.post('/:id/read', protect, markDailyReportAsRead);

// 获取日报已读状态
router.get('/:id/read-status', protect, getDailyReportReadStatus);

module.exports = router;
