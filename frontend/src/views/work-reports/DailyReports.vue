<template>
  <div class="daily-data-reports">
     <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><List /></el-icon>
        <h2>日数据报表</h2>
      </div>
      <div class="page-description">
        记录各个岗位对商品的推广明细
      </div>
    </div>


    <!-- 搜索和操作区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="日期">
          <el-date-picker
            v-model="searchForm.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
          />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
          />
        </el-form-item>
        <el-form-item label="组别">
          <el-input
            v-model="searchForm.group"
            placeholder="请输入组别"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="产品">
          <el-input
            v-model="searchForm.product"
            placeholder="请输入产品名称"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="创建人">
          <el-select
            v-model="searchForm.createdBy"
            placeholder="选择创建人"
            clearable
            filterable
            remote
            reserve-keyword
            :remote-method="searchUsers"
            :loading="userLoading"
            style="width: 150px"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.value"
              :label="user.label"
              :value="user.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="审批状态">
          <el-select
            v-model="searchForm.approvalStatus"
            placeholder="选择审批状态"
            clearable
            style="width: 120px"
          >
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="searchForm.onlyUnread">只看未读</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
          <el-button @click="handleReset" :icon="Refresh">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮区域 -->
    <el-card class="action-card" shadow="never">
      <div class="action-buttons">
        <el-button
          type="primary"
          @click="handleAdd"
          :icon="Plus"
          v-if="hasAnyPermission(['dailyDataReport:create'])"
        >
          新增报表
        </el-button>
        <el-button
          type="danger"
          @click="handleBatchDelete"
          :icon="Delete"
          :disabled="selectedRows.length === 0"
          v-if="hasAnyPermission(['dailyDataReport:delete'])"
        >
          批量删除
        </el-button>
        <el-button
          type="success"
          @click="handleExport"
          :icon="Download"
          v-if="hasAnyPermission(['dailyDataReport:export'])"
        >
          导出数据
        </el-button>
        <el-button
          @click="handleRefresh"
          :icon="Refresh"
        >
          刷新
        </el-button>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <!-- 选项卡 -->
      <div class="table-header">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="data-tabs">
          <el-tab-pane label="全部" name="all" />
          <el-tab-pane label="我创建的" name="created" />
          <el-tab-pane label="汇报给我的" name="reported" />
          <el-tab-pane label="抄送给我的" name="copied" />
        </el-tabs>
      </div>
      <el-table
        :data="tableData"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
        border
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="date" label="日期" width="120" sortable>
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column prop="group" label="组别" width="100" />
        <el-table-column prop="product" label="投放产品" min-width="150" show-overflow-tooltip />
        <el-table-column prop="promotionCost" label="推广费" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.promotionCost.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalSalesAmount" label="总销售额" width="120" align="right">
          <template #default="{ row }">
            ¥{{ row.totalSalesAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalSalesCount" label="总销售数" width="100" align="right" />
        <el-table-column prop="roi" label="投放ROI" width="100" align="right">
          <template #default="{ row }">
            <span :class="{ 'roi-positive': row.roi > 0, 'roi-negative': row.roi < 0 }">
              {{ row.roi.toFixed(2) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="approvalStatus" label="审批状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getApprovalStatusType(row.approvalStatus)"
              size="small"
            >
              {{ getApprovalStatusText(row.approvalStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已读状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isRead ? 'success' : 'warning'" size="small">
              {{ row.isRead ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reporter.username" label="汇报人" width="100" />
        <el-table-column prop="createdBy.username" label="创建人" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.isRead"
              type="primary"
              size="small"
              @click="handleMarkAsRead(row)"
              link
            >
              标记已读
            </el-button>
            <el-button
              v-if="row.canEdit"
              type="primary"
              size="small"
              @click="handleEdit(row)"
              link
            >
              编辑
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="handleApprove(row)"
              link
            >
              审批
            </el-button>
            <el-button
              v-if="row.canDelete"
              type="danger"
              size="small"
              @click="handleDelete(row)"
              link
            >
              删除
            </el-button>
            <el-button
              type="info"
              size="small"
              @click="handleView(row)"
              link
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 表单对话框 -->
    <DailyReportForm
      :visible="formVisible"
      :data="currentRow"
      @close="handleFormClose"
      @success="handleFormSuccess"
    />

    <!-- 审批对话框 -->
    <el-dialog
      v-model="approvalVisible"
      title="审批日数据报表"
      width="500px"
    >
      <el-form :model="approvalForm" label-width="80px">
        <el-form-item label="审批状态">
          <el-radio-group v-model="approvalForm.status">
            <el-radio value="approved">通过</el-radio>
            <el-radio value="rejected">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input
            v-model="approvalForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入审批意见"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approvalVisible = false">取消</el-button>
        <el-button type="primary" @click="handleApprovalSubmit" :loading="approvalLoading">
          确认审批
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Delete, Download } from '@element-plus/icons-vue'
import { dailyReportApi, employeeApi } from '@/api/index'
import hasAnyPermission from '@/utils/checkPermissions'
import DailyReportForm from './DailyReportForm.vue'
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
const userInfo = userStore.userInfo

// 响应式数据
const loading = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const formVisible = ref(false)
const currentRow = ref({})
const approvalVisible = ref(false)
const approvalLoading = ref(false)
const userOptions = ref([])
const userLoading = ref(false)
const activeTab = ref('created')
const unreadCounts = ref({
  reported: 0,
  copied: 0
})

// 审批表单
const approvalForm = reactive({
  status: 'approved',
  comment: ''
})

// 搜索表单
const searchForm = reactive({
  date: '',
  dateRange: [],
  group: '',
  product: '',
  createdBy: '',
  approvalStatus: '',
  onlyUnread: false
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 获取数据
const fetchData = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      size: pagination.size,
      tab: activeTab.value,
      ...searchForm
    }

    // 处理日期范围
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
      delete params.dateRange
    }

    const response = await dailyReportApi.getDailyDataReports(params)
    if (response && response.success) {
      tableData.value = response.data.reports
      pagination.total = response.data.pagination.total
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

// 格式化日期时间
const formatDateTime = (datetime) => {
  return new Date(datetime).toLocaleString('zh-CN')
}

// 获取审批状态类型
const getApprovalStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取审批状态文本
const getApprovalStatusText = (status) => {
  const textMap = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return textMap[status] || '未知'
}

// 事件处理
const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    date: '',
    dateRange: [],
    group: '',
    product: '',
    createdBy: '',
    approvalStatus: '',
    onlyUnread: false
  })
  pagination.page = 1
  fetchData()
}

const handleRefresh = () => {
  fetchData()
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchData()
}

// 操作方法
const handleAdd = () => {
  currentRow.value = {}
  formVisible.value = true
}

const handleEdit = (row) => {
  currentRow.value = { ...row }
  formVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条报表吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await dailyReportApi.deleteDailyDataReport(row._id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条记录吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const ids = selectedRows.value.map(row => row._id)
    await dailyReportApi.batchDeleteDailyDataReports(ids)
    ElMessage.success('批量删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error(error.response?.data?.message || '批量删除失败')
    }
  }
}

const handleMarkAsRead = async (row) => {
  try {
    await dailyReportApi.markAsRead(row._id)
    ElMessage.success('已标记为已读')
    fetchData()
  } catch (error) {
    console.error('标记已读失败:', error)
    ElMessage.error('标记已读失败')
  }
}

const handleApprove = (row) => {
  currentRow.value = row
  approvalForm.status = 'approved'
  approvalForm.comment = ''
  approvalVisible.value = true
}

const handleView = (row) => {
  // 可以实现查看详情功能，这里暂时显示基本信息
  ElMessageBox.alert(
    `
    <div style="text-align: left;">
      <p><strong>日期:</strong> ${formatDate(row.date)}</p>
      <p><strong>组别:</strong> ${row.group}</p>
      <p><strong>产品:</strong> ${row.product}</p>
      <p><strong>推广费:</strong> ¥${row.promotionCost.toFixed(2)}</p>
      <p><strong>总销售额:</strong> ¥${row.totalSalesAmount.toFixed(2)}</p>
      <p><strong>总销售数:</strong> ${row.totalSalesCount}</p>
      <p><strong>投放ROI:</strong> ${row.roi.toFixed(2)}%</p>
      <p><strong>审批状态:</strong> ${getApprovalStatusText(row.approvalStatus)}</p>
      <p><strong>汇报人:</strong> ${row.reporter?.username || '未知'}</p>
      <p><strong>创建人:</strong> ${row.createdBy?.username || '未知'}</p>
      ${row.remark ? `<p><strong>备注:</strong> ${row.remark}</p>` : ''}
    </div>
    `,
    '报表详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

const handleExport = async () => {
  try {
    ElMessage.info('正在导出数据，请稍候...')

    const params = {
      tab: activeTab.value,
      ...searchForm,
      export: true
    }

    // 处理日期范围
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
      delete params.dateRange
    }

    const response = await dailyReportApi.getDailyDataReports(params)
    if (response && response.success) {
      const data = response.data.reports

      // 准备导出数据
      const exportData = data.map(item => ({
        '日期': formatDate(item.date),
        '组别': item.group,
        '投放产品': item.product,
        '推广费': item.promotionCost,
        '总销售额': item.totalSalesAmount,
        '总销售数': item.totalSalesCount,
        '投放ROI(%)': item.roi.toFixed(2),
        '审批状态': getApprovalStatusText(item.approvalStatus),
        '汇报人': item.reporter?.username || '',
        '创建人': item.createdBy?.username || '',
        '创建时间': formatDateTime(item.createdAt),
        '备注': item.remark || ''
      }))

      // 使用工具函数导出Excel
      const { exportToExcel } = await import('@/utils/excelUtils')
      const fileName = `日数据报表_${new Date().toISOString().split('T')[0]}.xlsx`
      exportToExcel(exportData, fileName)

      ElMessage.success('导出成功')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 表单相关方法
const handleFormClose = () => {
  formVisible.value = false
  currentRow.value = {}
}

const handleFormSuccess = () => {
  fetchData()
}

// 选项卡切换
const handleTabChange = (tab) => {
  activeTab.value = tab
  pagination.page = 1 // 重置到第一页
  fetchData()
}

// 审批相关方法
const handleApprovalSubmit = async () => {
  try {
    approvalLoading.value = true
    await dailyReportApi.approveDailyDataReport(currentRow.value._id, approvalForm)
    ElMessage.success(`审批${approvalForm.status === 'approved' ? '通过' : '拒绝'}成功`)
    approvalVisible.value = false
    fetchData()
  } catch (error) {
    console.error('审批失败:', error)
    ElMessage.error(error.response?.data?.message || '审批失败')
  } finally {
    approvalLoading.value = false
  }
}

// 获取用户列表
const fetchUsers = async () => {
  try {
    userLoading.value = true
    const response = await employeeApi.getUsersForReport({ limit: 1000 })
    if (response && response.success) {
      userOptions.value = response.data.map(user => ({
        label: `${user.username} (${getDepartmentNameFromIds(user.departmentIds) || '未分配部门'})`,
        value: user._id,
        username: user.username,
        department: getDepartmentNameFromIds(user.departmentIds) || '未分配部门'
      }))
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    userLoading.value = false
  }
}

// 搜索用户
const searchUsers = (query) => {
  if (query && query.length >= 2) {
    fetchUsers()
  }
}

// 获取部门名称（从部门ID数组中获取名称）
const getDepartmentNameFromIds = (departmentIds) => {
  if (!departmentIds || !Array.isArray(departmentIds) || departmentIds.length === 0) {
    return '未分配部门'
  }

  // 如果有多个部门，显示第一个部门名称（后续可根据需要调整显示逻辑）
  // 这里暂时返回部门ID，实际使用时应该通过API获取部门名称
  // 或者在用户数据中直接包含部门名称信息
  return departmentIds.length > 0 ? `部门${departmentIds[0]}` : '未分配部门'
}

// 初始化
onMounted(() => {
  fetchData()
  fetchUsers()
})
</script>

<style scoped>
.daily-data-reports {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.title-icon {
  font-size: 24px;
  margin-right: 12px;
  color: #409eff;
}

.search-card,
.action-card {
  margin-bottom: 20px;
}

.table-header {
  margin-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.data-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.data-tabs :deep(.el-tabs__content) {
  display: none;
}

.data-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0 0 16px 0;
}

.data-tabs :deep(.el-tabs__item) {
  font-weight: 500;
  color: #606266;
}

.data-tabs :deep(.el-tabs__item.is-active) {
  color: #409eff;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: right;
}

.roi-positive {
  color: #67c23a;
  font-weight: bold;
}

.roi-negative {
  color: #f56c6c;
  font-weight: bold;
}
</style>
