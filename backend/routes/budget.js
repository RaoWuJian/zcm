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
const { protect } = require('../middleware/auth');

const router = express.Router();

// 以下所有路由都需要认证
router.use(protect);

// 产品预算基本CRUD
router
  .route('/')
  .get(getProductBudgets)
  .post(createProductBudget);

// 批量操作
router
  .route('/batch')
  .post(batchCreateProductBudget)
  .delete(batchDeleteProductBudget);

// 建议数据
router.get('/suggestions/product-names', getProductNameSuggestions);
router.get('/suggestions/shop-names', getShopNameSuggestions);
router.get('/suggestions/platforms', getPlatformSuggestions);

// 单个产品预算操作
router
  .route('/:id')
  .get(getProductBudget)
  .put(updateProductBudget)
  .delete(deleteProductBudget);

module.exports = router;