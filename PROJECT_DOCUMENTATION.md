# ZCM 项目文档

## 项目概述

ZCM（Z-Commerce Management）是一个基于 Node.js + Express + MongoDB + Vue.js 的企业级管理系统，主要用于电商运营管理、财务对账、库存管理、用户管理等业务场景。

## 🏗️ 技术栈

### 后端技术栈
- **Runtime**: Node.js
- **框架**: Express.js 5.1.0
- **数据库**: MongoDB (使用 Mongoose 8.18.1)
- **身份验证**: JWT + bcryptjs
- **文件处理**: Multer + Sharp (图片处理)
- **开发工具**: Nodemon, ESLint, Prettier

### 前端技术栈
- **框架**: Vue.js 3.5.18
- **构建工具**: Vite 7.1.2
- **UI组件库**: Element Plus 2.11.2
- **状态管理**: Pinia 3.0.3
- **路由**: Vue Router 4.5.1
- **HTTP客户端**: Axios 1.11.0
- **图表库**: ECharts 6.0.0
- **Excel处理**: XLSX 0.18.5

## 📁 项目结构

```
zcm/
├── backend/                    # 后端应用
│   ├── controllers/            # 控制器层
│   ├── middleware/             # 中间件
│   │   ├── auth.js            # 身份认证中间件
│   │   ├── departmentPermission.js  # 部门权限中间件
│   │   └── error.js           # 错误处理中间件
│   ├── models/                 # 数据模型
│   ├── routes/                 # 路由定义
│   ├── scripts/               # 数据库脚本
│   ├── utils/                 # 工具函数
│   │   └── departmentPermission.js  # 权限管理工具
│   ├── server.js              # 应用入口
│   └── package.json
├── frontend/                  # 前端应用
│   ├── src/
│   │   ├── api/               # API接口
│   │   ├── components/        # 公共组件
│   │   ├── views/             # 页面视图
│   │   │   ├── Dashboard.vue  # 仪表板
│   │   │   ├── finance-reconciliation/  # 财务对账
│   │   │   ├── inventory-management/    # 库存管理
│   │   │   ├── product-management/      # 产品管理
│   │   │   ├── user-management/         # 用户管理
│   │   │   └── work-reports/           # 工作报告
│   │   ├── router/            # 路由配置
│   │   └── stores/            # 状态管理
│   └── package.json
├── git.md                     # Git操作指南
├── GIT_COMPLETE_GUIDE.md      # Git完整指南
└── PROJECT_DOCUMENTATION.md   # 项目文档（当前文件）
```

## 🔧 核心功能模块

### 1. 用户管理模块
- **用户管理**: 员工信息管理、权限分配
- **部门管理**: 多级部门结构、权限继承
- **角色管理**: RBAC权限控制

**主要文件**:
- `backend/models/User.js` - 用户模型
- `backend/models/Department.js` - 部门模型
- `backend/models/Role.js` - 角色模型
- `frontend/src/views/user-management/` - 用户管理视图

### 2. 财务对账模块
- **收支管理**: 收入支出记录管理
- **团队账户**: 多团队财务独立核算
- **审批流程**: 财务记录审批机制
- **记录类型**: 自定义财务记录分类

**主要文件**:
- `backend/models/Finance.js` - 财务记录模型
- `backend/models/TeamAccount.js` - 团队账户模型
- `backend/controllers/financeController.js` - 财务控制器
- `frontend/src/views/finance-reconciliation/` - 财务对账视图

### 3. 库存管理模块
- **库存记录**: 商品库存实时管理
- **发货记录**: 发货信息跟踪
- **库存导入**: 批量库存数据导入

**主要文件**:
- `backend/models/Inventory.js` - 库存模型
- `backend/models/ShipmentRecord.js` - 发货记录模型
- `frontend/src/views/inventory-management/` - 库存管理视图

### 4. 产品管理模块
- **产品信息**: 商品基础信息管理
- **运营产品**: 产品运营数据
- **佣金核算**: 产品佣金计算
- **预算管理**: 产品财务预算

**主要文件**:
- `backend/models/Product.js` - 产品模型
- `backend/models/ProductBudget.js` - 产品预算模型
- `frontend/src/views/product-management/` - 产品管理视图

### 5. 工作报告模块
- **推广计算器**: 电商推广数据计算工具

**主要文件**:
- `frontend/src/views/work-reports/` - 工作报告视图

## 🔐 权限管理系统

### 权限架构
项目采用多级部门权限模型，支持以下特性：

1. **部门层级权限**: 用户可访问自己部门及下属部门的数据
2. **角色权限**: 基于角色的功能权限控制
3. **数据权限**: 基于创建者和部门的数据访问控制

### 核心权限文件
- `backend/utils/departmentPermission.js` - 权限管理核心工具
- `backend/middleware/departmentPermission.js` - 权限中间件
- `backend/middleware/auth.js` - 身份认证中间件

### 权限检查流程
1. JWT token验证
2. 用户部门信息获取
3. 可访问部门列表构建
4. 数据过滤查询应用

## 🗄️ 数据库模型

### 核心模型关系

```
User (用户)
├── departmentIds: [ObjectId] -> Department
├── roleIds: [ObjectId] -> Role
└── createdBy: ObjectId -> User

Department (部门)
├── parentId: ObjectId -> Department
└── path: String (部门路径)

Finance (财务记录)
├── createdBy: ObjectId -> User
├── teamId: ObjectId -> TeamAccount
└── companyAccountId: ObjectId -> TeamAccount

TeamAccount (团队账户)
├── departmentId: ObjectId -> Department
└── createdBy: ObjectId -> User

Inventory (库存)
├── createdBy: ObjectId -> User
└── productId: ObjectId -> Product
```

## 🚀 环境配置与部署

### 环境要求
- Node.js 16+
- MongoDB 4.4+
- Git

### 环境变量配置
```bash
# 数据库配置
MONGO_URI=mongodb://localhost:27017/zcm

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d

# 服务端口
PORT=3000

# CORS配置
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 安装与启动

#### 后端启动
```bash
cd backend
npm install
npm run dev  # 开发模式
npm start    # 生产模式
```

#### 前端启动
```bash
cd frontend
npm install
npm run dev  # 开发模式
npm run build  # 构建生产版本
```

### 初始化数据库
```bash
cd backend
npm run init  # 初始化管理员账户
```

## 📊 API接口文档

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户信息

### 财务管理接口
- `GET /api/finance` - 获取财务记录列表
- `POST /api/finance` - 创建财务记录
- `PUT /api/finance/:id` - 更新财务记录
- `DELETE /api/finance/:id` - 删除财务记录
- `PUT /api/finance/:id/approve` - 审批财务记录

### 用户管理接口
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

### 部门管理接口
- `GET /api/departments` - 获取部门列表
- `POST /api/departments` - 创建部门
- `PUT /api/departments/:id` - 更新部门
- `DELETE /api/departments/:id` - 删除部门

## 🛠️ Git 工作流程

### 分支策略
- `master` - 主分支，稳定版本
- `develop` - 开发分支
- `feature/*` - 功能分支
- `hotfix/*` - 热修复分支

### 提交规范
```bash
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或工具变动
```

### 常用Git命令

#### 日常开发流程
```bash
# 1. 拉取最新代码
git pull origin master

# 2. 创建功能分支
git checkout -b feature/new-feature

# 3. 开发并提交
git add .
git commit -m "feat: 添加新功能"

# 4. 推送分支
git push -u origin feature/new-feature

# 5. 合并到主分支
git checkout master
git merge feature/new-feature
git push origin master

# 6. 删除功能分支
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```

#### 紧急修复流程
```bash
# 1. 从master创建hotfix分支
git checkout master
git checkout -b hotfix/critical-fix

# 2. 修复并测试
git add .
git commit -m "fix: 修复关键问题"

# 3. 合并到master
git checkout master
git merge hotfix/critical-fix
git push origin master

# 4. 合并到develop（如果存在）
git checkout develop
git merge hotfix/critical-fix
git push origin develop

# 5. 删除hotfix分支
git branch -d hotfix/critical-fix
git push origin --delete hotfix/critical-fix
```

#### 版本发布流程
```bash
# 1. 创建release分支
git checkout develop
git checkout -b release/v1.0.0

# 2. 版本测试和修复
git add .
git commit -m "fix: 修复发布前问题"

# 3. 合并到master并打标签
git checkout master
git merge release/v1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin master --tags

# 4. 合并到develop
git checkout develop
git merge release/v1.0.0
git push origin develop

# 5. 删除release分支
git branch -d release/v1.0.0
git push origin --delete release/v1.0.0
```

### Git最佳实践

1. **频繁提交**: 小步快跑，每个功能点都要提交
2. **清晰信息**: 提交信息要清楚描述修改内容
3. **分支管理**: 不同类型工作使用不同分支
4. **代码审查**: 重要修改通过Pull Request流程
5. **定期同步**: 经常从主分支拉取最新代码
6. **备份重要**: 重要操作前先备份或创建分支

### 常用Git别名配置
```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.lg "log --oneline --graph --all"
git config --global alias.unstage "reset HEAD --"
```

## 🔍 故障排除

### 常见问题

1. **权限问题**: 检查用户部门配置和角色权限
2. **数据不显示**: 确认权限过滤逻辑是否正确
3. **登录失败**: 检查JWT密钥和过期时间配置
4. **跨域问题**: 确认CORS配置是否正确

### 调试技巧

1. **后端调试**: 使用console.log查看权限查询条件
2. **前端调试**: 使用Vue DevTools检查状态变化
3. **网络调试**: 使用浏览器Network面板检查API请求
4. **数据库调试**: 使用MongoDB Compass查看数据结构

## 📝 开发规范

### 代码规范
- 使用ESLint和Prettier进行代码格式化
- 遵循JavaScript Standard Style
- Vue组件使用组合式API (Composition API)

### 命名规范
- 文件名: kebab-case
- 组件名: PascalCase
- 变量名: camelCase
- 常量名: UPPER_SNAKE_CASE

### 项目维护
- 定期更新依赖包
- 保持代码注释完整
- 编写单元测试
- 维护API文档

## 🤝 贡献指南

1. Fork项目仓库
2. 创建功能分支
3. 提交代码修改
4. 编写测试用例
5. 提交Pull Request
6. 代码审查通过后合并

- 文档: 参考本文档和`git.md`、`GIT_COMPLETE_GUIDE.md`

---

*文档最后更新: 2025-09-26*