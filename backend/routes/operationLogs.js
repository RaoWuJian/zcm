const express = require('express');
const {
  getOperationLogs,
  getOperationLog,
  // getOperationStats, // 已禁用 - 不需要统计分析功能
  getUserOperationHistory,
  deleteOperationLogs
} = require('../controllers/operationLogController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(protect);

// 获取操作日志列表
router.get('/', getOperationLogs);

// 获取操作统计信息 (已禁用 - 不需要统计分析功能)
// router.get('/stats', getOperationStats);

// 获取用户操作历史
router.get('/user/:userId', getUserOperationHistory);

// 获取单个操作日志详情
router.get('/:id', getOperationLog);

// 删除操作日志（仅管理员）
router.delete('/', authorize('admin'), deleteOperationLogs);

module.exports = router;
