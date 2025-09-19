# 财务权限控制API测试指南

## 测试场景说明

本文档描述如何测试新实现的财务记录权限控制功能。

### 权限控制规则

1. **未审批记录**：创建者可以自由修改和删除
2. **已审批记录**：
   - 创建者无法修改和删除
   - 只有上级部门人员可以修改和删除
   - 管理员拥有所有权限

### 测试数据准备

需要准备以下测试用户和部门结构：

```
总部
├── 销售部
│   ├── 华南区
│   └── 华北区
└── 技术部
```

用户分配：
- 管理员：admin (isAdmin: true)
- 总部用户：hq_user (departmentPath: "总部")
- 销售部用户：sales_user (departmentPath: "总部->销售部")
- 华南区用户：south_user (departmentPath: "总部->销售部->华南区")
- 华北区用户：north_user (departmentPath: "总部->销售部->华北区")
- 技术部用户：tech_user (departmentPath: "总部->技术部")

### API测试用例

#### 1. 创建财务记录
```http
POST /api/finance
Authorization: Bearer <south_user_token>
Content-Type: application/json

{
  "teamId": "team_id_here",
  "name": "测试收入记录",
  "type": "income",
  "amount": 1000,
  "occurredAt": "2024-01-15T10:00:00Z",
  "description": "测试用收入记录"
}
```

#### 2. 审批财务记录
```http
PUT /api/finance/{record_id}/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "approvalStatus": "approved",
  "approvalComment": "审批通过"
}
```

#### 3. 测试权限控制

##### 3.1 创建者尝试修改已审批记录（应该失败）
```http
PUT /api/finance/{record_id}
Authorization: Bearer <south_user_token>
Content-Type: application/json

{
  "name": "修改后的记录名称",
  "amount": 1500
}
```
**期望结果**: 403 Forbidden，消息："已审批的记录只能由上级部门人员修改"

##### 3.2 上级部门用户修改已审批记录（应该成功）
```http
PUT /api/finance/{record_id}
Authorization: Bearer <sales_user_token>
Content-Type: application/json

{
  "name": "销售部修改的记录",
  "amount": 1200
}
```
**期望结果**: 200 OK，记录成功更新

##### 3.3 同级部门用户尝试修改（应该失败）
```http
PUT /api/finance/{record_id}
Authorization: Bearer <north_user_token>
Content-Type: application/json

{
  "name": "华北区尝试修改",
  "amount": 800
}
```
**期望结果**: 403 Forbidden，消息："已审批的记录只能由上级部门人员修改"

##### 3.4 创建者尝试删除已审批记录（应该失败）
```http
DELETE /api/finance/{record_id}
Authorization: Bearer <south_user_token>
```
**期望结果**: 403 Forbidden，消息："已审批的记录只能由上级部门人员删除"

##### 3.5 上级部门用户删除已审批记录（应该成功）
```http
DELETE /api/finance/{record_id}
Authorization: Bearer <sales_user_token>
```
**期望结果**: 200 OK，记录成功删除，团队账户余额恢复

##### 3.6 管理员操作（应该总是成功）
```http
PUT /api/finance/{record_id}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "管理员修改的记录"
}
```
**期望结果**: 200 OK，记录成功更新

#### 4. 批量删除测试

##### 4.1 批量删除包含已审批记录（权限不足时应该失败）
```http
DELETE /api/finance/batch
Authorization: Bearer <south_user_token>
Content-Type: application/json

{
  "ids": ["record_id_1", "record_id_2"]
}
```
**期望结果**: 403 Forbidden，消息包含具体哪个记录权限不足

##### 4.2 上级部门用户批量删除（应该成功）
```http
DELETE /api/finance/batch
Authorization: Bearer <sales_user_token>
Content-Type: application/json

{
  "ids": ["record_id_1", "record_id_2"]
}
```
**期望结果**: 200 OK，所有记录成功删除

### 验证要点

1. **权限检查时机**：只有在记录状态为 "approved" 时才进行权限检查
2. **部门层级判断**：基于 departmentPath 字段的前缀匹配
3. **管理员特权**：管理员始终拥有所有权限
4. **错误消息**：权限不足时返回清晰的错误消息
5. **数据一致性**：删除已审批记录时正确恢复团队账户余额

### 注意事项

- 测试前确保数据库中有相应的用户、部门和团队账户数据
- 每个测试用例都需要有效的JWT token
- 测试完成后清理测试数据
- 确保测试环境与生产环境隔离
