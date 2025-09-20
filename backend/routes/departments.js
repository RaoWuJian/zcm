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
const { logOperation, saveOriginalData } = require('../middleware/operationLog');
const Department = require('../models/Department');

const router = express.Router();

// 所有路由都需要认证
router.use(protect);

// 获取部门树形结构
router.get('/tree', getDepartmentTree);
// 创建和获取所有部门（管理员权限）
router
  .route('/')
  .get(getDepartments)
  .post(
    logOperation({
      operationType: 'CREATE',
      module: 'DEPARTMENT',
      getResourceName: (req, res) => res.data?.departmentName || req.body.departmentName,
      getDescription: (req, res) => `创建部门: ${res.data?.departmentName || req.body.departmentName}`
    }),
    createDepartment
  );

// 获取、更新、删除特定部门
router
  .route('/:id')
  .get(getDepartment)
  .put(
    saveOriginalData(Department),
    logOperation({
      operationType: 'UPDATE',
      module: 'DEPARTMENT',
      getResourceName: (req, res) => res.data?.departmentName || req.originalData?.departmentName,
      getDescription: (req, res) => `更新部门: ${res.data?.departmentName || req.originalData?.departmentName}`
    }),
    updateDepartment
  )
  .delete(
    saveOriginalData(Department),
    logOperation({
      operationType: 'DELETE',
      module: 'DEPARTMENT',
      getResourceName: (req, res) => req.originalData?.departmentName,
      getDescription: (req, res) => `删除部门: ${req.originalData?.departmentName}`
    }),
    deleteDepartment
  );

module.exports = router;