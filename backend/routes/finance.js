const express = require('express');
const {
  createFinance,
  getFinances,
  getFinance,
  updateFinance,
  deleteFinance,
  approveFinance,
  getFinanceStats,
  batchDeleteFinance
} = require('../controllers/financeController');
const { protect, authorize } = require('../middleware/auth');
const { logOperation, saveOriginalData } = require('../middleware/operationLog');
const Finance = require('../models/Finance');

const router = express.Router();

// 以下所有路由都需要认证
router.use(protect);

// 统计数据路由（需要放在 /:id 路由之前）- 不需要特殊权限
router.get('/stats', getFinanceStats);

// 批量删除路由
router.delete('/batch',
  authorize('finance:delete'),
  logOperation({
    operationType: 'DELETE',
    module: 'FINANCE',
    getDescription: (req, res) => `批量删除财务记录: ${req.body.ids?.length || 0}条`
  }),
  batchDeleteFinance
);

// 财务记录基本CRUD
router
  .route('/')
  .get(getFinances)  // 查看财务记录列表不需要特殊权限
  .post(
    authorize('finance:create'),
    logOperation({
      operationType: 'CREATE',
      module: 'FINANCE',
      getResourceName: (req, res) => res.data?.name || req.body.name,
      getDescription: (req, res) => `创建财务记录: ${res.data?.name || req.body.name}`
    }),
    createFinance
  );

// 审批路由
router.put('/:id/approve',
  authorize('finance:approve'),
  saveOriginalData(Finance),
  logOperation({
    operationType: 'APPROVE',
    module: 'FINANCE',
    getResourceName: (req, res) => req.originalData?.name,
    getDescription: (req, res) => `审批财务记录: ${req.originalData?.name} - ${req.body.approved ? '通过' : '拒绝'}`
  }),
  approveFinance
);

// 单个财务记录操作
router
  .route('/:id')
  .get(getFinance)  // 查看单个财务记录不需要特殊权限
  .put(
    authorize('finance:update'),
    saveOriginalData(Finance),
    logOperation({
      operationType: 'UPDATE',
      module: 'FINANCE',
      getResourceName: (req, res) => res.data?.name || req.originalData?.name,
      getDescription: (req, res) => `更新财务记录: ${res.data?.name || req.originalData?.name}`
    }),
    updateFinance
  )
  .delete(
    authorize('finance:delete'),
    saveOriginalData(Finance),
    logOperation({
      operationType: 'DELETE',
      module: 'FINANCE',
      getResourceName: (req, res) => req.originalData?.name,
      getDescription: (req, res) => `删除财务记录: ${req.originalData?.name}`
    }),
    deleteFinance
  );

module.exports = router;