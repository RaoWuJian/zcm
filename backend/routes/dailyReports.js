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
const { logOperation, saveOriginalData } = require('../middleware/operationLog');
const DailyReport = require('../models/DailyReport');

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
  logOperation({
    operationType: 'CREATE',
    module: 'DAILY_REPORT',
    getResourceName: (req, res) => res.data?.productName || req.body.productName,
    getDescription: (req, res) => `创建日报: ${res.data?.productName || req.body.productName}`
  }),
  createDailyReport
);

// 更新日报
router.put('/:id',
  protect,
  saveOriginalData(DailyReport),
  logOperation({
    operationType: 'UPDATE',
    module: 'DAILY_REPORT',
    getResourceName: (req, res) => res.data?.productName || req.originalData?.productName,
    getDescription: (req, res) => `更新日报: ${res.data?.productName || req.originalData?.productName}`
  }),
  updateDailyReport
);

// 删除日报
router.delete('/:id',
  protect,
  saveOriginalData(DailyReport),
  logOperation({
    operationType: 'DELETE',
    module: 'DAILY_REPORT',
    getResourceName: (req, res) => req.originalData?.productName,
    getDescription: (req, res) => `删除日报: ${req.originalData?.productName}`
  }),
  deleteDailyReport
);

// 标记日报为已读
router.post('/:id/read', protect, markDailyReportAsRead);

// 获取日报已读状态
router.get('/:id/read-status', protect, getDailyReportReadStatus);

module.exports = router;
