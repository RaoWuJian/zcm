const express = require('express');
const {
  createInventory,
  getInventories,
  getInventory,
  updateInventory,
  deleteInventory,
  inventoryOut,
  inventoryIn
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

// 统计数据路由（需要放在 /:id 路由之前）
router.get('/stats', getInventoryStats);

// 库存基本CRUD
router
  .route('/')
  .get(getInventories)
  .post(createInventory);

router
  .route('/:id')
  .get(getInventory)
  .put(updateInventory)
  .delete(deleteInventory);

// 出入库操作
router.post('/:id/out', inventoryOut);
router.post('/:id/in', inventoryIn);

// 获取特定库存的操作记录
router.get('/:id/records', getInventoryRecordsByInventoryId);

module.exports = router;
