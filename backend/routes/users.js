const express = require('express');
const {
  login,
  logout,
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
const { logOperation, saveOriginalData } = require('../middleware/operationLog');
const User = require('../models/User');

const router = express.Router();

// 公开路由（不需要认证）
router.post('/login',
  logOperation({
    operationType: 'LOGIN',
    module: 'USER',
    getDescription: (req, res) => `用户登录: ${req.body.loginAccount}`
  }),
  login
);

// 以下所有路由都需要认证
router.use(protect);

// 登出路由
router.post('/logout',
  logOperation({
    operationType: 'LOGOUT',
    module: 'USER',
    getResourceName: (req, res) => req.user.username,
    getDescription: (req, res) => `用户登出: ${req.user.username}`
  }),
  logout
);

// 当前用户相关操作
router.get('/me', getMe);
router.put('/me',
  saveOriginalData(User),
  logOperation({
    operationType: 'UPDATE',
    module: 'USER',
    getResourceName: (req, res) => req.user.username,
    getDescription: () => '更新个人信息'
  }),
  updateMe
);
router.put('/password',
  logOperation({
    operationType: 'UPDATE',
    module: 'USER',
    getResourceName: (req, res) => req.user.username,
    getDescription: () => '修改登录密码'
  }),
  updatePassword
);

// 用户统计信息（仅管理员）
router.get('/stats', authorize('admin'), getUserStats);

// 创建和获取所有用户
router
  .route('/')
  .get(getUsers)  // 查看用户列表不需要特殊权限
  .post(
    authorize('user:create'),
    logOperation({
      operationType: 'CREATE',
      module: 'USER',
      getResourceName: (req, res) => res.data?.username || req.body.username,
      getDescription: (req, res) => `创建用户: ${res.data?.username || req.body.username}`
    }),
    createUser
  );
router.get('/getNoDepartmentUser', authorize('department:manageEmployee'), getNoDepartmentUser)

// 批量添加用户到部门
router.put('/add-to-department',
  authorize('department:manageEmployee'),
  logOperation({
    operationType: 'UPDATE',
    module: 'USER',
    getDescription: (req, res) => `批量添加用户到部门: ${req.body.departmentPath}`
  }),
  addUserToDepartment
);

// 获取、更新、删除特定用户
router
  .route('/:id')
  .get(getUser)  // 查看单个用户不需要特殊权限
  .put(
    authorize('user:update'),
    saveOriginalData(User),
    logOperation({
      operationType: 'UPDATE',
      module: 'USER',
      getResourceName: (req, res) => res.data?.username || req.originalData?.username,
      getDescription: (req, res) => `更新用户: ${res.data?.username || req.originalData?.username}`
    }),
    updateUser
  )
  .delete(
    authorize('user:delete'),
    saveOriginalData(User),
    logOperation({
      operationType: 'DELETE',
      module: 'USER',
      getResourceName: (req, res) => req.originalData?.username,
      getDescription: (req, res) => `删除用户: ${req.originalData?.username}`
    }),
    deleteUser
  );

module.exports = router;