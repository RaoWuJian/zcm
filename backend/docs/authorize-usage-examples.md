# authorize 函数优化使用指南

## 概述

优化后的 `authorize` 函数实现了类似前端 `hasPermission` 的效果，支持：
- 传入权限数组，有任意一个权限即可通过
- 管理员自动拥有所有权限
- 细粒度权限控制

## 基本用法

```javascript
const { protect, authorize } = require('../middleware/auth');

// 单个权限
router.post('/products', protect, authorize('product:create'), createProduct);

// 多个权限（有任一即可）
router.put('/products/:id', protect, authorize('product:update', 'product:manage'), updateProduct);

// 只允许管理员
router.delete('/users/:id', protect, authorize('admin'), deleteUser);
```

## 权限代码对照表

### 用户管理权限
- `user:create` - 创建员工账号
- `user:update` - 编辑员工信息
- `user:delete` - 删除员工账号

### 部门管理权限
- `department:create` - 创建部门
- `department:update` - 编辑部门信息
- `department:delete` - 删除部门
- `department:manageEmployee` - 管理部门员工

### 角色权限管理
- `role:create` - 创建角色
- `role:update` - 编辑角色权限
- `role:delete` - 删除角色

### 商品管理权限
- `product:create` - 创建商品信息
- `product:update` - 编辑商品信息
- `product:delete` - 删除商品信息

### 财务测算权限
- `productBudget:create` - 新增财务测算
- `productBudget:update` - 编辑财务测算
- `productBudget:delete` - 删除财务测算

### 产品佣金权限
- `productCommission:create` - 新增产品佣金
- `productCommission:update` - 编辑产品佣金
- `productCommission:delete` - 删除产品佣金

### 商品运营权限
- `productOperation:create` - 新增商品运营
- `productOperation:update` - 编辑商品运营
- `productOperation:delete` - 删除商品运营

### 库存管理权限
- `inventory:create` - 添加库存
- `inventory:update` - 编辑库存
- `inventory:in` - 入库操作
- `inventory:out` - 出库操作
- `inventory:delete` - 删除库存

### 财务管理权限
- `finance:create` - 创建收支记录
- `finance:update` - 编辑收支记录
- `finance:delete` - 删除收支记录
- `finance:approve` - 收支记录审批
- `finance:typeSetting` - 收支类型设置

### 团队财务账户权限
- `finance:team_create` - 创建团队账户
- `finance:team_update` - 编辑团队账户
- `finance:team_delete` - 删除团队账户

## 实际使用示例

### 产品路由示例
```javascript
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect); // 所有路由都需要认证

// 查看不需要特殊权限
router.get('/products', getProducts);

// 创建需要权限
router.post('/products', authorize('product:create'), createProduct);

// 更新需要权限
router.put('/products/:id', authorize('product:update'), updateProduct);

// 删除需要权限
router.delete('/products/:id', authorize('product:delete'), deleteProduct);

// 批量操作需要权限
router.post('/products/batch', authorize('product:create'), batchCreateProducts);
router.delete('/products/batch', authorize('product:delete'), batchDeleteProducts);
```

### 角色管理路由示例
```javascript
// 角色管理 - 只有有相应权限的用户才能操作
router.post('/roles', authorize('role:create'), createRole);
router.put('/roles/:id', authorize('role:update'), updateRole);
router.delete('/roles/:id', authorize('role:delete'), deleteRole);

// 查看角色列表不需要特殊权限（已认证即可）
router.get('/roles', getRoles);
```

### 财务管理路由示例
```javascript
// 财务记录操作
router.post('/finance', authorize('finance:create'), createFinance);
router.put('/finance/:id', authorize('finance:update'), updateFinance);
router.delete('/finance/:id', authorize('finance:delete'), deleteFinance);

// 审批需要特殊权限
router.put('/finance/:id/approve', authorize('finance:approve'), approveFinance);

// 类型设置需要特殊权限
router.post('/finance/types', authorize('finance:typeSetting'), createFinanceType);
```

### 管理员专用路由示例
```javascript
// 只有管理员才能访问的路由
router.get('/admin/stats', authorize('admin'), getAdminStats);
router.post('/admin/backup', authorize('admin'), createBackup);
router.delete('/admin/logs', authorize('admin'), clearLogs);
```

## 优化特性

1. **性能优化**：在 `protect` 中间件中预加载用户角色权限信息，避免重复查询
2. **简化使用**：只需传入权限数组，有任一权限即可通过
3. **管理员特权**：管理员自动拥有所有权限
4. **错误处理**：提供清晰的错误信息
5. **兼容性**：保持与原有 API 的兼容性

## 注意事项

1. 确保在使用 `authorize` 之前先使用 `protect` 中间件
2. 权限代码必须与 Role 模型中定义的枚举值一致
3. 管理员用户（`isAdmin: true`）自动拥有所有权限
4. 查看类操作通常不需要特殊权限，只需要认证即可
