const express = require('express');
const {
  createShipmentRecord,
  batchCreateShipmentRecord,
  getShipmentRecords,
  getShipmentRecord,
  updateShipmentRecord,
  deleteShipmentRecord,
  getShipmentStats,
  approveShipmentRecord
} = require('../controllers/shipmentRecordController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 以下所有路由都需要认证
router.use(protect);

// 统计数据路由（需要放在 /:id 路由之前）
router.get('/stats', getShipmentStats);

// 批量操作路由
router.post('/batch', authorize('shipment:create'), batchCreateShipmentRecord);

// 发货记录基本CRUD
router
  .route('/')
  .get(getShipmentRecords)  // 查看发货记录列表不需要特殊权限
  .post(authorize('shipment:create'), createShipmentRecord);  // 创建发货记录需要权限

router
  .route('/:id')
  .get(getShipmentRecord)  // 查看单个发货记录不需要特殊权限
  .put(authorize('shipment:update'), updateShipmentRecord)  // 更新发货记录需要权限
  .delete(authorize('shipment:delete'), deleteShipmentRecord);  // 删除发货记录需要权限

// 审批路由
router.put('/:id/approve', authorize('shipment:approve'), approveShipmentRecord);  // 审批发货记录需要权限

module.exports = router;
