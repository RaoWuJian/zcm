const express = require('express');
const {
  createDepartment,
  getDepartments,
  getDepartmentTree,
  getDepartment,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(protect);

// 获取部门树形结构
router.get('/tree', getDepartmentTree);
// 创建和获取所有部门（管理员权限）
router
  .route('/')
  .get(getDepartments)
  .post(createDepartment);

// 获取、更新、删除特定部门
router
  .route('/:id')
  .get(getDepartment)
  .put(updateDepartment)
  .delete(deleteDepartment);

module.exports = router;