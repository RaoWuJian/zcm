const express = require('express');
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  batchDeleteProduct,
  getProductSuggestions
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 以下所有路由都需要认证
router.use(protect);

// 统计数据路由（需要放在 /:id 路由之前）
router.get('/stats', getProductStats);

// 获取建议数据路由（需要放在 /:id 路由之前）
router.get('/suggestions', getProductSuggestions);

// 批量删除路由
router.delete('/batch', batchDeleteProduct);

// 产品基本CRUD
router
  .route('/')
  .get(getProducts)
  .post(createProduct);

// 单个产品操作
router
  .route('/:id')
  .get(getProduct)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;