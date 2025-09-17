const express = require('express');
const {
  login,
  getMe,
  updateMe,
  updatePassword,
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserStats,
  addUserToDepartment,
  getNoDepartmentUser
} = require('../controllers/userController');
const { protect, authorize, protectOwnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// 公开路由（不需要认证）
router.post('/login', login);

// 以下所有路由都需要认证
router.use(protect);

// 当前用户相关操作
router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/password', updatePassword);

// 用户统计信息（仅管理员）
router.get('/stats',   getUserStats);

// 创建和获取所有用户（仅管理员）
router
  .route('/')
  .get(getUsers)
  .post(  createUser);
router.get('/getNoDepartmentUser', getNoDepartmentUser)

// 批量添加用户到部门（仅管理员）
router.put('/add-to-department', addUserToDepartment);

// 获取、更新、删除特定用户
router
  .route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(  deleteUser);

module.exports = router;