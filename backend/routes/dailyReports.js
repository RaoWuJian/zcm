const express = require('express');
const {
  getDailyReports,
  getDailyReport,
  createDailyReport,
  updateDailyReport,
  deleteDailyReport,
  batchDeleteDailyReports,
  markAsRead,
  approveDailyReport,
  getStatistics
} = require('../controllers/dailyReportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(protect);

// 获取统计数据
router.get('/statistics', getStatistics);

// 导出数据
router.get('/export', authorize('dailyDataReport:export'), getDailyReports);

// 批量删除
router.delete('/batch', authorize('dailyDataReport:delete'), batchDeleteDailyReports);

// 标记为已读
router.put('/:id/read', markAsRead);

// 审批（汇报人可以审批，不需要特殊权限）
router.put('/:id/approve', approveDailyReport);

// 获取日数据报表列表和创建新记录
router.route('/')
  .get(getDailyReports)
  .post(authorize('dailyDataReport:create'), createDailyReport);

// 获取、更新、删除特定记录
router.route('/:id')
  .get(getDailyReport)
  .put(authorize('dailyDataReport:update'), updateDailyReport)
  .delete(authorize('dailyDataReport:delete'), deleteDailyReport);

module.exports = router;
