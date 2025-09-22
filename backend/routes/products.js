const express = require('express');
const {
  createProduct,
  batchCreateProducts,
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

// 批量操作路由
router.post('/batch', authorize('product:create'), batchCreateProducts);
router.delete('/batch', authorize('product:delete'), batchDeleteProduct);

// 产品基本CRUD
router
  .route('/')
  .get(getProducts)  // 查看产品列表不需要特殊权限
  .post(authorize('product:create'), createProduct);  // 创建产品需要 product:create 权限

// 单个产品操作
router
  .route('/:id')
  .get(getProduct)  // 查看单个产品不需要特殊权限
  .put(authorize('product:update'), updateProduct)  // 更新产品需要 product:update 权限
  .delete(authorize('product:delete'), deleteProduct);  // 删除产品需要 product:delete 权限

module.exports = router;