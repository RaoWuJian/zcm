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
const { logOperation, saveOriginalData } = require('../middleware/operationLog');
const Product = require('../models/Product');

const router = express.Router();

// 以下所有路由都需要认证
router.use(protect);

// 统计数据路由（需要放在 /:id 路由之前）
router.get('/stats', getProductStats);

// 获取建议数据路由（需要放在 /:id 路由之前）
router.get('/suggestions', getProductSuggestions);

// 批量操作路由
router.post('/batch',
  authorize('product:create'),
  logOperation({
    operationType: 'CREATE',
    module: 'PRODUCT',
    getDescription: (req, res) => `批量创建产品: ${req.body.products?.length || 0}个`
  }),
  batchCreateProducts
);

router.delete('/batch',
  authorize('product:delete'),
  logOperation({
    operationType: 'DELETE',
    module: 'PRODUCT',
    getDescription: (req, res) => `批量删除产品: ${req.body.ids?.length || 0}个`
  }),
  batchDeleteProduct
);

// 产品基本CRUD
router
  .route('/')
  .get(getProducts)  // 查看产品列表不需要特殊权限
  .post(
    authorize('product:create'),
    logOperation({
      operationType: 'CREATE',
      module: 'PRODUCT',
      getResourceName: (req, res) => res.data?.productName || req.body.productName,
      getDescription: (req, res) => `创建产品: ${res.data?.productName || req.body.productName}`
    }),
    createProduct
  );

// 单个产品操作
router
  .route('/:id')
  .get(getProduct)  // 查看单个产品不需要特殊权限
  .put(
    authorize('product:update'),
    saveOriginalData(Product),
    logOperation({
      operationType: 'UPDATE',
      module: 'PRODUCT',
      getResourceName: (req, res) => res.data?.productName || req.originalData?.productName,
      getDescription: (req, res) => `更新产品: ${res.data?.productName || req.originalData?.productName}`
    }),
    updateProduct
  )
  .delete(
    authorize('product:delete'),
    saveOriginalData(Product),
    logOperation({
      operationType: 'DELETE',
      module: 'PRODUCT',
      getResourceName: (req, res) => req.originalData?.productName,
      getDescription: (req, res) => `删除产品: ${req.originalData?.productName}`
    }),
    deleteProduct
  );

module.exports = router;