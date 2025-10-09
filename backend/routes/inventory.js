const express = require('express');
const {
  createInventory,
  getInventories,
  getInventory,
  updateInventory,
  deleteInventory,
  inventoryOut,
  inventoryIn,
  batchCreateInventory
} = require('../controllers/inventoryController');
const {
  getInventoryRecords,
  getInventoryRecordsByInventoryId,
  getInventoryStats
} = require('../controllers/inventoryRecordController');
const { protect, authorize } = require('../middleware/auth');
const { logOperation, saveOriginalData } = require('../middleware/operationLog');
const Inventory = require('../models/Inventory');

const router = express.Router();

// 以下所有路由都需要认证
router.use(protect);

// 统计数据路由（需要放在 /:id 路由之前）- 不需要特殊权限
router.get('/stats', getInventoryStats);

// 批量操作路由
router.post('/batch',
  authorize('inventory:create'),
  logOperation({
    operationType: 'CREATE',
    module: 'INVENTORY',
    getDescription: (req, res) => `批量创建库存: ${req.body.inventories?.length || 0}个`
  }),
  batchCreateInventory
);

// 库存基本CRUD
router
  .route('/')
  .get(getInventories)  // 查看库存列表不需要特殊权限
  .post(
    authorize('inventory:create'),
    logOperation({
      operationType: 'CREATE',
      module: 'INVENTORY',
      getResourceName: (req, res) => res.data?.productName || req.body.productName,
      getDescription: (req, res) => `创建库存: ${res.data?.productName || req.body.productName}`
    }),
    createInventory
  );

router
  .route('/:id')
  .get(getInventory)  // 查看单个库存不需要特殊权限
  .put(
    authorize('inventory:update'),
    saveOriginalData(Inventory),
    logOperation({
      operationType: 'UPDATE',
      module: 'INVENTORY',
      getResourceName: (req, res) => res.data?.productName || req.originalData?.productName,
      getDescription: (req, res) => `更新库存: ${res.data?.productName || req.originalData?.productName}`
    }),
    updateInventory
  )
  .delete(
    authorize('inventory:delete'),
    saveOriginalData(Inventory),
    logOperation({
      operationType: 'DELETE',
      module: 'INVENTORY',
      getResourceName: (req, res) => req.originalData?.productName,
      getDescription: (req, res) => `删除库存: ${req.originalData?.productName}`
    }),
    deleteInventory
  );

// 出入库操作
router.post('/:id/out',
  authorize('inventory:out'),
  saveOriginalData(Inventory),
  logOperation({
    operationType: 'UPDATE',
    module: 'INVENTORY',
    getResourceName: (req, res) => req.originalData?.productName,
    getDescription: (req, res) => `库存出库: ${req.originalData?.productName} - 数量: ${req.body.quantity}`
  }),
  inventoryOut
);

router.post('/:id/in',
  authorize('inventory:in'),
  saveOriginalData(Inventory),
  logOperation({
    operationType: 'UPDATE',
    module: 'INVENTORY',
    getResourceName: (req, res) => req.originalData?.productName,
    getDescription: (req, res) => `库存入库: ${req.originalData?.productName} - 数量: ${req.body.quantity}`
  }),
  inventoryIn
);

// 获取特定库存的操作记录 - 不需要特殊权限
router.get('/:id/records', getInventoryRecordsByInventoryId);

module.exports = router;
