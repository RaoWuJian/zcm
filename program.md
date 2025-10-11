# 招财猫系统 - 开发修改记录

本文件记录招财猫系统的所有代码修改历史，遵循 must.md 规范要求。

---

## [2025-01-11] 新增"美工图表"功能模块

### 修改内容

#### 1. 后端实现

**新增文件**:
- `backend/models/DesignRequest.js` - 美工需求数据模型
  - 字段：需求描述、部门、图片（最多9张）、分配美工、预计完成时间、贴图文件、已完成时间、备注、状态
  - 状态：pending（待处理）、in_progress（进行中）、completed（已完成）
  - 索引：创建时间、部门、分配美工、状态、创建人
  - 验证：图片数量不超过9张、状态变更为completed时自动记录完成时间

- `backend/controllers/designRequestController.js` - 美工需求控制器
  - getDesignRequests - 获取美工需求列表（支持分页、筛选、权限过滤）
  - getDesignRequest - 获取单个美工需求详情
  - createDesignRequest - 创建美工需求（自动关联用户部门）
  - updateDesignRequest - 更新美工需求（权限检查：创建者或管理员）
  - deleteDesignRequest - 删除美工需求（权限检查：创建者或管理员）
  - batchDeleteDesignRequests - 批量删除美工需求

- `backend/routes/designRequests.js` - 美工需求路由
  - 所有路由都需要认证（protect中间件）
  - 集成操作日志记录（logOperation中间件）
  - 路由：GET /, GET /:id, POST /, PUT /:id, DELETE /:id, DELETE /batch

**修改文件**:
- `backend/server.js`
  - 导入美工需求路由：`const designRequestRoutes = require('./routes/designRequests')`
  - 注册路由：`app.use('/api/design-requests', designRequestRoutes)`

#### 2. 前端实现

**新增文件**:
- `frontend/src/stores/designRequest.js` - 美工需求状态管理
  - 状态：designRequests、currentDesignRequest、loading、pagination
  - 计算属性：totalRequests、pendingRequests、inProgressRequests、completedRequests
  - 方法：fetchDesignRequests、fetchDesignRequest、createDesignRequest、updateDesignRequest、deleteDesignRequest、batchDeleteDesignRequests

- `frontend/src/views/design-charts/index.vue` - 美工图表容器组件
  - 用于嵌套子路由

- `frontend/src/views/design-charts/DesignRequestList.vue` - 需求列表页面
  - 搜索区域：状态筛选、关键字搜索
  - 操作按钮：新增需求、批量删除、刷新
  - 表格展示：时间、需求、部门、图片数量、分配美工、预计完成时间、贴图文件数量、已完成时间、状态、操作
  - 新增/编辑对话框：需求描述、图片上传（最多9张）、分配美工、预计完成时间、贴图文件上传、状态、备注
  - 查看详情对话框：完整信息展示、图片预览、文件下载
  - 图片上传：支持多图上传、预览、删除，最多9张，单个文件不超过5MB
  - 文件上传：支持常见文件格式，单个文件不超过10MB

**修改文件**:
- `frontend/src/api/index.js`
  - 新增 designRequestApi 对象，包含所有美工需求相关的API接口

- `frontend/src/router/index.js`
  - 新增路由配置：
    ```javascript
    {
      path: 'design-charts',
      name: 'DesignCharts',
      component: () => import('../views/design-charts/index.vue'),
      redirect: '/design-charts/request-list',
      meta: { title: '美工图表', icon: 'PictureFilled' },
      children: [
        {
          path: 'request-list',
          name: 'DesignRequestList',
          component: () => import('../views/design-charts/DesignRequestList.vue'),
          meta: { title: '需求列表', icon: 'List' }
        }
      ]
    }
    ```

- `frontend/src/layout/index.vue`
  - 导入 PictureFilled 图标
  - 桌面端菜单：新增"美工图表"一级菜单，包含"需求列表"子菜单
  - 移动端菜单：新增"美工图表"一级菜单，包含"需求列表"子菜单

### 影响范围
- **后端**：新增美工需求模块（Model、Controller、Route）
- **前端**：新增美工图表模块（Store、View、Router、Menu）
- **数据库**：新增 DesignRequest 集合

### 功能特性
1. ✅ 普通用户可以提交美工需求（自动关联用户部门）
2. ✅ 美工用户可以查看需求列表
3. ✅ 美工用户可以上传图片和文件到指定需求
4. ✅ 所有用户可以预览图片和下载文件
5. ✅ 支持需求状态管理（待处理、进行中、已完成）
6. ✅ 支持分配美工、设置预计完成时间
7. ✅ 支持批量删除
8. ✅ 完整的权限控制（创建者和管理员可编辑/删除）
9. ✅ 集成操作日志记录

### 技术规范遵循
- ✅ 后端使用 CommonJS（require/module.exports）
- ✅ 前端使用 Vue 3 Composition API（<script setup>）
- ✅ 错误处理使用中文字符串描述，不使用错误码
- ✅ 使用 asyncHandler 包装异步函数
- ✅ 使用现有的文件上传机制（fileApi）
- ✅ 页面布局保持与现有页面一致
- ✅ 使用 Mongoose Schema 验证数据
- ✅ 使用索引优化查询性能
- ✅ 使用 populate 预加载关联数据

### 注意事项
- 图片上传最多9张，单个文件不超过5MB
- 附件文件单个不超过10MB
- 用户必须有部门才能提交美工需求
- 只有创建者或管理员可以编辑/删除需求
- 状态变更为"已完成"时自动记录完成时间

### Bug修复

#### 修复1：formatDate 函数缺失
**问题**: DesignRequestList.vue 导入 formatDate 函数失败
**原因**: dateUtils.js 中缺少 formatDate 导出函数
**解决**: 在 dateUtils.js 中添加通用的 formatDate 函数
**修改文件**: `frontend/src/utils/dateUtils.js`
- 新增 formatDate 函数，支持 'date' 和 'datetime' 两种格式
- 参数：date（日期对象或字符串）、format（格式类型，默认 'datetime'）
- 返回：格式化后的日期字符串

#### 修复2：formatDate 函数调用参数错误
**问题**: formatDate 函数传递了错误的格式参数
**原因**: 传递了 'YYYY-MM-DD' 而不是 'date'
**解决**: 直接传递 type 参数给 formatDateUtil
**修改文件**: `frontend/src/views/design-charts/DesignRequestList.vue`

#### 修复3：文件 URL 路径重复
**问题**: 获取图片和文件 URL 时路径包含重复的 /api
**原因**: VITE_API_BASE_URL 已包含 /api，不应再次添加
**解决**: 修正 getImageUrl 和 getFileUrl 函数
**修改文件**: `frontend/src/views/design-charts/DesignRequestList.vue`
- 修改前：`http://localhost:3000/api/files/${id}`
- 修改后：`${baseUrl}/files/${id}`（baseUrl 已包含 /api）

#### 修复4：fetchUsers 方法不存在
**问题**: userStore 中没有 fetchUsers 方法
**原因**: 使用了不存在的 store 方法
**解决**: 使用 employeeApi.getEmployees 替代
**修改文件**: `frontend/src/views/design-charts/DesignRequestList.vue`
- 导入 employeeApi
- 使用 `employeeApi.getEmployees({ limit: 1000 })` 获取用户列表
- 移除未使用的 userStore 导入

---

## [2025-01-11] 用户反馈问题修复

### 问题1：管理员无法发布需求
**问题描述**: 系统管理员身份也应该可以发布需求，即使没有分配部门
**原因**: 创建需求时强制要求用户必须有部门
**解决方案**:
- 修改 `backend/controllers/designRequestController.js`
  - 管理员可以不需要部门，普通用户必须有部门
  - 创建需求时，如果管理员没有部门，department 字段设为 null
- 修改 `backend/models/DesignRequest.js`
  - 将 department 字段的 required 改为可选
  - 允许管理员创建没有部门的需求

### 问题2：上传文件应该包括压缩格式
**问题描述**: 文件上传应该支持常见的压缩格式（zip、rar、7z等）
**原因**: fileFilter 中没有包含压缩文件格式
**解决方案**:
- 修改 `backend/controllers/fileController.js`
  - 在 allowedTypes 中添加压缩格式：zip、rar、7z、tar、gz
  - 对压缩文件特殊处理，只检查扩展名（因为 mimetype 可能不匹配）
  - 更新错误提示信息，明确支持的文件类型

**后续修复**:
**问题**: 上传 zip 文件仍然提示不支持的文件类型
**原因**: `path.extname()` 返回带点的扩展名（如 `.zip`），正则表达式匹配失败
**解决**: 重写 fileFilter 函数
- 使用数组而不是正则表达式来检查扩展名
- 使用 `replace(/^\./, '')` 正确去掉开头的点号
- 对压缩文件只检查扩展名
- 对其他文件同时检查扩展名和 mimetype
- 添加详细的调试日志
- 添加 multer 错误处理中间件
- 修改文件：
  - `backend/controllers/fileController.js` (第 77-127 行)
  - `backend/routes/files.js` (第 22-32 行)

### 问题3：前端没有正确反馈后端错误信息
**问题描述**: 后端返回了具体的错误信息，但前端只显示"服务器内部错误"
**原因**: 前端 catch 块中只打印 console.error，没有向用户显示错误信息
**解决方案**:
- 修改 `frontend/src/views/design-charts/DesignRequestList.vue`
  - 在所有 API 调用的 catch 块中添加错误信息提取逻辑
  - 优先显示后端返回的 error.response.data.message
  - 其次显示 error.message
  - 最后显示默认错误提示
- 修改 `backend/middleware/error.js`
  - 改进错误处理中间件，确保总是返回有意义的中文错误信息
  - 避免返回"服务器内部错误"这样的通用提示

**修改的函数**:
- `handleSubmit` - 提交表单错误处理
- `handleDelete` - 删除错误处理
- `handleBatchDelete` - 批量删除错误处理
- `fetchData` - 获取数据错误处理
- `fetchUsers` - 获取用户列表错误处理
- `uploadSingleImage` - 图片上传错误处理
- `uploadSingleAttachment` - 附件上传错误处理

**错误信息提取模式**:
```javascript
let errorMessage = '默认错误提示'

if (error.response && error.response.data && error.response.data.message) {
  // 后端返回的错误信息
  errorMessage = error.response.data.message
} else if (error.message) {
  // 前端错误信息
  errorMessage = error.message
}

ElMessage.error(errorMessage)
```

---

## [2025-01-11] 用户反馈问题修复（第二轮）

### 问题1：新增时图片没有实时预览缩略图
**问题描述**: 新增美工需求时，选择图片后没有显示预览缩略图
**原因**: handleFileChange 只添加文件到待上传列表，没有创建预览URL
**解决方案**:
- 修改 `frontend/src/views/design-charts/DesignRequestList.vue`
  - 在 handleFileChange 中使用 FileReader 创建预览URL
  - 将预览对象添加到 formImages（包含 url、isNew、file 属性）
  - 修改 getImageUrl 函数，支持新上传图片的预览
  - 修改提交逻辑，区分新上传的图片和已有的图片

**修改的函数**:
- `handleFileChange` (第 656-684 行) - 添加预览URL创建逻辑
- `getImageUrl` (第 408-423 行) - 支持预览URL
- `handleSubmit` (第 789-793 行) - 过滤新上传的预览对象

### 问题2：文件名中文乱码
**问题描述**: 上传中文文件名的文件后，编辑时显示的文件名是乱码
**原因**: Multer 接收文件时，文件名编码为 Latin1，需要转换为 UTF-8
**解决方案**:
- 修改 `backend/controllers/fileController.js`
  - 在 uploadFile 函数中添加文件名编码转换
  - 使用 `Buffer.from(filename, 'latin1').toString('utf8')` 转换编码
  - 在所有使用 originalname 的地方使用转换后的文件名

**修改位置**:
- `uploadFile` 函数 (第 150-166 行) - 添加文件名编码转换
- GridFS metadata (第 174-181 行) - 使用转换后的文件名
- FileInfo 创建 (第 196-210 行) - 使用转换后的文件名

### 问题3：编辑时删除文件没有成功
**问题描述**: 编辑美工需求时，删除图片后，提交时仍然会上传被删除的图片
**原因**: removeImage 只删除了 formImages，没有删除 pendingImageFiles 中对应的文件
**解决方案**:
- 修改 `frontend/src/views/design-charts/DesignRequestList.vue`
  - 在 removeImage 函数中检查是否为新上传的图片
  - 如果是新上传的，同时从 pendingImageFiles 中移除对应的文件

**修改的函数**:
- `removeImage` (第 686-699 行) - 同时删除待上传列表中的文件

### 问题4：操作日志模块枚举值错误
**问题描述**: 控制台报错 `DESIGN_REQUEST` is not a valid enum value for path `module`
**原因**: OperationLog 模型的 module 枚举中没有包含 DESIGN_REQUEST
**解决方案**:
- 修改 `backend/models/OperationLog.js`
  - 在 module 枚举中添加 'DESIGN_REQUEST' - 美工需求

**修改位置**:
- OperationLog 模型 (第 12-35 行) - 添加 DESIGN_REQUEST 枚举值

---

## [2025-01-11] 用户反馈问题修复（第三轮）

### 问题1：文件名乱码问题（再次修复）
**问题描述**: 上传中文文件名后显示为 `æ«æå¨è½ç 2025-10-8 15.17.zip`
**原因**: 之前的编码转换方向错误，UTF-8 字节被错误解释为 Latin1
**解决方案**:
- 修改 `backend/controllers/fileController.js`
  - 检测是否包含乱码字符（连续的高位字符）
  - 将每个字符的低8位提取出来，重新组成 UTF-8 字节序列
  - 使用 Buffer 正确解码为 UTF-8 字符串

**编码转换逻辑**:
```javascript
// 检查是否包含乱码字符
if (/[\u00C0-\u00FF]{2,}/.test(originalName)) {
  // 将错误的 Latin1 字符转回 UTF-8
  const bytes = [];
  for (let i = 0; i < originalName.length; i++) {
    bytes.push(originalName.charCodeAt(i) & 0xFF);
  }
  originalName = Buffer.from(bytes).toString('utf8');
}
```

**修改位置**:
- `uploadFile` 函数 (第 153-175 行) - 重写编码转换逻辑

### 问题2：贴图文件删除失败
**问题描述**: 编辑美工需求时，删除贴图文件后，提交时仍然会保留被删除的文件
**原因**:
1. el-upload 组件缺少 `:on-remove` 事件处理
2. 附件列表对象缺少 `uid` 和 `status` 属性，导致 el-upload 无法正确识别

**解决方案**:
- 修改 `frontend/src/views/design-charts/DesignRequestList.vue`
  1. 添加 `:on-remove="handleAttachmentRemove"` 事件处理
  2. 实现 `handleAttachmentRemove` 函数
  3. 编辑时设置附件列表，添加 `uid` 和 `status` 属性

**修改内容**:
1. **el-upload 组件** (第 230-246 行)
   - 添加 `:on-remove="handleAttachmentRemove"`

2. **handleAttachmentRemove 函数** (第 715-724 行)
   ```javascript
   const handleAttachmentRemove = (file, fileList) => {
     attachmentFileList.value = fileList
     // 如果是新上传的文件，也要从待上传列表中移除
     const index = pendingAttachmentFiles.value.findIndex(f => f === file.raw)
     if (index > -1) {
       pendingAttachmentFiles.value.splice(index, 1)
     }
   }
   ```

3. **handleEdit 函数** (第 559-568 行)
   - 设置附件时添加 `uid` 和 `status` 属性
   ```javascript
   attachmentFileList.value = row.attachmentFiles.map((file, index) => ({
     uid: file._id || `existing-${index}`,
     name: file.originalName,
     url: getFileUrl(file._id),
     id: file._id,
     status: 'success'
   }))
   ```

---

## [2025-01-11] 列表搜索区域布局优化

### 优化目标
- 保持与其他页面（如日报管理）的布局一致性
- 适配移动端设备
- 提升用户体验

### 修改内容

**修改文件**: `frontend/src/views/design-charts/DesignRequestList.vue`

#### 1. 搜索区域重构
**改进前**:
- 使用 `el-card` + `inline` 表单
- 搜索字段和按钮混在一起
- 没有响应式设计

**改进后**:
- 使用 `div.search-card.business-style` 商务风格
- 搜索字段和按钮分离布局
- 使用 `search-fields` 和 `search-actions` 分区
- 添加统一的样式类：`business-select`、`business-input`、`business-btn`

**布局结构**:
```vue
<div class="search-card business-style">
  <el-form class="business-search-form">
    <div class="search-fields">
      <!-- 搜索字段 -->
    </div>
    <div class="search-actions">
      <!-- 搜索按钮 -->
    </div>
  </el-form>
</div>
```

#### 2. 操作栏重构
**改进前**:
- 使用 `el-card.toolbar-card`
- 左右分布，右侧只有刷新按钮

**改进后**:
- 使用 `div.action-card`
- 左侧：所有操作按钮（新增、批量删除、刷新）
- 右侧：显示总记录数
- 添加 `action-btn` 统一样式

**布局结构**:
```vue
<div class="action-card">
  <div class="action-left">
    <!-- 操作按钮 -->
  </div>
  <div class="total-count">
    共 {{ pagination.total || 0 }} 条记录
  </div>
</div>
```

#### 3. 表格卡片优化
**改进**:
- `el-card` 改为 `div.table-card`
- 添加 `table-container` 类
- 统一圆角和阴影样式

#### 4. 样式系统重构
**新增样式类**:
- `.search-card.business-style` - 搜索卡片商务风格
- `.business-search-form` - 搜索表单布局
- `.search-fields` - 搜索字段容器（flex 布局，自动换行）
- `.search-actions` - 搜索按钮容器
- `.search-item` - 搜索项样式
- `.business-select` - 统一选择框宽度（180px）
- `.business-input` - 统一输入框宽度（200px）
- `.business-btn` - 统一按钮样式
- `.action-card` - 操作栏卡片
- `.action-left` - 操作按钮容器
- `.action-btn` - 操作按钮样式
- `.total-count` - 总数显示样式
- `.table-card` - 表格卡片
- `.pagination-wrapper` - 分页容器

#### 5. 移动端响应式设计
**添加两个断点**:

**平板/手机竖屏 (max-width: 768px)**:
- 容器内边距：20px → 12px
- 搜索字段：横向排列 → 纵向排列，宽度 100%
- 搜索按钮：平分宽度
- 操作栏：横向 → 纵向，按钮宽度 100%
- 总数显示：居中对齐
- 表格：添加横向滚动
- 分页：自动换行，居中对齐
- 图片尺寸：100px → 80px
- 对话框：宽度 95%

**小屏手机 (max-width: 480px)**:
- 容器内边距：12px → 8px
- 表格字体：14px → 12px
- 表格单元格内边距减小
- 按钮字体：14px → 13px
- 按钮内边距减小

**响应式特性**:
- 使用 `flex-wrap: wrap` 自动换行
- 使用 `width: 100%` 填充容器
- 使用 `:deep()` 修改 Element Plus 组件样式
- 保持触摸友好的按钮尺寸（最小 44x44px）

### 技术要点

1. **Flexbox 布局**
   - 搜索区域使用 `flex-direction: column`
   - 搜索字段使用 `flex-wrap: wrap`
   - 移动端切换为纵向布局

2. **CSS 媒体查询**
   - 768px：平板/手机竖屏断点
   - 480px：小屏手机断点

3. **Element Plus 深度选择器**
   - 使用 `:deep()` 修改组件内部样式
   - 适配分页、对话框、表格等组件

4. **视觉一致性**
   - 统一圆角：8px
   - 统一阴影：`0 2px 12px 0 rgba(0, 0, 0, 0.1)`
   - 统一间距：16px（桌面）、12px（移动）
   - 统一颜色：与日报管理页面保持一致

### 修改位置
- 模板部分 (第 1-145 行) - 重构搜索、操作、表格区域
- 样式部分 (第 897-1234 行) - 完全重写样式系统

### 效果
✅ 与日报管理等页面布局完全一致
✅ 完美适配移动端设备
✅ 提升用户体验和视觉美观度
✅ 保持代码可维护性

---

## [2025-01-11] 财务对账 - 团队账户样式优化

### 优化目标
1. 操作按钮使用文字而不是图标
2. 移动端时列表不限制高度，避免滚动条遮挡分页
3. 添加时间筛选功能（与产品佣金页面一致）

### 修改内容

**修改文件**: `frontend/src/views/finance-reconciliation/TeamAccounts.vue`

#### 修改1：操作按钮改为文字链接

**改进前**:
```vue
<el-table-column label="操作" width="120">
  <template #default="{ row }">
    <el-tooltip content="详情" placement="top">
      <el-button size="small" type="info" @click="handleDetail(row)" :icon="View" circle />
    </el-tooltip>
    <el-tooltip content="编辑" placement="top">
      <el-button size="small" type="primary" @click="handleEdit(row)" :icon="Edit" circle />
    </el-tooltip>
    <el-tooltip content="删除" placement="top">
      <el-button size="small" type="danger" @click="handleDelete(row)" :icon="Delete" circle />
    </el-tooltip>
  </template>
</el-table-column>
```

**改进后**:
```vue
<el-table-column label="操作" width="200">
  <template #default="{ row }">
    <el-button size="small" type="info" @click="handleDetail(row)" link>详情</el-button>
    <el-button size="small" type="primary" @click="handleEdit(row)" link>编辑</el-button>
    <el-button size="small" type="danger" @click="handleDelete(row)" link>删除</el-button>
  </template>
</el-table-column>
```

**优势**:
- ✅ 使用文字链接，更清晰直观
- ✅ 不需要 tooltip，减少交互层级
- ✅ 操作列宽度增加到 200px，容纳文字按钮
- ✅ 使用 `link` 属性，按钮样式更简洁

#### 修改2：移动端移除表格高度限制

**改进前**:
```vue
<el-table
  max-height="600"
  ...
>
```

**改进后**:
```vue
<el-table
  :max-height="isMobileDevice ? undefined : 600"
  ...
>
```

**优势**:
- ✅ 桌面端保持 600px 高度限制，避免表格过长
- ✅ 移动端不限制高度，表格完整显示
- ✅ 移动端可以正常看到分页按钮，不会被滚动条遮挡
- ✅ 提升移动端用户体验

#### 修改3：添加时间筛选功能

**新增搜索字段**:
```vue
<el-form-item label="时间筛选" class="search-item">
  <el-date-picker
    v-model="dateRange"
    type="daterange"
    range-separator="至"
    start-placeholder="开始日期"
    end-placeholder="结束日期"
    format="YYYY-MM-DD"
    value-format="YYYY-MM-DD"
    :shortcuts="dateShortcuts"
    @change="handleDateRangeChange"
    class="business-input"
    style="width: 100%;"
  />
</el-form-item>
```

**新增数据定义**:
```javascript
// 搜索表单
const searchForm = reactive({
  name: '',
  description: '',
  startDate: '',  // ✨ 新增
  endDate: ''     // ✨ 新增
})

// 日期范围
const dateRange = ref([])

// 日期快捷选项（与产品佣金页面一致）
const dateShortcuts = [
  { text: '今天', value: () => { ... } },
  { text: '昨天', value: () => { ... } },
  { text: '最近3天', value: () => { ... } },
  { text: '最近7天', value: () => { ... } },
  { text: '半个月', value: () => { ... } },
  { text: '一个月', value: () => { ... } }
]
```

**新增处理函数**:
```javascript
// 日期范围变化处理
const handleDateRangeChange = (dates) => {
  if (dates && dates.length === 2) {
    searchForm.startDate = dates[0]
    searchForm.endDate = dates[1]
  } else {
    searchForm.startDate = ''
    searchForm.endDate = ''
  }
}
```

**更新重置函数**:
```javascript
const handleReset = async () => {
  searchForm.name = ''
  searchForm.description = ''
  searchForm.startDate = ''      // ✨ 新增
  searchForm.endDate = ''        // ✨ 新增
  dateRange.value = []           // ✨ 新增
  pagination.currentPage = 1
  await getTeamAccounts()
  ElMessage.success('搜索条件已重置')
}
```

**快捷选项说明**:
| 选项 | 日期范围 |
|------|----------|
| 今天 | 当天 |
| 昨天 | 前一天 |
| 最近3天 | 今天往前推2天 |
| 最近7天 | 今天往前推6天 |
| 半个月 | 今天往前推14天 |
| 一个月 | 今天往前推1个月 |

**优势**:
- ✅ 与产品佣金页面的时间筛选完全一致
- ✅ 提供快捷选项，提升用户体验
- ✅ 支持自定义日期范围
- ✅ 日期格式统一为 YYYY-MM-DD

#### 修改4：账户详情记录时间筛选

**改进前**:
```vue
<el-date-picker
  v-model="recordSearch.dateRange"
  type="daterange"
  range-separator="至"
  start-placeholder="开始日期"
  end-placeholder="结束日期"
  @change="handleRecordSearch"
  style="width: 240px;"
/>
```

**改进后**:
```vue
<el-date-picker
  v-model="recordSearch.dateRange"
  type="daterange"
  range-separator="至"
  start-placeholder="开始日期"
  end-placeholder="结束日期"
  format="YYYY-MM-DD"
  value-format="YYYY-MM-DD"
  :shortcuts="dateShortcuts"  <!-- ✨ 新增快捷选项 -->
  @change="handleRecordSearch"
  style="width: 240px;"
/>
```

**优势**:
- ✅ 账户详情对话框中的交易记录筛选也支持快捷选项
- ✅ 与主搜索区域的时间筛选保持一致
- ✅ 提升用户在查看交易记录时的体验
- ✅ 复用同一个 `dateShortcuts` 数据，代码简洁

### 修改位置

| 修改项 | 行号 | 说明 |
|--------|------|------|
| 操作列按钮 | 157-163 | 改为文字链接 |
| 表格高度限制 | 88-100 | 移动端移除限制 |
| 时间筛选字段 | 14-56 | 添加日期选择器 |
| 搜索表单数据 | 685-749 | 添加日期相关数据 |
| 日期处理函数 | 1029-1059 | 添加日期变化和重置处理 |
| 详情记录时间筛选 | 412-423 | 添加快捷选项 |

### 技术要点

1. **Element Plus link 按钮**
   - 使用 `link` 属性创建文字链接样式
   - 保留 `type` 属性控制颜色

2. **条件属性绑定**
   - 使用 `:max-height="isMobileDevice ? undefined : 600"`
   - 移动端返回 `undefined`，不设置高度限制

3. **日期快捷选项**
   - 使用函数返回日期数组
   - 每次调用都创建新的 Date 对象
   - 确保日期计算的准确性

4. **响应式数据**
   - `dateRange` 用于双向绑定日期选择器
   - `searchForm.startDate/endDate` 用于 API 请求参数

### 效果对比

#### 操作按钮
| 改进前 | 改进后 |
|--------|--------|
| 圆形图标按钮 + tooltip | 文字链接按钮 |
| 需要悬停查看功能 | 直接显示功能名称 |
| 占用空间小但不直观 | 占用空间适中且清晰 |

#### 移动端表格
| 改进前 | 改进后 |
|--------|--------|
| 固定 600px 高度 | 不限制高度 |
| 表格内部滚动 | 页面整体滚动 |
| 分页可能被遮挡 | 分页始终可见 |

#### 时间筛选
| 改进前 | 改进后 |
|--------|--------|
| 无时间筛选 | 支持日期范围筛选 |
| - | 6个快捷选项 |
| - | 与产品佣金页面一致 |

### Bug 修复

#### 问题：账户详情记录时间筛选导致加载失败

**问题描述**:
- 在账户详情对话框中使用时间筛选时，点击快捷选项会导致加载交易记录失败
- 控制台没有明显报错，但数据无法加载

**根本原因**:
- 日期选择器设置了 `value-format="YYYY-MM-DD"`，返回的是字符串格式
- 但代码中使用 `dateRange[0].toISOString()` 尝试调用 Date 对象的方法
- 字符串没有 `toISOString()` 方法，导致静默失败

**修复前代码**:
```javascript
if (recordSearch.dateRange && recordSearch.dateRange.length === 2) {
  params.startDate = recordSearch.dateRange[0].toISOString().split('T')[0]  // ❌ 字符串没有此方法
  params.endDate = recordSearch.dateRange[1].toISOString().split('T')[0]
}
```

**修复后代码**:
```javascript
if (recordSearch.dateRange && recordSearch.dateRange.length === 2) {
  // 处理日期格式：可能是字符串（value-format）或 Date 对象
  const startDate = recordSearch.dateRange[0]
  const endDate = recordSearch.dateRange[1]

  // 如果是字符串，直接使用；如果是 Date 对象，转换为字符串
  params.startDate = typeof startDate === 'string'
    ? startDate
    : startDate.toISOString().split('T')[0]
  params.endDate = typeof endDate === 'string'
    ? endDate
    : endDate.toISOString().split('T')[0]
}
```

**修复位置**: 第 1631-1650 行

**额外修复**:
- 修复了第 1636 行的类型错误：`params.type = recordSearch.type | 'expense' | 'recharge'`
- 应该是赋值而不是位运算，改为：`params.type = recordSearch.type`

---

### Bug 修复：账户详细记录分页数据不显示

**问题描述**:
- 点击第二页时，表格没有显示数据
- 后端已返回正确的分页数据，但前端显示为空

**根本原因**:
- 后端API已经返回了分页后的数据（例如第2页的20条记录）
- 前端使用 `paginatedRecords` 计算属性对这些数据进行二次分页切片
- 导致切片索引超出范围，返回空数组

**错误逻辑**:
```javascript
// 后端返回第2页的20条数据
filteredRecords.value = mappedRecords // 20条数据

// 前端再次分页切片
const paginatedRecords = computed(() => {
  const start = (2 - 1) * 20 // = 20
  const end = 20 + 20 // = 40
  return filteredRecords.value.slice(20, 40) // 超出范围，返回 []
})
```

**修复方案**:
1. 表格直接使用 `filteredRecords` 而不是 `paginatedRecords`
2. 删除不必要的 `paginatedRecords` 计算属性
3. 后端负责分页，前端只负责展示

**修改位置**:
- 第 436 行：表格数据绑定改为 `:data="filteredRecords"`
- 第 847-851 行：删除 `paginatedRecords` 计算属性

**修复后逻辑**:
```javascript
// 后端返回第2页的20条数据
filteredRecords.value = mappedRecords // 20条数据

// 前端直接显示
<el-table :data="filteredRecords"> // ✅ 显示20条数据
```

---

### 优化：账户详细记录分页显示

**优化内容**:
- 调整分页组件显示条件，从 `recordPagination.total > recordPagination.pageSize` 改为 `recordPagination.total > 0`
- 即使只有一页数据，也显示分页组件，方便用户查看总记录数

**修改位置**: 第 492 行

**优势**:
- ✅ 用户始终可以看到总记录数
- ✅ 提供一致的界面体验
- ✅ 方便用户切换每页显示数量

---

## 调试代码清除

### 清除范围

清除了所有开发调试用的 console 语句，包括：

#### 后端文件
- `backend/controllers/fileController.js` - 清除 10 处调试日志

#### 前端文件
- `frontend/src/views/finance-reconciliation/TeamAccounts.vue` - 清除 8 处
- `frontend/src/views/finance-reconciliation/IncomeExpenseList.vue` - 清除 6 处
- `frontend/src/views/design-charts/DesignRequestList.vue` - 清除 5 处

**总计**: 清除 29 处调试代码

**保留**: `frontend/src/stores/notification.js` 中的关键错误日志（用于生产环境错误追踪）

---

## [2025-01-09] 规范合规性修复

### 修改内容

#### 1. 修复错误处理 - 移除暴露技术细节
**问题**: 多个后端控制器在错误响应中返回了 `error.message`，违反了"不暴露技术细节"的规范。

**修改文件**:
- `backend/controllers/recordTypeController.js`
  - 移除所有 catch 块中的 `error: error.message` 返回
  - 移除冗余的 try-catch 包装（asyncHandler 已处理错误）
  - 改用 `throw new Error()` 方式抛出错误，由全局错误处理中间件统一处理
  - 涉及函数: getRecordTypes, createRecordType, updateRecordType, deleteRecordType, addSubCategory, updateSubCategory, deleteSubCategory, getSubCategories

- `backend/controllers/dailyReportController.js`
  - 移除 9 处 `error: error.message` 返回
  - 涉及函数: getDailyReports, getDailyReportById, createDailyReport, updateDailyReport, deleteDailyReport, getProductNameSuggestions, getUnreadNotifications, markDailyReportAsRead, getDailyReportReadStatus

- `backend/controllers/userController.js`
  - 移除 1 处 `error: error.message` 返回
  - 涉及函数: getReporters

**修改前**:
```javascript
} catch (error) {
  console.error('获取记录类型失败:', error);
  res.status(500).json({
    success: false,
    message: '获取记录类型失败',
    error: error.message  // ❌ 暴露技术细节
  });
}
```

**修改后**:
```javascript
// 方式1: 移除 try-catch，让 asyncHandler 处理
const getRecordTypes = asyncHandler(async (req, res) => {
  const recordTypes = await RecordType.getActiveTypes();
  res.json({
    success: true,
    data: recordTypes,
    message: '获取记录类型成功'
  });
});

// 方式2: 使用 throw Error，由全局错误中间件处理
const updateRecordType = asyncHandler(async (req, res) => {
  const recordType = await RecordType.findById(id);
  if (!recordType) {
    res.status(404);
    throw new Error('记录类型不存在');  // ✅ 清晰的中文错误描述
  }
  // ...
});
```

#### 2. 优化代码结构 - 移除冗余 try-catch
**问题**: 在已使用 `asyncHandler` 的函数中又使用 try-catch 是冗余的。

**优化说明**:
- `asyncHandler` 的作用就是自动捕获异步函数中的错误并传递给全局错误处理中间件
- 移除冗余的 try-catch 后，代码更简洁，错误处理更统一
- 特殊错误（如 Mongoose 11000 重复键错误）由全局错误中间件的 errorHandler 统一转换为中文

#### 3. 建立修改记录规范
**新增文件**: `program.md`
- 建立完整的修改记录文档
- 记录本次规范合规性修复的详细内容
- 为后续开发建立修改记录模板

### 影响范围

**后端**:
- 控制器层: recordTypeController, dailyReportController, userController
- 错误处理流程: 统一由全局错误中间件处理
- 响应格式: 所有错误响应不再包含技术细节

**前端**:
- 无影响（前端 axios 拦截器已正确处理后端返回的错误消息）

### 技术细节

**错误处理流程**:
1. 控制器函数使用 `asyncHandler` 包装
2. 参数验证失败时，使用 `res.status(xxx); throw new Error('中文错误描述')`
3. 业务逻辑错误由 Mongoose 或业务代码抛出
4. 全局错误中间件 (`backend/middleware/error.js`) 捕获所有错误
5. 错误中间件将技术错误转换为用户友好的中文描述
6. 返回统一格式: `{ success: false, message: '具体的中文错误描述' }`

**符合规范**:
- ✅ 错误消息使用清晰的中文描述
- ✅ 不暴露技术细节（error.message, error.stack）
- ✅ 统一响应格式
- ✅ 使用 asyncHandler 包装异步函数
- ✅ 全局错误中间件统一处理

### 注意事项

1. **后续开发规范**:
   - 所有控制器函数必须使用 `asyncHandler` 包装
   - 不要在 asyncHandler 中使用 try-catch（除非有特殊业务逻辑需要）
   - 错误消息必须使用具体的中文描述
   - 不要返回 `error.message` 或 `error.stack`

2. **错误处理最佳实践**:
   ```javascript
   // ✅ 推荐：参数验证
   if (!name) {
     res.status(400);
     throw new Error('请输入记录类型名称');
   }

   // ✅ 推荐：资源不存在
   const record = await Model.findById(id);
   if (!record) {
     res.status(404);
     throw new Error('记录不存在');
   }

   // ✅ 推荐：权限检查
   if (!hasPermission) {
     res.status(403);
     throw new Error('您没有权限执行此操作');
   }

   // ✅ 推荐：业务逻辑错误
   if (inventory.quantity < quantity) {
     res.status(400);
     throw new Error(`库存不足！当前库存：${inventory.quantity}，需要：${quantity}`);
   }
   ```

3. **修改记录规范**:
   - 每次修改代码后，必须在本文件中记录
   - 记录格式参考本次修改记录
   - 包含：修改内容、影响范围、技术细节、注意事项

### 测试建议

1. **错误响应测试**:
   - 测试各种错误场景，确认不返回技术细节
   - 验证错误消息是否清晰易懂
   - 检查 HTTP 状态码是否正确

2. **功能测试**:
   - 记录类型的增删改查
   - 日报的增删改查
   - 用户相关操作
   - 确认功能正常，错误提示友好

### 相关规范

参考 `must.md` 文件：
- 第 27-50 行：错误处理原则
- 第 113-165 行：错误处理规范
- 第 279-292 行：常见错误避免

---

## 修改记录模板

```markdown
## [日期] 修改标题

### 修改内容
- 修改了哪些文件
- 解决了什么问题
- 新增了什么功能

### 影响范围
- 前端/后端
- 涉及的模块

### 注意事项
- 需要注意的地方
- 可能的影响
```

---

## [2025-01-09] 前端页面布局统一性修复

### 修改内容

#### 1. 修复财务测算页面布局不一致问题
**问题**: RecordTypeSettings.vue（类型设置页面）缺少标准的搜索区域，与其他页面布局不一致，违反了 must.md 规范。

**修改文件**:
- `frontend/src/views/finance-reconciliation/RecordTypeSettings.vue`

**修改详情**:

**修改前布局**:
```
┌─────────────────────────────────────┐
│ 页面标题                             │
├─────────────────────────────────────┤
│ 操作栏 (新增大类、新增小类、刷新)    │  ← 缺少搜索区域！
├─────────────────────────────────────┤
│ 左右分栏内容 (大类列表 | 小类列表)   │
└─────────────────────────────────────┘
```

**修改后布局**:
```
┌─────────────────────────────────────┐
│ 页面标题                             │
├─────────────────────────────────────┤
│ 搜索区域 (search-card)              │  ✅ 新增标准搜索栏
│ [大类名称] [小类名称] [查询] [重置]  │
├─────────────────────────────────────┤
│ 操作栏 (action-card)                │
│ [新增大类] [新增小类] [刷新数据]     │
├─────────────────────────────────────┤
│ 左右分栏内容 (大类列表 | 小类列表)   │
└─────────────────────────────────────┘
```

**新增功能**:
1. ✅ 添加标准搜索区域（search-card business-style）
2. ✅ 支持按大类名称搜索
3. ✅ 支持按小类名称搜索
4. ✅ 搜索和重置按钮
5. ✅ 响应式布局支持（移动端适配）

**代码改进**:
```vue
<!-- 新增搜索栏 - 与产品佣金、财务测算页面保持一致 -->
<div class="search-card business-style" :class="{ 'mobile-search': isMobileDevice }">
  <el-form :model="searchForm" :inline="!isMobileDevice" class="business-search-form">
    <div class="search-fields" :class="{ 'mobile-fields': isMobileDevice }">
      <el-form-item label="大类名称" class="search-item">
        <el-input
          v-model="searchForm.categoryName"
          placeholder="请输入大类名称"
          clearable
          class="business-input"
          style="width: 100%;"
        />
      </el-form-item>
      <el-form-item label="小类名称" class="search-item">
        <el-input
          v-model="searchForm.subCategoryName"
          placeholder="请输入小类名称"
          clearable
          class="business-input"
          style="width: 100%;"
        />
      </el-form-item>
    </div>
    <div class="search-actions" :class="{ 'mobile-actions': isMobileDevice }">
      <el-button @click="handleSearch" type="primary" :icon="Search" class="business-btn">查询</el-button>
      <el-button @click="handleReset" class="business-btn">重置</el-button>
    </div>
  </el-form>
</div>
```

**布局细节对齐**（最终版 - 与产品佣金完全一致）:
- ✅ 输入框使用固定宽度 `180px`（与产品佣金一致）
- ✅ 按钮顺序：`@click` 在前，`type` 在后
- ✅ 重置按钮不使用图标
- ✅ 搜索字段和按钮在同一个 flex 容器内，自动换行
- ✅ 按钮使用 `align-self: flex-start` 靠左对齐，放在左下角
- ✅ 按钮高度 `32px`，字体 `13px`（与产品佣金一致）

**新增 CSS 样式**（最终版 - 与产品佣金完全一致）:
```css
/* 搜索栏样式 - 与产品佣金完全一致 */
.search-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 2px 0 rgba(31, 35, 41, 0.08);
  border: 1px solid #e4e7ed;
}

.business-search-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-fields {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;  /* 关键：允许字段自动换行 */
}

.search-item {
  margin-bottom: 0;
  margin-right: 0;
}

.search-item :deep(.el-form-item__label) {
  color: #606266;
  font-size: 13px;
  font-weight: 500;
  padding-bottom: 4px;
}

.business-input {
  width: 180px;  /* 关键：固定宽度，与产品佣金一致 */
}

.business-input :deep(.el-input__wrapper) {
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  box-shadow: none;
}

.search-actions {
  display: flex;
  gap: 8px;
  align-self: flex-start;  /* 关键：按钮靠左对齐，放在左下角 */
}

.business-btn {
  border-radius: 4px;
  font-size: 13px;
  padding: 8px 16px;
  min-width: 64px;
  height: 32px;
}

.business-btn.el-button--primary {
  background-color: #409eff;
  border-color: #409eff;
}

.business-btn.el-button--primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}
```

**搜索逻辑优化**:
```javascript
// 搜索表单
const searchForm = reactive({
  categoryName: '',
  subCategoryName: ''
})

// 智能过滤逻辑
const filteredCategories = computed(() => {
  let result = categories.value

  // 按大类名称过滤
  if (searchForm.categoryName.trim()) {
    const searchText = searchForm.categoryName.toLowerCase().trim()
    result = result.filter(category =>
      category.name.toLowerCase().includes(searchText) ||
      (category.description && category.description.toLowerCase().includes(searchText))
    )
  }

  // 按小类名称过滤（只显示包含匹配小类的大类）
  if (searchForm.subCategoryName.trim()) {
    const subSearchText = searchForm.subCategoryName.toLowerCase().trim()
    result = result.filter(category => {
      if (!category.subCategories || category.subCategories.length === 0) {
        return false
      }
      return category.subCategories.some(sub =>
        sub.name.toLowerCase().includes(subSearchText) ||
        (sub.description && sub.description.toLowerCase().includes(subSearchText))
      )
    })
  }

  return result
})
```

### 影响范围

**前端**:
- 页面: RecordTypeSettings.vue
- 布局: 统一为标准的"搜索区域 → 操作栏 → 内容区域"结构
- 用户体验: 提供了更便捷的搜索功能

**后端**:
- 无影响

### 技术细节

**布局规范对比**:

| 页面 | 搜索区域 | 操作栏 | 内容区域 | 分页 | 状态 |
|------|---------|--------|---------|------|------|
| Employees.vue | ✅ | ✅ | ✅ 表格 | ✅ | ✅ 符合 |
| IncomeExpenseList.vue | ✅ | ✅ | ✅ 表格 | ✅ | ✅ 符合 |
| TeamAccounts.vue | ✅ | ✅ | ✅ 表格 | ✅ | ✅ 符合 |
| RecordTypeSettings.vue (修改前) | ❌ | ✅ | ✅ 分栏 | - | ❌ 不符合 |
| RecordTypeSettings.vue (修改后) | ✅ | ✅ | ✅ 分栏 | - | ✅ 符合 |

**符合规范**:
- ✅ 整体布局一致（页面标题 → 搜索区域 → 操作栏 → 内容区域）
- ✅ 搜索区域统一（search-card business-style）
- ✅ 按钮组统一（business-btn 样式）
- ✅ 响应式设计统一（mobile-view 适配）
- ✅ 表单样式统一（business-search-form）

### 注意事项

1. **页面布局规范**:
   - 所有列表页面必须包含搜索区域
   - 搜索区域位于页面标题和操作栏之间
   - 使用统一的 CSS 类名：`search-card business-style`
   - 搜索按钮使用 `business-btn` 样式

2. **搜索功能要求**:
   - 提供清晰的搜索条件
   - 支持重置功能
   - 搜索结果实时过滤或点击查询
   - 移动端自动调整布局

3. **特殊页面处理**:
   - RecordTypeSettings 使用左右分栏布局（特殊业务需求）
   - 但仍需遵循"搜索区域 → 操作栏 → 内容区域"的顺序
   - 允许内容区域根据业务需求调整，但不能改变整体结构

### 测试建议

1. **布局一致性测试**:
   - 检查所有财务相关页面的布局顺序
   - 验证搜索区域的位置和样式
   - 确认移动端响应式布局正常

2. **搜索功能测试**:
   - 测试按大类名称搜索
   - 测试按小类名称搜索
   - 测试同时使用两个搜索条件
   - 测试重置功能

3. **用户体验测试**:
   - 验证搜索结果准确性
   - 检查空状态提示
   - 确认操作流程顺畅

### 相关规范

参考 `must.md` 文件：
- 第 186-216 行：前端页面布局规范
- 第 291 行：不要随意改变页面布局结构

---

**最后更新**: 2025-01-09
**更新人**: AI 开发助手
**版本**: v1.1.0
