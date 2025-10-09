<template>
  <div class="employees-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><UserFilled /></el-icon>
        <h2>员工管理</h2>
      </div>
      <div class="page-description">
        管理系统中的所有员工信息
      </div>
    </div>

    <!-- 搜索栏 - 商务简洁风格 -->
    <div class="search-card business-style" :class="{ 'mobile-search': isMobileDevice }">
      <el-form :model="searchForm" :inline="!isMobileDevice" class="business-search-form">
        <div class="search-fields" :class="{ 'mobile-fields': isMobileDevice }">
          <el-form-item label="姓名/账号" class="search-item">
            <el-input
              v-model="searchForm.search"
              placeholder="请输入姓名或账号"
              clearable
              prefix-icon="Search"
              class="business-input"
            />
          </el-form-item>

          <el-form-item label="登录账号" class="search-item">
            <el-input
              v-model="searchForm.loginAccount"
              placeholder="请输入登录账号"
              clearable
              prefix-icon="User"
              class="business-input"
            />
          </el-form-item>

          <el-form-item label="角色" class="search-item">
            <el-select
              v-model="searchForm.role"
              placeholder="全部角色"
              clearable
              class="business-select"
              @focus="getRoleOptions"
            >
              <el-option
                v-for="role in roleOptions"
                :key="role._id"
                :label="role.roleName"
                :value="role._id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="部门" class="search-item">
            <el-select
              v-model="searchForm.departmentId"
              placeholder="全部部门"
              clearable
              class="business-select"
            >
              <el-option
                v-for="dept in departmentOptions"
                :key="dept._id || 'empty'"
                :label="dept.departmentName"
                :value="dept._id"
              />
            </el-select>
          </el-form-item>
        </div>

        <div class="search-actions" :class="{ 'mobile-actions': isMobileDevice }">
          <el-button type="primary" @click="handleSearch" :icon="Search" class="business-btn">
            查询
          </el-button>
          <el-button @click="handleReset" :icon="Refresh" class="business-btn">
            重置
          </el-button>
        </div>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="action-card">
      <div class="action-left">
        <el-button type="primary" v-if="hasAnyPermission(['user:create'])" @click="handleAdd" :icon="Plus" class="action-btn primary">
          新增员工
        </el-button>
        <el-button
          type="danger"
          @click="handleBatchDelete"
          :disabled="!selectedRows.length"
          :icon="Delete"
          class="action-btn danger"
          v-if="hasAnyPermission(['user:delete'])"
        >
          批量删除
          <span v-if="selectedRows.length">({{ selectedRows.length }})</span>
        </el-button>
        <el-button @click="handleExport" :icon="Download" class="action-btn">
          导出数据
          <span v-if="selectedRows.length">({{ selectedRows.length }}条)</span>
        </el-button>
      </div>
    </div>

    <!-- 表格卡片 -->
    <div class="table-card">
      <el-table
        :data="tableData"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
        max-height="600"
        border
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="用户信息" min-width="180">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="28" class="user-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="user-details">
                <div class="user-name">{{ row.username }}</div>
                <div class="user-account">{{ row.loginAccount }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isAdmin ? 'warning' : 'info'" size="small">
              {{ getRoleDisplayName(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="部门" width="150">
          <template #default="{ row }">
            <div v-if="row.departmentIds && row.departmentIds.length" class="dept-tags">
              <el-tag
                v-for="dept in row.departmentIds.slice(0, 2)"
                :key="dept._id || dept"
                size="small"
                type="info"
                class="dept-tag"
              >
                {{ getDepartmentDisplayName(dept) }}
              </el-tag>
              <el-tag
                v-if="row.departmentIds.length > 2"
                size="small"
                type="info"
                class="dept-tag"
              >
                +{{ row.departmentIds.length - 2 }}
              </el-tag>
            </div>
            <span v-else class="text-gray">未分配</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
              {{ row.isActive ? '活跃' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip min-width="120" />
        <el-table-column label="创建时间" width="120">
          <template #default="{ row }">
            <span class="time-text">{{ new Date(row.createdAt).toLocaleDateString() }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)" link v-if="hasAnyPermission(['user:update'])">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" link v-if="hasAnyPermission(['user:delete','user:manage'])">
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
          :layout="isMobileDevice ? 'total, sizes, prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
          :small="isMobileDevice"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="custom-pagination"
          :class="{ 'mobile-pagination': isMobileDevice }"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      :width="isMobileDevice ? '95%' : '600px'"
      :fullscreen="isMobileDevice"
      append-to-body
      @close="handleDialogClose"
      class="employee-dialog"
    >
      <ResponsiveForm
        ref="formRef"
        :model="form"
        :rules="rules"
      >
        <el-row :gutter="16">
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item label="姓名" prop="username">
              <el-input v-model="form.username" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item label="账号" prop="loginAccount">
              <el-input v-model="form.loginAccount" placeholder="请输入登录账号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item label="密码" prop="loginPassword">
              <el-input
                v-model="form.loginPassword"
                :placeholder="form._id ? '不修改请保持默认值' : '请输入密码'"
                show-password
              />
              <div v-if="form._id" style="font-size: 12px; color: #909399; margin-top: 4px;">
                <el-icon style="vertical-align: middle;"><Lock /></el-icon>
                密码已加密，如需修改请输入新密码，否则保持默认值即可
              </div>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item label="角色" prop="rolePermission">
              <el-select v-model="form.rolePermission" placeholder="请选择角色" style="width: 100%" @focus="getRoleOptions">
                <el-option
                  v-for="role in roleOptions"
                  :key="role._id"
                  :label="role.roleName"
                  :value="role._id"
                >
                  <div style="display: flex; flex-direction: column;">
                    <span>{{ role.roleName }}</span>
                    <span v-if="role.description" style="font-size: 12px; color: #999;">{{ role.description }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="部门" prop="departmentIds">
          <el-select
            v-model="form.departmentIds"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择部门"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="dept in departmentOptions"
              :key="dept._id || 'empty'"
              :label="dept.departmentName"
              :value="dept._id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </ResponsiveForm>

      <template #footer>
        <div class="dialog-footer" :class="{ 'mobile-footer': isMobileDevice }">
          <el-button @click="dialogVisible = false" :class="{ 'mobile-btn': isMobileDevice }">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading" :class="{ 'mobile-btn': isMobileDevice }">
            {{ form._id ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup >
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Delete, UserFilled, User, Download, Lock } from '@element-plus/icons-vue'
import { employeeApi, departmentApi, roleApi } from '@/api/index'
import hasAnyPermission from '@/utils/checkPermissions'
import { useResponsive } from '@/utils/responsive'
import ResponsiveForm from '@/components/ResponsiveForm.vue'

// 响应式检测
const { isMobileDevice } = useResponsive()

// 搜索表单
const searchForm = reactive({
  search: '',
  loginAccount: '',
  role: '',
  departmentId: ''
})

// 表格数据
const tableData = ref([])
const loading = ref(false)
const selectedRows = ref([])

// 部门选项列表（在页面加载时获取）
const departmentOptions = ref([])

// 角色选项列表
const roleOptions = ref([])

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 对话框
// 组件状态
const tableLoading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增员工')
const formRef = ref()

// 表单数据
const form = reactive({
  _id: undefined,
  username: '',
  loginAccount: '',
  loginPassword: '123456',
  rolePermission: '',
  departmentIds: [],
  remark: ''
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入员工姓名', trigger: 'blur' },
    { min: 2, message: '员工姓名至少2个字符', trigger: 'blur' },
    { max: 50, message: '员工姓名最多50个字符', trigger: 'blur' },
    { pattern: /^[\u4e00-\u9fa5a-zA-Z\s]+$/, message: '员工姓名只能包含中文、英文和空格', trigger: 'blur' }
  ],
  loginAccount: [
    { required: true, message: '请输入登录账号', trigger: 'blur' },
    { min: 3, message: '登录账号至少3个字符', trigger: 'blur' },
    { max: 30, message: '登录账号最多30个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '登录账号只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  loginPassword: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { min: 6, message: '登录密码至少6个字符', trigger: 'blur' },
    { max: 50, message: '登录密码最多50个字符', trigger: 'blur' }
  ],
  rolePermission: [
    { required: true, message: '请选择员工角色', trigger: 'change' }
  ],
  departmentIds: [
    { required: true, message: '请选择所属部门', trigger: 'change' }
  ],
  remark: [
    { max: 200, message: '备注最多200个字符', trigger: 'blur' }
  ]
}

// 获取员工列表
const getEmployeeList = async () => {
  tableLoading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.size,
      search: searchForm.search,
      loginAccount: searchForm.loginAccount,
      role: searchForm.role,
      departmentId: searchForm.departmentId
    }

    // 移除空值参数
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })

    const response = await employeeApi.getEmployees(params)
    if (response.success && response.data) {
      const userData = response.data
      tableData.value = (userData.data || userData || [])
      pagination.total = (response).pagination?.totalUsers || (response).count || 0

    }
  } catch (error) {
    ElMessage.error('获取员工列表失败')
  } finally {
    tableLoading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  getEmployeeList()
}

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    search: '',
    loginAccount: '',
    role: '',
    departmentId: ''
  })
  pagination.page = 1
  getEmployeeList()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增员工'
  dialogVisible.value = true
  resetForm()
}

// 编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑员工'
  dialogVisible.value = true

  // 填充表单数据
  Object.assign(form, {
    _id: row._id,
    username: row.username,
    loginAccount: row.loginAccount,
    loginPassword: '******', // 编辑时显示加密密码占位符
    rolePermission: row.rolePermission?._id || row.rolePermission || '',
    departmentIds: Array.isArray(row.departmentIds) ? row.departmentIds.map(d => d._id || d) : [],
    remark: row.remark || ''
  })
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除员工 "${row.username}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await employeeApi.deleteEmployee(row._id)
    if (response.success) {
      ElMessage.success('删除成功')
      getEmployeeList()
    }
  } catch (error) {
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请选择要删除的员工')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个员工吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 批量删除需要逐个删除
    for (const row of selectedRows.value) {
      await employeeApi.deleteEmployee(row._id)
    }
    ElMessage.success('删除成功')
    getEmployeeList()
    selectedRows.value = []
  } catch (error) {
  }
}

// 选择改变
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  getEmployeeList()
}

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.page = page
  getEmployeeList()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    let response
    if (form._id) {
      // 编辑 - 只发送需要更新的字段
      const updateData = {
        username: form.username,
        loginAccount: form.loginAccount,
        ...(form.loginPassword && form.loginPassword !== '******' ? { loginPassword: form.loginPassword } : {}),
        departmentIds: form.departmentIds || [],
        remark: form.remark || undefined
      }

      // 处理rolePermission字段
      if (form.rolePermission) {
        (updateData).rolePermission = form.rolePermission
      }

      response = await employeeApi.updateEmployee(form._id, updateData)
    } else {
      // 新增
      response = await employeeApi.createEmployee(form)
    }
    
    if (response.success) {
      ElMessage.success(form._id ? '更新成功' : '创建成功')
      dialogVisible.value = false
      getEmployeeList()
    } else {
      // 显示后端返回的具体错误信息
      ElMessage.error(response.message || (form._id ? '更新失败' : '创建失败'))
    }
  } catch (error) {
    // 处理表单验证错误
    if (error.fields) {
      // 表单验证失败，显示第一个验证错误
      const firstError = Object.values(error.fields)[0][0]
      ElMessage.error(firstError.message)
    } else {
      // 处理后端API错误
      let errorMessage = form._id ? '更新员工失败' : '创建员工失败'

      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage
      } else if (error.message) {
        errorMessage = error.message
      }

      ElMessage.error(errorMessage)
    }
  } finally {
    submitLoading.value = false
  }
}

// 对话框关闭
const handleDialogClose = () => {
  resetForm()
}

// 导出数据
const handleExport = async () => {
  try {
    // 优先导出勾选的数据，如果没有勾选则导出所有数据
    const exportData = selectedRows.value.length > 0 ? selectedRows.value : tableData.value

    if (exportData.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    const data = exportData.map(item => ({
      '姓名': item.username,
      '登录账号': item.loginAccount,
      '角色': item.rolePermission?.roleName || '普通用户',
      '部门': item.departmentIds && item.departmentIds.length ? item.departmentIds.map(d => getDepartmentDisplayName(d)).join(', ') : '未分配',
      '状态': item.isActive ? '活跃' : '禁用',
      '备注': item.remark || '',
      '创建时间': new Date(item.createdAt).toLocaleString()
    }))
    
    // 转换为CSV格式
    const csv = [Object.keys(data[0]).join(',')]
    data.forEach(row => {
      csv.push(Object.values(row).join(','))
    })
    
    // 下载文件
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const exportType = selectedRows.value.length > 0 ? `勾选${selectedRows.value.length}条` : '全部'
    a.download = `员工数据_${exportType}_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)

    const exportTypeMsg = selectedRows.value.length > 0 ? `勾选的${selectedRows.value.length}条数据` : '全部数据'
    ElMessage.success(`导出${exportTypeMsg}成功`)
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 获取角色显示名称
const getRoleDisplayName = (row) => {
  if (row.rolePermission && typeof row.rolePermission === 'object') {
    return row.rolePermission.roleName || '普通用户'
  }

  // 如果 rolePermission 是 ID，从角色列表中查找
  if (row.rolePermission && typeof row.rolePermission === 'string') {
    const role = roleOptions.value.find(r => r._id === row.rolePermission)
    return role?.roleName || '普通用户'
  }

  return '普通用户'
}

// 获取部门显示名称
const getDepartmentDisplayName = (dept) => {
  if (!dept) return ''

  if (typeof dept === 'object' && dept.departmentName) {
    return dept.departmentName
  }

  if (typeof dept === 'string') {
    const deptObj = departmentOptions.value.find(d => d._id === dept)
    return deptObj?.departmentName || '未知部门'
  }

  return '未知部门'
}

// 获取角色选项列表
const getRoleOptions = async () => {
  try {
    if (roleOptions.value.length > 0) {
      return // 如果已经加载过，就不重复加载
    }
    const response = await roleApi.getRoles({ limit: 100 }) // 获取所有角色
    if (response.success && response.data) {
      // 根据API响应结构处理数据
      if (Array.isArray(response.data)) {
        roleOptions.value = response.data
      } else if (response.data.list && Array.isArray(response.data.list)) {
        roleOptions.value = response.data.list
      } else {
        roleOptions.value = []
      }
    }
  } catch (error) {
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    _id: undefined,
    username: '',
    loginAccount: '',
    loginPassword: '123456',
    rolePermission: '',
    departmentIds: [],
    remark: ''
  })
  formRef.value?.clearValidate()
}

// 获取部门列表用于选择器
const getDepartmentOptions = async () => {
  try {
    const response = await departmentApi.getDepartmentTree({ isActive: true }) 
    
    if (response.success && response.data && Array.isArray(response.data)) {
      // 扁平化部门数据
      const flattenDepartments = (depts)=> {
        let result = []
        depts.forEach(dept => {
          result.push(dept)
          if (dept.children && dept.children.length > 0) {
            result.push(...flattenDepartments(dept.children))
          }
        })
        return result
      }
      
      const flatDepartments = flattenDepartments(response.data)
      departmentOptions.value = flatDepartments
    }
  } catch (error) {
  }
}

// 页面加载时获取数据
onMounted(() => {
  getDepartmentOptions()
  getRoleOptions()
  getEmployeeList()
})
</script>

<style scoped>
.employees-container {
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

/* 角色和部门选项 */
.role-option, .dept-option, .option-content {
  display: flex;
  align-items: center;
  gap: 6px;
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

.action-btn.danger {
  background: #f56c6c;
  border-color: #f56c6c;
}

.action-btn.danger:hover {
  background: #f78989;
  border-color: #f78989;
}

/* 表格卡片 */
.table-card {
  background: white;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  overflow: hidden;
}

.beautiful-table {
  border: none;
}

/* 用户信息 */
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  background: #409eff;
  font-size: 12px;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 500;
  color: #303133;
  line-height: 1.2;
  font-size: 14px;
}

.user-account {
  font-size: 12px;
  color: #909399;
  margin-top: 1px;
}

/* 部门标签 */
.dept-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.dept-tag {
  margin: 0;
  font-size: 12px;
  border-radius: 3px;
}

/* 时间文字 */
.time-text {
  color: #909399;
  font-size: 12px;
}

/* 灰色文字 */
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

/* 移动端适配 (< 768px) */
@media (max-width: 767px) {
  .employees-container {
    padding: 0;
  }

  .page-header {
    padding: 12px;
    margin-bottom: 12px;
  }

  .page-title {
    font-size: 18px;
  }

  .page-title h2 {
    font-size: 18px;
  }

  .page-description {
    font-size: 13px;
  }

  /* 搜索栏移动端优化 */
  .search-card.mobile-search {
    margin-bottom: 12px;
    border-radius: 0;
  }

  .business-search-form {
    padding: 12px;
    flex-direction: column;
    gap: 12px;
  }

  .search-fields.mobile-fields {
    flex-direction: column;
    width: 100%;
    gap: 12px;
  }

  .search-item {
    width: 100%;
  }

  .search-item .el-form-item__label {
    width: 100%;
    text-align: left;
  }

  .business-input,
  .business-select {
    width: 100%;
  }

  .search-actions.mobile-actions {
    width: 100%;
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .search-actions.mobile-actions .business-btn {
    flex: 1;
    height: 44px;
    font-size: 14px;
  }

  /* 操作栏移动端优化 */
  .action-card {
    padding: 12px;
    margin-bottom: 12px;
    flex-direction: column;
    gap: 12px;
  }

  .action-left {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }

  .action-left .action-btn {
    width: 100%;
    height: 44px;
    justify-content: center;
  }

  .action-right {
    width: 100%;
    justify-content: space-between;
  }

  .total-count {
    font-size: 13px;
  }

  /* 表格卡片移动端优化 */
  .table-card {
    padding: 8px;
    border-radius: 0;
    overflow-x: auto;
  }

  .table-card :deep(.el-table) {
    font-size: 13px;
  }

  .table-card :deep(.el-table th) {
    font-size: 13px;
    padding: 8px 0;
  }

  .table-card :deep(.el-table td) {
    padding: 8px 0;
  }

  /* 分页移动端优化 */
  .pagination-wrapper {
    padding: 12px 0;
    overflow-x: auto;
  }

  .mobile-pagination {
    justify-content: center !important;
    flex-wrap: wrap !important;
    gap: 8px !important;
  }

  .mobile-pagination :deep(.el-pagination__total) {
    order: 1;
    flex: 0 0 100%;
    text-align: center;
    margin: 0 0 8px 0 !important;
    font-size: 13px;
  }

  .mobile-pagination :deep(.el-pagination__sizes) {
    order: 2;
    margin: 0 !important;
  }

  .mobile-pagination :deep(.el-select) {
    width: auto !important;
  }

  .mobile-pagination :deep(.el-select .el-input__wrapper) {
    min-height: 32px !important;
    padding: 4px 8px !important;
  }

  .mobile-pagination :deep(.el-select .el-input__inner) {
    font-size: 13px !important;
  }

  .mobile-pagination :deep(.btn-prev),
  .mobile-pagination :deep(.btn-next),
  .mobile-pagination :deep(.el-pager li) {
    min-width: 32px !important;
    height: 32px !important;
    line-height: 32px !important;
    font-size: 13px !important;
  }

  /* 对话框移动端优化 */
  .employee-dialog :deep(.el-dialog__header) {
    padding: 12px;
  }

  .employee-dialog :deep(.el-dialog__body) {
    padding: 12px;
  }

  .employee-dialog :deep(.el-dialog__footer) {
    padding: 12px;
  }

  .dialog-footer.mobile-footer {
    display: flex;
    gap: 12px;
  }

  .dialog-footer.mobile-footer .mobile-btn {
    flex: 1;
    height: 44px;
    font-size: 15px;
  }

  /* 用户信息卡片 */
  .user-info {
    gap: 8px;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
  }

  .user-name {
    font-size: 14px;
  }

  .user-account {
    font-size: 12px;
  }

  /* 部门标签 */
  .dept-tags {
    flex-wrap: wrap;
    gap: 4px;
  }

  .dept-tag {
    font-size: 11px;
  }
}

/* 超小屏幕适配 (< 480px) */
@media (max-width: 480px) {
  .page-title h2 {
    font-size: 16px;
  }

  .action-right .el-button {
    padding: 8px;
  }

  .stats-row .el-col {
    margin-bottom: 8px;
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
  
  .search-card,
  .action-card,
  .table-card {
    border-radius: 4px;
  }
  
  .action-left,
  .action-right {
    justify-content: center;
  }
  
  .pagination-wrapper {
    justify-content: center;
  }
}
</style>