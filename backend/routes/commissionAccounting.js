const express = require('express');
const {
  createCommissionAccounting,
  batchCreateCommissionAccounting,
  getCommissionAccountings,
  getCommissionAccounting,
  updateCommissionAccounting,
  deleteCommissionAccounting,
  batchDeleteCommissionAccounting,
  getShopNameSuggestions,
  getPlatformSuggestions,
  getProductNameSuggestions,
  getTeamSuggestions
} = require('../controllers/commissionAccountingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要身份验证
router.use(protect);

// 核算佣金记录路由
router.route('/')
  .get(getCommissionAccountings)    // 获取核算佣金记录列表 - 不需要特殊权限
  .post(authorize('productCommission:create'), createCommissionAccounting); // 创建核算佣金记录

router.route('/batch')
  .post(authorize('productCommission:create'), batchCreateCommissionAccounting)   // 批量创建核算佣金记录
  .delete(authorize('productCommission:delete'), batchDeleteCommissionAccounting); // 批量删除核算佣金记录

// 建议数据路由 - 不需要特殊权限，只需要认证
router.route('/suggestions/shop-names')
  .get(getShopNameSuggestions); // 获取店铺名称建议

router.route('/suggestions/platforms')
  .get(getPlatformSuggestions); // 获取平台建议

router.route('/suggestions/product-names')
  .get(getProductNameSuggestions); // 获取产品名称建议

router.route('/suggestions/teams')
  .get(getTeamSuggestions); // 获取团队建议

router.route('/:id')
  .get(getCommissionAccounting)     // 获取单个核算佣金记录 - 不需要特殊权限
  .put(authorize('productCommission:update'), updateCommissionAccounting)  // 更新核算佣金记录
  .delete(authorize('productCommission:delete'), deleteCommissionAccounting); // 删除核算佣金记录

module.exports = router;
