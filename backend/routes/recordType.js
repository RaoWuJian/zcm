const express = require('express');
const router = express.Router();
const {
  getRecordTypes,
  createRecordType,
  updateRecordType,
  deleteRecordType,
  addSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getSubCategories
} = require('../controllers/recordTypeController');
const { protect } = require('../middleware/auth');
const { logOperation, saveOriginalData } = require('../middleware/operationLog');
const RecordType = require('../models/RecordType');

// 以下所有路由都需要认证
router.use(protect);

// 记录类型基本CRUD
router
  .route('/')
  .get(getRecordTypes)
  .post(
    logOperation({
      operationType: 'CREATE',
      module: 'RECORD_TYPE',
      getResourceName: (req, res) => res.data?.name || req.body.name,
      getDescription: (req, res) => `创建记录类型: ${res.data?.name || req.body.name}`
    }),
    createRecordType
  );

// 单个记录类型操作
router
  .route('/:id')
  .put(
    saveOriginalData(RecordType),
    logOperation({
      operationType: 'UPDATE',
      module: 'RECORD_TYPE',
      getResourceName: (req, res) => res.data?.name || req.originalData?.name,
      getDescription: (req, res) => `更新记录类型: ${res.data?.name || req.originalData?.name}`
    }),
    updateRecordType
  )
  .delete(
    saveOriginalData(RecordType),
    logOperation({
      operationType: 'DELETE',
      module: 'RECORD_TYPE',
      getResourceName: (req, res) => req.originalData?.name,
      getDescription: (req, res) => `删除记录类型: ${req.originalData?.name}`
    }),
    deleteRecordType
  );

// 小类路由
router.get('/:id/subcategories', getSubCategories);

router.post('/:id/subcategories',
  logOperation({
    operationType: 'CREATE',
    module: 'RECORD_TYPE',
    getResourceName: (req, res) => req.body.name,
    getDescription: (req, res) => `添加小类: ${req.body.name}`
  }),
  addSubCategory
);

router.put('/:id/subcategories/:subId',
  logOperation({
    operationType: 'UPDATE',
    module: 'RECORD_TYPE',
    getResourceName: (req, res) => req.body.name,
    getDescription: (req, res) => `更新小类: ${req.body.name}`
  }),
  updateSubCategory
);

router.delete('/:id/subcategories/:subId',
  logOperation({
    operationType: 'DELETE',
    module: 'RECORD_TYPE',
    getResourceName: (req, res) => '小类',
    getDescription: (req, res) => `删除小类`
  }),
  deleteSubCategory
);

module.exports = router;
