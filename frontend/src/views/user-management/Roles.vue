<template>
  <div class="roles-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><UserFilled /></el-icon>
        <h2>角色管理</h2>
      </div>
      <div class="page-description">
        管理系统角色和权限配置
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-card business-style">
      <el-form :model="searchForm" :inline="true" class="business-search-form">
        <div class="search-fields">
          <el-form-item label="角色名称" class="search-item">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入角色名称"
              class="business-input"
              clearable
            />
          </el-form-item>
        </div>
        
        <div class="search-actions" style="margin-left: 8px; margin-right: 0;">
          <el-button type="primary" @click="handleSearch" class="business-btn" size="small">查询</el-button>
          <el-button @click="handleReset" class="business-btn" size="small" style="margin-left: 8px;">重置</el-button>
        </div>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="action-card">
      <div class="action-left">
        <el-button type="primary" @click="handleAdd" :icon="Plus" v-if="hasAnyPermission(['role:create','role:manage'])" class="action-btn primary">
          新增角色
        </el-button>
      </div>
      <div class="action-right">
        <span class="total-count">共 {{ pagination.total }} 条数据</span>
        <el-tooltip content="刷新数据" placement="top">
          <el-button @click="getRoleList" :icon="Refresh" circle />
        </el-tooltip>
        <el-tooltip content="列设置" placement="top">
          <el-button :icon="Setting" circle />
        </el-tooltip>
      </div>
    </div>

    <!-- 表格卡片 -->
    <div class="table-card">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        max-height="600"
        border
      >
        <el-table-column label="角色信息" min-width="80">
          <template #default="{ row }">
            <div class="role-info">
              <div class="role-details">
                <div class="role-name">{{ row.roleName || row.name }}</div>
                <div class="role-code">{{ row.code }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="角色描述" show-overflow-tooltip min-width="100" />
        <el-table-column label="权限数量" width="80">
          <template #default="{ row }">
            <el-tag size="small" type="info">
              {{ (row.permissions || []).length }} 个
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建人" width="120">
          <template #default="{ row }">
            <div v-if="row.createdBy">
              <div class="creator-name">{{ row.createdBy.username }}</div>
              <div class="creator-account">{{ row.createdBy.loginAccount }}</div>
            </div>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="120">
          <template #default="{ row }">
            <span class="time-text">{{ formatDate(row.createdAt || row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)" link v-if="hasAnyPermission(['role:update','role:manage'])">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" link v-if="hasAnyPermission(['role:delete','role:manage'])">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="custom-pagination"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="650px"
      :before-close="handleDialogClose"
      append-to-body
      class="role-dialog"
      top="5vh"
    >
      <div class="dialog-content">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          class="role-form"
        >
          <div class="form-section">
            <h4 class="section-title">基本信息</h4>
            <el-form-item label="角色名称" prop="roleName" class="form-item-half">
              <el-input v-model="form.roleName" placeholder="请输入角色名称" />
            </el-form-item>
            <el-form-item label="角色描述">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                placeholder="请输入角色描述（可选）"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </div>

          <div class="form-section">
            <h4 class="section-title">权限配置</h4>
            <el-form-item prop="permissions">
              <RolePermissionsManager v-model="form.permissions" />
            </el-form-item>
          </div>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" size="large">
            取消
          </el-button>
          <el-button
            type="primary"
            @click="handleSubmit"
            :loading="submitLoading"
            size="large"
          >
            {{ form._id ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup >
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox} from 'element-plus'
import {Plus, UserFilled, QuestionFilled, Refresh, Setting} from '@element-plus/icons-vue'
import { roleApi } from '@/api/index'
import RolePermissionsManager from '@/components/RolePermissionsManager.vue'
import hasAnyPermission from '@/utils/checkPermissions'

// 组件状态
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增角色')
const formRef = ref()

// 数据
const tableData = ref([])
const statsData = ref(null)
const permissionLabelMap = ref({})

// 搜索表单
const searchForm = reactive({
  name: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 12,
  total: 0
})

// 表单数据
const form = reactive({
  _id: undefined,
  roleName: '',
  code: '',
  description: '',
  permissions: []
})

// 表单验证规则
const rules = {
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '角色名称长度在2-50个字符', trigger: 'blur' }
  ],
  permissions: [
    { type: 'array', min: 1, message: '请至少选择一个权限', trigger: 'change' }
  ]
}

// 获取权限标签（预留给可能的显示使用）
// const getPermissionLabel = (key) => {
//   return permissionLabelMap.value[key] || key
// }

// 获取角色列表
const getRoleList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.size,
      search: searchForm.name
    }

    const response = await roleApi.getRoles(params)
    if (response.success && response.data) {
      const roles = response.data.data || response.data.list || response.data
      const total = response.data.total || response.data.count || roles.length

      tableData.value = roles
      pagination.total = total
    }
  } catch (error) {
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const getStats = async () => {
  try {
    const response = await roleApi.getRoleStats()
    if (response.success && response.data) {
      statsData.value = response.data
    }
  } catch (error) {
  }
}

// 获取权限标签映射
const getPermissionLabels = async () => {
  try {
    const response = await roleApi.getAvailablePermissions()
    if (response.success && response.data) {
      const labels = {}
      response.data.permissions.forEach(p => {
        labels[p.key] = p.label
      })
      permissionLabelMap.value = labels
    }
  } catch (error) {
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  getRoleList()
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  pagination.page = 1
  getRoleList()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增角色'
  dialogVisible.value = true
  resetForm()
}

// 编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑角色'
  dialogVisible.value = true
  Object.assign(form, {
    _id: row._id,
    roleName: row.roleName || row.name,
    code: row.code,
    description: row.description || '',
    permissions: row.permissions || []
  })
}

// 删除
const handleDelete = async (row) => {
  try {
    const roleName = row.roleName || row.name || '未知角色'
    await ElMessageBox.confirm(
      `确定要删除角色 "${roleName}" 吗？删除后无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      }
    )

    const roleId = row._id || row.id?.toString()
    if (!roleId) {
      ElMessage.error('角色ID无效')
      return
    }

    const response = await roleApi.deleteRole(roleId)
    if (response.success) {
      ElMessage.success('删除成功')
      getRoleList()
      getStats()
    }
  } catch (error) {
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 分页
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  getRoleList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  getRoleList()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    const submitData = {
      roleName: form.roleName,
      description: form.description || '',
      permissions: form.permissions || []
    }

    let response
    if (form._id) {
      response = await roleApi.updateRole(form._id, submitData)
    } else {
      response = await roleApi.createRole(submitData)
    }

    if (response.success) {
      ElMessage.success(form._id ? '更新成功' : '创建成功')
      dialogVisible.value = false
      getRoleList()
      getStats()
    }
  } catch (error) {
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('操作失败')
    }
  } finally {
    submitLoading.value = false
  }
}

// 对话框关闭
const handleDialogClose = (done) => {
  if (submitLoading.value) {
    return
  }
  resetForm()
  done()
}

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    _id: undefined,
    roleName: '',
    code: '',
    description: '',
    permissions: []
  })
  formRef.value?.clearValidate()
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '未知时间'
  const date = new Date(dateStr)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  return date.toLocaleDateString('zh-CN')
}

// 页面加载
onMounted(() => {
  getRoleList()
  getStats()
  getPermissionLabels()
})
</script>

<style scoped>
.roles-container {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
}

/* 页面标题 */
.page-header {
  margin-bottom: 20px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.title-icon {
  color: #409eff;
  font-size: 20px;
}

.page-title h2 {
  margin: 0;
  color: #303133;
  font-weight: 500;
  font-size: 18px;
}

.page-description {
  color: #909399;
  font-size: 13px;
  line-height: 1.4;
}

/* 搜索卡片 */
.search-card {
  background: white;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  margin-bottom: 16px;
  overflow: hidden;
}

.search-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.expand-btn {
  margin-left: auto;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 12px;
}

.expand-btn:hover {
  background-color: #e6f7ff;
  color: #409eff;
}

.search-form {
  padding: 16px;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.search-input, .search-select {
  width: 100%;
}

.search-btn {
  background: #409eff;
  border-color: #409eff;
}

.search-btn:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.reset-btn {
  border: 1px solid #dcdfe6;
  color: #606266;
}

.reset-btn:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

/* 操作卡片 */
.action-card {
  background: white;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-left {
  display: flex;
  gap: 8px;
}

.action-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.total-count {
  color: #606266;
  font-size: 14px;
}

.action-btn {
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #409eff;
  border-color: #409eff;
}

.action-btn.primary:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

/* 表格卡片 */
.table-card {
  background: white;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  overflow: hidden;
}

/* 角色信息 */
.role-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-details {
  flex: 1;
}

.role-name {
  font-weight: 500;
  color: #303133;
  line-height: 1.2;
  font-size: 14px;
}

.role-code {
  font-size: 12px;
  color: #909399;
  margin-top: 1px;
  font-family: 'Courier New', monospace;
}

/* 时间文字 */
.time-text {
  color: #909399;
  font-size: 12px;
}

.creator-name {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
  line-height: 1.2;
}

.creator-account {
  font-size: 11px;
  color: #909399;
  line-height: 1.2;
  margin-top: 2px;
}

.text-gray {
  color: #c0c4cc;
  font-size: 12px;
}

/* 分页器 */
.pagination-wrapper {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  background: #fafbfc;
  border-top: 1px solid #ebeef5;
}

/* 对话框 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  text-align: right;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-table) {
  border: none;
  font-size: 14px;
}

:deep(.el-table__header-wrapper) {
  border-top: none;
}

:deep(.el-table th.el-table__cell) {
  background: #fafafa;
  color: #606266;
  font-weight: 500;
  border-bottom: 1px solid #ebeef5;
  font-size: 13px;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #f5f7fa;
  padding: 8px 12px;
}

:deep(.el-tag) {
  border-radius: 4px;
  font-size: 12px;
}

:deep(.el-button--small) {
  font-size: 12px;
  padding: 4px 8px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  color: #606266;
  font-weight: 500;
  font-size: 14px;
}

:deep(.el-input__wrapper) {
  border-radius: 4px;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 4px;
}

:deep(.el-textarea__inner) {
  border-radius: 4px;
}

/* 对话框样式调整 */
.role-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.dialog-content {
  padding: 0 1rem;
}

.form-section {
  margin-bottom: 1rem;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.6rem 0;
  padding-bottom: 0.3rem;
  border-bottom: 2px solid #f3f4f6;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-item-half {
  width: 100%;
}

.dialog-footer {
  padding: 0.8rem 1rem;
  background: #f9fafb;
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
}

.danger-item {
  color: #dc2626;
}

.ml-1 {
  margin-left: 4px;
}

/* 商务简洁风格 */
.search-card.business-style {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.business-search-form {
  display: flex;
  align-items: flex-end;
  padding: 16px 20px;
  gap: 16px;
}

.search-fields {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.search-item {
  margin-bottom: 0;
  margin-right: 0;
}

.search-item .el-form-item__label {
  color: #606266;
  font-size: 13px;
  font-weight: 500;
  padding-bottom: 4px;
}

.business-input,
.business-select {
  width: 150px;
}

.business-input .el-input__wrapper,
.business-select .el-select__wrapper {
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  box-shadow: none;
}

.business-input .el-input__wrapper:hover,
.business-select .el-select__wrapper:hover {
  border-color: #c0c4cc;
}

.business-input .el-input__wrapper.is-focus,
.business-select .el-select__wrapper.is-focus {
  border-color: #409eff;
}

.search-actions {
  display: flex;
  gap: 4px;
  margin-top: 0;
  align-items: flex-end;
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

/* 响应式布局 */
@media (max-width: 1200px) {
  .business-search-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-fields {
    justify-content: flex-start;
  }
  
  .business-input,
  .business-select {
    width: 180px;
  }
  
  .search-actions {
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .search-fields {
    flex-direction: column;
    align-items: stretch;
  }
  
  .business-input,
  .business-select {
    width: 100%;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .roles-container {
    padding: 12px;
  }

  .search-form .el-row {
    flex-direction: column;
  }

  .action-card {
    flex-direction: column;
    gap: 12px;
  }

  .action-left {
    flex-wrap: wrap;
  }

  .page-title h2 {
    font-size: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .role-dialog {
    width: 95vw !important;
    margin: 0 auto;
  }
}
</style>