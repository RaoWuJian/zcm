// 商品预算
const express = require('express');
const {
  createProductBudget,
  batchCreateProductBudget,
  getProductBudgets,
  getProductBudget,
  updateProductBudget,
  deleteProductBudget,
  batchDeleteProductBudget,
  getProductNameSuggestions,
  getShopNameSuggestions,
  getPlatformSuggestions
} = require('../controllers/productBudgetController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 以下所有路由都需要认证
router.use(protect);

// 产品预算基本CRUD
router
  .route('/')
  .get(getProductBudgets)  // 查看预算列表不需要特殊权限
  .post(authorize('productBudget:create'), createProductBudget);  // 创建预算需要权限

// 批量操作
router
  .route('/batch')
  .post(authorize('productBudget:create'), batchCreateProductBudget)  // 批量创建需要权限
  .delete(authorize('productBudget:delete'), batchDeleteProductBudget);  // 批量删除需要权限

// 建议数据 - 不需要特殊权限，只需要认证
router.get('/suggestions/product-names', getProductNameSuggestions);
router.get('/suggestions/shop-names', getShopNameSuggestions);
router.get('/suggestions/platforms', getPlatformSuggestions);

// 单个产品预算操作
router
  .route('/:id')
  .get(getProductBudget)  // 查看单个预算不需要特殊权限
  .put(authorize('productBudget:update'), updateProductBudget)  // 更新预算需要权限
  .delete(authorize('productBudget:delete'), deleteProductBudget);  // 删除预算需要权限

module.exports = router;