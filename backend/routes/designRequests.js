const express = require('express');
const router = express.Router();
const {
  getDesignRequests,
  getDesignRequest,
  createDesignRequest,
  updateDesignRequest,
  deleteDesignRequest,
  batchDeleteDesignRequests
} = require('../controllers/designRequestController');
const { protect } = require('../middleware/auth');
const { logOperation, saveOriginalData } = require('../middleware/operationLog');
const DesignRequest = require('../models/DesignRequest');

// 所有路由都需要认证
router.use(protect);

// 批量删除美工需求（需要放在 /:id 路由之前）
router.delete('/batch',
  logOperation({
    operationType: 'DELETE',
    module: 'DESIGN_REQUEST',
    getResourceName: () => '批量美工需求',
    getDescription: (req) => `批量删除美工需求: ${req.body.ids?.length || 0}个`
  }),
  batchDeleteDesignRequests
);

// 获取美工需求列表
router.get('/', getDesignRequests);

// 获取单个美工需求详情
router.get('/:id', getDesignRequest);

// 创建美工需求
router.post('/',
  logOperation({
    operationType: 'CREATE',
    module: 'DESIGN_REQUEST',
    getResourceName: (req, res) => res.data?.requirement?.substring(0, 50) || req.body.requirement?.substring(0, 50),
    getDescription: (req, res) => `创建美工需求: ${res.data?.requirement?.substring(0, 50) || req.body.requirement?.substring(0, 50)}`
  }),
  createDesignRequest
);

// 更新美工需求
router.put('/:id',
  saveOriginalData(DesignRequest),
  logOperation({
    operationType: 'UPDATE',
    module: 'DESIGN_REQUEST',
    getResourceName: (req, res) => res.data?.requirement?.substring(0, 50) || req.originalData?.requirement?.substring(0, 50),
    getDescription: (req, res) => `更新美工需求: ${res.data?.requirement?.substring(0, 50) || req.originalData?.requirement?.substring(0, 50)}`
  }),
  updateDesignRequest
);

// 删除美工需求
router.delete('/:id',
  saveOriginalData(DesignRequest),
  logOperation({
    operationType: 'DELETE',
    module: 'DESIGN_REQUEST',
    getResourceName: (req, res) => req.originalData?.requirement?.substring(0, 50),
    getDescription: (req, res) => `删除美工需求: ${req.originalData?.requirement?.substring(0, 50)}`
  }),
  deleteDesignRequest
);

module.exports = router;

