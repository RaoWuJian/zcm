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
const { logOperation, saveOriginalData } = require('../middleware/operationLog');
const CommissionAccounting = require('../models/CommissionAccounting');

const router = express.Router();

// 所有路由都需要身份验证
router.use(protect);

// 核算佣金记录路由
router.route('/')
  .get(getCommissionAccountings)    // 获取核算佣金记录列表 - 不需要特殊权限
  .post(
    authorize('productCommission:create'),
    logOperation({
      operationType: 'CREATE',
      module: 'COMMISSION',
      getResourceName: (req, res) => res.data?.productName || req.body.productName,
      getDescription: (req, res) => `创建佣金核算: ${res.data?.productName || req.body.productName}`
    }),
    createCommissionAccounting
  );

router.route('/batch')
  .post(
    authorize('productCommission:create'),
    logOperation({
      operationType: 'CREATE',
      module: 'COMMISSION',
      getDescription: (req, res) => `批量创建佣金核算: ${req.body.records?.length || 0}条`
    }),
    batchCreateCommissionAccounting
  )
  .delete(
    authorize('productCommission:delete'),
    logOperation({
      operationType: 'DELETE',
      module: 'COMMISSION',
      getDescription: (req, res) => `批量删除佣金核算: ${req.body.ids?.length || 0}条`
    }),
    batchDeleteCommissionAccounting
  );

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
  .put(
    authorize('productCommission:update'),
    saveOriginalData(CommissionAccounting),
    logOperation({
      operationType: 'UPDATE',
      module: 'COMMISSION',
      getResourceName: (req, res) => res.data?.productName || req.originalData?.productName,
      getDescription: (req, res) => `更新佣金核算: ${res.data?.productName || req.originalData?.productName}`
    }),
    updateCommissionAccounting
  )
  .delete(
    authorize('productCommission:delete'),
    saveOriginalData(CommissionAccounting),
    logOperation({
      operationType: 'DELETE',
      module: 'COMMISSION',
      getResourceName: (req, res) => req.originalData?.productName,
      getDescription: (req, res) => `删除佣金核算: ${req.originalData?.productName}`
    }),
    deleteCommissionAccounting
  );

module.exports = router;
