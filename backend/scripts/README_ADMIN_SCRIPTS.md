# 管理员用户创建脚本使用说明

本目录包含三个用于创建管理员用户的脚本，适用于不同的使用场景。

## 脚本列表

### 1. createDefaultAdmin.js - 快速创建默认管理员
**推荐用于初次部署或测试环境**

```bash
node createDefaultAdmin.js
```

**特点：**
- 无需参数，一键创建
- 默认账号：`admin`
- 默认密码：`admin123456`
- 自动创建超级管理员角色
- 适合快速部署和测试

**默认信息：**
- 用户名：系统管理员
- 登录账号：admin
- 登录密码：admin123456
- 备注：系统默认管理员账户

### 2. createAdminInteractive.js - 交互式创建管理员
**推荐用于生产环境**

```bash
node createAdminInteractive.js
```

**特点：**
- 交互式界面，用户友好
- 实时输入验证
- 密码隐藏输入
- 支持覆盖现有用户
- 确认信息后再创建

**使用流程：**
1. 输入用户显示名称
2. 输入登录账号（3-30个字符）
3. 输入密码（至少6个字符）
4. 确认密码
5. 输入备注信息（可选）
6. 确认创建

### 3. createAdminUser.js - 命令行参数创建管理员
**推荐用于脚本自动化**

```bash
node createAdminUser.js --username "管理员" --account "admin" --password "123456" [选项]
```

**必需参数：**
- `--username`: 用户显示名称
- `--account`: 登录账号（3-30个字符）
- `--password`: 登录密码（至少6个字符）

**可选参数：**
- `--remark`: 备注信息
- `--force`: 强制覆盖已存在的用户
- `--help`: 显示帮助信息

**示例：**
```bash
# 创建基本管理员
node createAdminUser.js --username "系统管理员" --account "admin" --password "admin123456"

# 创建带备注的管理员
node createAdminUser.js --username "张三" --account "zhangsan" --password "password123" --remark "技术部门管理员"

# 强制覆盖现有用户
node createAdminUser.js --username "新管理员" --account "admin" --password "newpassword" --force

# 显示帮助
node createAdminUser.js --help
```

## 使用前准备

### 1. 环境要求
- Node.js 14.0 或更高版本
- MongoDB 数据库
- 已安装项目依赖

### 2. 数据库配置
确保以下环境变量已配置（在 `.env` 文件中）：
```
MONGODB_URI=mongodb://localhost:27017/zcm_db
```

如果没有配置，脚本将使用默认连接：`mongodb://localhost:27017/zcm_db`

### 3. 安装依赖
```bash
cd backend
npm install
```

## 权限说明

创建的管理员用户将拥有以下权限：

### 用户管理
- `user:view` - 查看用户
- `user:create` - 创建用户
- `user:update` - 更新用户
- `user:delete` - 删除用户
- `user:manage` - 管理用户

### 角色管理
- `role:view` - 查看角色
- `role:create` - 创建角色
- `role:update` - 更新角色
- `role:delete` - 删除角色
- `role:manage` - 管理角色

### 部门管理
- `department:view` - 查看部门
- `department:create` - 创建部门
- `department:update` - 更新部门
- `department:delete` - 删除部门
- `department:manage` - 管理部门

### 商品管理
- `product:view` - 查看商品
- `product:create` - 创建商品
- `product:update` - 更新商品
- `product:delete` - 删除商品
- `product:manage` - 管理商品

### 财务管理
- `finance:view` - 查看财务
- `finance:create` - 创建财务记录
- `finance:update` - 更新财务记录
- `finance:delete` - 删除财务记录
- `finance:manage` - 管理财务

### 佣金管理
- `commission:view` - 查看佣金
- `commission:create` - 创建佣金记录
- `commission:update` - 更新佣金记录
- `commission:delete` - 删除佣金记录
- `commission:manage` - 管理佣金

### 预算管理
- `budget:view` - 查看预算
- `budget:create` - 创建预算
- `budget:update` - 更新预算
- `budget:delete` - 删除预算
- `budget:manage` - 管理预算

### 系统管理
- `system:view` - 查看系统信息
- `system:manage` - 管理系统

## 安全建议

1. **生产环境密码**：在生产环境中，请使用强密码（至少8位，包含大小写字母、数字和特殊字符）

2. **首次登录**：建议首次登录后立即修改密码

3. **定期更换**：定期更换管理员密码

4. **权限最小化**：根据实际需要分配权限，避免过度授权

5. **日志监控**：监控管理员账户的登录和操作日志

## 故障排除

### 常见错误

1. **数据库连接失败**
   ```
   错误: 数据库连接失败: connect ECONNREFUSED 127.0.0.1:27017
   ```
   **解决方案**: 确保 MongoDB 服务正在运行

2. **账号已存在**
   ```
   错误: 登录账号已存在，请使用不同的账号名
   ```
   **解决方案**: 使用 `--force` 参数覆盖，或选择不同的账号名

3. **参数验证失败**
   ```
   错误: 登录账号必须在3-30个字符之间
   ```
   **解决方案**: 检查输入参数是否符合要求

4. **权限不足**
   ```
   错误: 未捕获的异常: EACCES: permission denied
   ```
   **解决方案**: 确保有足够的文件系统权限

### 调试模式

如果遇到问题，可以设置环境变量启用调试模式：
```bash
DEBUG=* node createAdminUser.js --username "test" --account "test" --password "123456"
```

## 联系支持

如果遇到问题，请检查：
1. Node.js 版本是否符合要求
2. MongoDB 是否正常运行
3. 网络连接是否正常
4. 环境变量是否正确配置

更多技术支持，请联系系统管理员。
