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
const { protect } = require('../middleware/auth');

const router = express.Router();

// 以下所有路由都需要认证
router.use(protect);

// 统计数据路由（需要放在 /:id 路由之前）
router.get('/stats', getFinanceStats);

// 批量删除路由
router.delete('/batch', batchDeleteFinance);

// 财务记录基本CRUD
router
  .route('/')
  .get(getFinances)
  .post(createFinance);

// 审批路由
router.put('/:id/approve', approveFinance);

// 单个财务记录操作
router
  .route('/:id')
  .get(getFinance)
  .put(updateFinance)
  .delete(deleteFinance);

module.exports = router;