const express = require('express');
const {
  createOperationalProduct,
  batchCreateOperationalProducts,
  getOperationalProducts,
  getOperationalProduct,
  updateOperationalProduct,
  deleteOperationalProduct,
  batchDeleteOperationalProducts,
  getShopNameSuggestions,
  getPlatformSuggestions,
  getProductNameSuggestions,
  getTeamSuggestions
} = require('../controllers/operationalProductController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要身份验证
router.use(protect);

// 运营商品记录路由
router.route('/')
  .get(getOperationalProducts)    // 获取运营商品记录列表 - 不需要特殊权限
  .post(authorize('productOperation:create'), createOperationalProduct); // 创建运营商品记录

router.route('/batch')
  .post(authorize('productOperation:create'), batchCreateOperationalProducts)   // 批量创建运营商品记录
  .delete(authorize('productOperation:delete'), batchDeleteOperationalProducts); // 批量删除运营商品记录

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
  .get(getOperationalProduct)     // 获取单个运营商品记录 - 不需要特殊权限
  .put(authorize('productOperation:update'), updateOperationalProduct)  // 更新运营商品记录
  .delete(authorize('productOperation:delete'), deleteOperationalProduct); // 删除运营商品记录

module.exports = router;
