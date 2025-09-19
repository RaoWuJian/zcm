const express = require('express');
const {
  createCommissionAccounting,
  getCommissionAccountings,
  getCommissionAccounting,
  updateCommissionAccounting,
  deleteCommissionAccounting,
  batchDeleteCommissionAccounting,
  getShopNameSuggestions,
  getPlatformSuggestions
} = require('../controllers/commissionAccountingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要身份验证
router.use(protect);

// 核算佣金记录路由
router.route('/')
  .get(getCommissionAccountings)    // 获取核算佣金记录列表
  .post(createCommissionAccounting); // 创建核算佣金记录

router.route('/batch')
  .delete(batchDeleteCommissionAccounting); // 批量删除核算佣金记录

// 建议数据路由
router.route('/suggestions/shop-names')
  .get(getShopNameSuggestions); // 获取店铺名称建议

router.route('/suggestions/platforms')
  .get(getPlatformSuggestions); // 获取平台建议

router.route('/:id')
  .get(getCommissionAccounting)     // 获取单个核算佣金记录
  .put(updateCommissionAccounting)  // 更新核算佣金记录
  .delete(deleteCommissionAccounting); // 删除核算佣金记录

module.exports = router;
