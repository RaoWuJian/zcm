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

const router = express.Router();

// 以下所有路由都需要认证
router.use(protect);

// 统计数据路由（需要放在 /:id 路由之前）- 不需要特殊权限
router.get('/stats', getInventoryStats);

// 批量操作路由
router.post('/batch', authorize('inventory:create'), batchCreateInventory);

// 库存基本CRUD
router
  .route('/')
  .get(getInventories)  // 查看库存列表不需要特殊权限
  .post(authorize('inventory:create'), createInventory);  // 创建库存需要权限

router
  .route('/:id')
  .get(getInventory)  // 查看单个库存不需要特殊权限
  .put(authorize('inventory:update'), updateInventory)  // 更新库存需要权限
  .delete(authorize('inventory:delete'), deleteInventory);  // 删除库存需要权限

// 出入库操作
router.post('/:id/out', authorize('inventory:out'), inventoryOut);  // 出库操作需要权限
router.post('/:id/in', authorize('inventory:in'), inventoryIn);  // 入库操作需要权限

// 获取特定库存的操作记录 - 不需要特殊权限
router.get('/:id/records', getInventoryRecordsByInventoryId);

module.exports = router;
