# Budget 路由权限控制说明

## 概述

为 `backend/routes/budget.js` 添加了细粒度的权限控制，使用优化后的 `authorize` 函数实现权限验证。

## 权限控制详情

### 基本 CRUD 操作

| 操作 | 路由 | 方法 | 权限要求 | 说明 |
|------|------|------|----------|------|
| 查看预算列表 | `/` | GET | 无特殊权限 | 只需要认证即可 |
| 创建预算 | `/` | POST | `productBudget:create` | 需要创建权限 |
| 查看单个预算 | `/:id` | GET | 无特殊权限 | 只需要认证即可 |
| 更新预算 | `/:id` | PUT | `productBudget:update` | 需要更新权限 |
| 删除预算 | `/:id` | DELETE | `productBudget:delete` | 需要删除权限 |

### 批量操作

| 操作 | 路由 | 方法 | 权限要求 | 说明 |
|------|------|------|----------|------|
| 批量创建预算 | `/batch` | POST | `productBudget:create` | 需要创建权限 |
| 批量删除预算 | `/batch` | DELETE | `productBudget:delete` | 需要删除权限 |

### 辅助功能

| 操作 | 路由 | 方法 | 权限要求 | 说明 |
|------|------|------|----------|------|
| 产品名称建议 | `/suggestions/product-names` | GET | 无特殊权限 | 只需要认证即可 |
| 店铺名称建议 | `/suggestions/shop-names` | GET | 无特殊权限 | 只需要认证即可 |
| 平台建议 | `/suggestions/platforms` | GET | 无特殊权限 | 只需要认证即可 |

## 权限代码说明

### productBudget:create
- **用途**: 创建财务测算记录
- **适用操作**: 
  - 单个创建预算
  - 批量创建预算
- **角色配置**: 需要在角色管理中为相应角色分配此权限

### productBudget:update
- **用途**: 编辑财务测算记录
- **适用操作**: 
  - 更新单个预算记录
- **角色配置**: 需要在角色管理中为相应角色分配此权限

### productBudget:delete
- **用途**: 删除财务测算记录
- **适用操作**: 
  - 删除单个预算记录
  - 批量删除预算记录
- **角色配置**: 需要在角色管理中为相应角色分配此权限

## 管理员特权

- 管理员用户（`isAdmin: true`）自动拥有所有权限
- 无需为管理员单独配置预算相关权限
- 管理员可以执行所有预算操作

## 使用示例

### 为角色分配权限
```javascript
// 在角色创建/更新时，可以分配以下权限组合：

// 预算查看员 - 只能查看
const viewerPermissions = [];  // 不需要特殊权限，认证即可查看

// 预算操作员 - 可以创建和更新
const operatorPermissions = [
  'productBudget:create',
  'productBudget:update'
];

// 预算管理员 - 拥有所有权限
const managerPermissions = [
  'productBudget:create',
  'productBudget:update',
  'productBudget:delete'
];
```

### 前端权限检查
```javascript
// 在前端可以使用 hasPermission 检查权限
import hasAnyPermission from '@/utils/checkPermissions';

// 检查是否可以创建预算
const canCreate = hasAnyPermission(['productBudget:create']);

// 检查是否可以编辑预算
const canUpdate = hasAnyPermission(['productBudget:update']);

// 检查是否可以删除预算
const canDelete = hasAnyPermission(['productBudget:delete']);
```

## 安全考虑

1. **查看权限**: 查看操作不需要特殊权限，但仍需要用户认证
2. **操作权限**: 所有修改操作都需要相应的权限验证
3. **批量操作**: 批量操作使用与单个操作相同的权限要求
4. **建议数据**: 建议接口不需要特殊权限，因为不涉及敏感数据修改

## 错误处理

当用户没有相应权限时，会返回以下错误：

```json
{
  "success": false,
  "message": "权限不足，缺少必要权限"
}
```

HTTP 状态码：403 Forbidden

## 注意事项

1. 确保在角色管理中正确配置权限
2. 前端界面应根据用户权限显示/隐藏相应功能
3. 所有路由都已经包含 `protect` 中间件，确保用户已认证
4. 权限检查在数据库操作之前进行，提高安全性
