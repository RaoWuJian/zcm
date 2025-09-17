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
  .get(getRoles)
  .post(createRole);

// 特定角色操作
router
  .route('/:id')
  .get(getRole)
  .put(updateRole)
  .delete(deleteRole);

module.exports = router;