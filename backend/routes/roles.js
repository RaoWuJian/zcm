const express = require('express');
const {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole,
  getRoleStats,
  getAvailablePermissions
} = require('../controllers/roleController');
const { protect, authorize } = require('../middleware/auth');
const { logOperation, saveOriginalData } = require('../middleware/operationLog');
const Role = require('../models/Role');

const router = express.Router();

// 所有路由都需要认证和管理员权限
router.use(protect);

// 角色统计信息
router.get('/stats', getRoleStats);

// 获取可用权限列表
router.get('/permissions', getAvailablePermissions);

// 角色基本操作
router
  .route('/')
  .get(getRoles)  // 查看角色列表不需要特殊权限，只需要认证
  .post(
    authorize('role:create'),
    logOperation({
      operationType: 'CREATE',
      module: 'ROLE',
      getResourceName: (req, res) => res.data?.roleName || req.body.roleName,
      getDescription: (req, res) => `创建角色: ${res.data?.roleName || req.body.roleName}`
    }),
    createRole
  );

// 特定角色操作
router
  .route('/:id')
  .get(getRole)  // 查看单个角色不需要特殊权限
  .put(
    authorize('role:update'),
    saveOriginalData(Role),
    logOperation({
      operationType: 'UPDATE',
      module: 'ROLE',
      getResourceName: (req, res) => res.data?.roleName || req.originalData?.roleName,
      getDescription: (req, res) => `更新角色: ${res.data?.roleName || req.originalData?.roleName}`
    }),
    updateRole
  )
  .delete(
    authorize('role:delete'),
    saveOriginalData(Role),
    logOperation({
      operationType: 'DELETE',
      module: 'ROLE',
      getResourceName: (req, res) => req.originalData?.roleName,
      getDescription: (req, res) => `删除角色: ${req.originalData?.roleName}`
    }),
    deleteRole
  );

module.exports = router;