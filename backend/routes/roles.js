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
  .post(authorize('role:create'), createRole);  // 创建角色需要 role:create 权限

// 特定角色操作
router
  .route('/:id')
  .get(getRole)  // 查看单个角色不需要特殊权限
  .put(authorize('role:update'), updateRole)  // 更新角色需要 role:update 权限
  .delete(authorize('role:delete'), deleteRole);  // 删除角色需要 role:delete 权限

module.exports = router;