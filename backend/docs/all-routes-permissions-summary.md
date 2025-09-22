# 所有路由权限控制总结

## 概述

已为以下路由文件添加了细粒度的权限控制，使用优化后的 `authorize` 函数实现权限验证：

1. ✅ **budget.js** - 产品预算管理
2. ✅ **commissionAccounting.js** - 核算佣金管理
3. ✅ **departments.js** - 部门管理
4. ✅ **finance.js** - 财务管理
5. ✅ **inventory.js** - 库存管理
6. ✅ **operationalProduct.js** - 运营商品管理
7. ✅ **products.js** - 产品管理（已完成）
8. ✅ **recordType.js** - 记录类型管理
9. ✅ **roles.js** - 角色管理（已完成）
10. ✅ **teamAccounts.js** - 团队账户管理
11. ✅ **users.js** - 用户管理

## 权限控制策略

### 通用原则
- **查看操作（GET）**: 通常不需要特殊权限，只需要认证
- **创建操作（POST）**: 需要相应的 `create` 权限
- **更新操作（PUT）**: 需要相应的 `update` 权限
- **删除操作（DELETE）**: 需要相应的 `delete` 权限
- **特殊操作**: 需要特定权限（如审批、充值等）
- **管理员特权**: 管理员自动拥有所有权限

## 各模块权限详情

### 1. 产品预算管理 (budget.js)
| 操作 | 权限要求 |
|------|----------|
| 查看预算列表/单个预算 | 无特殊权限 |
| 创建/批量创建预算 | `productBudget:create` |
| 更新预算 | `productBudget:update` |
| 删除/批量删除预算 | `productBudget:delete` |
| 建议数据 | 无特殊权限 |

### 2. 核算佣金管理 (commissionAccounting.js)
| 操作 | 权限要求 |
|------|----------|
| 查看佣金列表/单个佣金 | 无特殊权限 |
| 创建/批量创建佣金 | `productCommission:create` |
| 更新佣金 | `productCommission:update` |
| 删除/批量删除佣金 | `productCommission:delete` |
| 建议数据 | 无特殊权限 |

### 3. 部门管理 (departments.js)
| 操作 | 权限要求 |
|------|----------|
| 查看部门列表/树形结构/单个部门 | 无特殊权限 |
| 创建部门 | `department:create` |
| 更新部门 | `department:update` |
| 删除部门 | `department:delete` |

### 4. 财务管理 (finance.js)
| 操作 | 权限要求 |
|------|----------|
| 查看财务记录列表/单个记录/统计 | 无特殊权限 |
| 创建财务记录 | `finance:create` |
| 更新财务记录 | `finance:update` |
| 删除/批量删除财务记录 | `finance:delete` |
| 审批财务记录 | `finance:approve` |

### 5. 库存管理 (inventory.js)
| 操作 | 权限要求 |
|------|----------|
| 查看库存列表/单个库存/统计/记录 | 无特殊权限 |
| 创建库存 | `inventory:create` |
| 更新库存 | `inventory:update` |
| 删除库存 | `inventory:delete` |
| 入库操作 | `inventory:in` |
| 出库操作 | `inventory:out` |

### 6. 运营商品管理 (operationalProduct.js)
| 操作 | 权限要求 |
|------|----------|
| 查看运营商品列表/单个商品 | 无特殊权限 |
| 创建/批量创建运营商品 | `productOperation:create` |
| 更新运营商品 | `productOperation:update` |
| 删除/批量删除运营商品 | `productOperation:delete` |
| 建议数据 | 无特殊权限 |

### 7. 产品管理 (products.js)
| 操作 | 权限要求 |
|------|----------|
| 查看产品列表/单个产品/统计/建议 | 无特殊权限 |
| 创建/批量创建产品 | `product:create` |
| 更新产品 | `product:update` |
| 删除/批量删除产品 | `product:delete` |

### 8. 记录类型管理 (recordType.js)
| 操作 | 权限要求 |
|------|----------|
| 查看记录类型列表/小类 | 无特殊权限 |
| 创建/更新/删除记录类型 | `finance:typeSetting` |
| 添加/更新/删除小类 | `finance:typeSetting` |

### 9. 角色管理 (roles.js)
| 操作 | 权限要求 |
|------|----------|
| 查看角色列表/单个角色/统计/权限列表 | 无特殊权限 |
| 创建角色 | `role:create` |
| 更新角色 | `role:update` |
| 删除角色 | `role:delete` |

### 10. 团队账户管理 (teamAccounts.js)
| 操作 | 权限要求 |
|------|----------|
| 查看团队账户列表/单个账户/记录 | 无特殊权限 |
| 创建团队账户 | `finance:team_create` |
| 更新团队账户/充值 | `finance:team_update` |
| 删除团队账户 | `finance:team_delete` |

### 11. 用户管理 (users.js)
| 操作 | 权限要求 |
|------|----------|
| 查看用户列表/单个用户 | 无特殊权限 |
| 个人信息操作 | 无特殊权限（自己的信息） |
| 创建用户 | `user:create` |
| 更新用户 | `user:update` |
| 删除用户 | `user:delete` |
| 用户统计 | `admin`（仅管理员） |
| 部门员工管理 | `department:manageEmployee` |

## 权限代码完整列表

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

### 特殊权限
- `admin` - 管理员权限（拥有所有权限）

## 实施效果

1. **安全性提升**: 所有修改操作都需要相应权限验证
2. **细粒度控制**: 支持按功能模块分配权限
3. **管理员特权**: 管理员自动拥有所有权限
4. **性能优化**: 预加载角色权限信息，减少数据库查询
5. **一致性**: 所有路由使用统一的权限控制策略

## 注意事项

1. 确保在角色管理中正确配置权限
2. 前端界面应根据用户权限显示/隐藏相应功能
3. 所有路由都包含 `protect` 中间件，确保用户已认证
4. 权限检查在数据库操作之前进行，提高安全性
5. 查看操作通常不需要特殊权限，但仍需要用户认证
