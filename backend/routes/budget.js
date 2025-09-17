// 商品预算
const express = require('express');
const {
  createProductBudget,
  getProductBudgets,
  getProductBudget,
  updateProductBudget,
  deleteProductBudget,
  batchDeleteProductBudget
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

// 批量删除
router
  .route('/batch')
  .delete(batchDeleteProductBudget);

// 单个产品预算操作
router
  .route('/:id')
  .get(getProductBudget)
  .put(updateProductBudget)
  .delete(deleteProductBudget);

module.exports = router;