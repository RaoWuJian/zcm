const express = require('express');
const {
  getInventoryRecords
} = require('../controllers/inventoryRecordController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 以下所有路由都需要认证
router.use(protect);

// 获取所有库存操作记录
router.get('/', getInventoryRecords);

module.exports = router;
