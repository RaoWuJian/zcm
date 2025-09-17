<template>
  <div class="commission-accounting">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>产品佣金</h2>
      <p class="page-description">核算佣金管理，实时计算佣金利润和净利润</p>
    </div>

    <!-- 搜索栏 -->
    <div class="search-card">
      <el-form :model="searchForm" inline>
        <div class="search-left">
          <el-form-item label="名称">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入名称"
              clearable
              style="width: 200px;"
            />
          </el-form-item>
          <el-form-item label="净利润范围">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-input-number
                v-model="searchForm.minProfit"
                placeholder="最小净利润"
                :precision="2"
                style="width: 150px;"
              />
              <span>-</span>
              <el-input-number
                v-model="searchForm.maxProfit"
                placeholder="最大净利润"
                :precision="2"
                style="width: 150px;"
              />
            </div>
          </el-form-item>
        </div>
        <div class="search-right">
          <el-button @click="handleSearch" :icon="Search" class="business-btn" size="small">查询</el-button>
          <el-button @click="handleReset" class="business-btn" size="small" style="margin-left: 8px;">重置</el-button>
        </div>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="action-card">
      <div class="action-left">
        <el-button type="primary" @click="showAddDialog = true" :icon="Plus" class="action-btn primary">
          新增核算
        </el-button>
        <el-button
          type="danger"
          @click="handleBatchDelete"
          :disabled="selectedAccountings.length === 0"
          :icon="Delete"
          class="action-btn danger"
        >
          批量删除
        </el-button>
        <el-button @click="handleExport" :icon="Download" class="action-btn">
          导出数据
        </el-button>
      </div>
      <div class="action-right">
        <span class="total-count">共 {{ commissionStore.pagination?.totalRecords || 0 }} 条数据</span>
        <el-tooltip content="刷新数据" placement="top">
          <el-button @click="handleRefresh" :icon="Refresh" circle />
        </el-tooltip>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon profit">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-value">{{ commissionStore.totalCommissionProfit.toFixed(2) }}</div>
                <div class="stats-label">总佣金利润</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon commission">
                <el-icon><Coin /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-value">{{ commissionStore.totalNetProfit.toFixed(2) }}</div>
                <div class="stats-label">总净利润</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon success">
                <el-icon><SuccessFilled /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-value">{{ commissionStore.profitableAccountings.length }}</div>
                <div class="stats-label">盈利记录</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon danger">
                <el-icon><WarningFilled /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-value">{{ commissionStore.lossAccountings.length }}</div>
                <div class="stats-label">亏损记录</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 核算佣金列表 -->
    <el-card class="table-card">
      <el-table
        :data="commissionStore.commissionAccountings"
        v-loading="commissionStore.loading"
        @selection-change="handleSelectionChange"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="name" label="名称" min-width="150" show-overflow-tooltip />
        
        <el-table-column prop="netTransactionData" label="净成交数据" width="120" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ row.netTransactionData?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="commission" label="佣金(%)" width="100" align="right">
          <template #default="{ row }">
            <span class="commission">{{ row.commission?.toFixed(2) || '0.00' }}%</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="commissionProfit" label="佣金利润" width="120" align="right">
          <template #default="{ row }">
            <span :class="['price', row.commissionProfit >= 0 ? 'profit' : 'loss']">
              ¥{{ row.commissionProfit?.toFixed(2) || '0.00' }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="dailyConsumption" label="今日消耗" width="120" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ row.dailyConsumption?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="netProfit" label="净利润" width="120" align="right">
          <template #default="{ row }">
            <span :class="['price', row.netProfit >= 0 ? 'profit' : 'loss']">
              ¥{{ row.netProfit?.toFixed(2) || '0.00' }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="createdBy" label="创建者" width="120">
          <template #default="{ row }">
            {{ row.createdBy?.username || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatUtcToLocalDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)" link>编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" link>删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="commissionStore.pagination.totalRecords"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingAccounting ? '编辑核算佣金' : '新增核算佣金'"
      width="600px"
      append-to-body
      @close="resetForm"
    >
      <el-form
        ref="accountingFormRef"
        :model="accountingForm"
        :rules="accountingRules"
        label-width="120px"
      >
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="accountingForm.name"
            placeholder="请输入名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="净成交数据" prop="netTransactionData">
              <el-input-number
                v-model="accountingForm.netTransactionData"
                :min="0"
                :precision="2"
                placeholder="0.00"
                style="width: 100%"
                @change="updateCalculation"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="佣金(%)" prop="commission">
              <el-input-number
                v-model="accountingForm.commission"
                :min="0"
                :max="100"
                :precision="2"
                placeholder="0.00"
                style="width: 100%"
                @change="updateCalculation"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="今日消耗" prop="dailyConsumption">
          <el-input-number
            v-model="accountingForm.dailyConsumption"
            :min="0"
            :precision="2"
            placeholder="0.00"
            style="width: 100%"
            @change="updateCalculation"
          />
        </el-form-item>

        <!-- 实时计算结果 -->
        <el-card class="calculation-preview" v-if="calculationResult">
          <template #header>
            <span>实时计算结果</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="calc-item">
                <span class="calc-label">佣金利润：</span>
                <span :class="['calc-value', calculationResult.commissionProfit >= 0 ? 'profit' : 'loss']">
                  ¥{{ calculationResult.commissionProfit }}
                </span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="calc-item">
                <span class="calc-label">净利润：</span>
                <span :class="['calc-value', calculationResult.netProfit >= 0 ? 'profit' : 'loss']">
                  ¥{{ calculationResult.netProfit }}
                </span>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <el-form-item label="备注" prop="description">
          <el-input
            v-model="accountingForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ editingAccounting ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Delete,
  Search,
  Refresh,
  Download,
  TrendCharts,
  Coin,
  SuccessFilled,
  WarningFilled
} from '@element-plus/icons-vue'
import { useCommissionAccountingStore } from '@/stores/commissionAccounting'
import { formatUtcToLocalDateTime } from '@/utils/dateUtils'

// Store
const commissionStore = useCommissionAccountingStore()

// 响应式数据
const showAddDialog = ref(false)
const editingAccounting = ref(null)
const submitting = ref(false)
const selectedAccountings = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索表单
const searchForm = reactive({
  name: '',
  minProfit: null,
  maxProfit: null
})

// 核算佣金表单
const accountingForm = reactive({
  name: '',
  netTransactionData: 0,
  commission: 0,
  dailyConsumption: 0,
  description: ''
})

// 表单引用
const accountingFormRef = ref()

// 表单验证规则
const accountingRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 1, max: 100, message: '名称长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  netTransactionData: [
    { required: true, message: '请输入净成交数据', trigger: 'blur' },
    { type: 'number', min: 0, message: '净成交数据不能小于0', trigger: 'blur' }
  ],
  commission: [
    { required: true, message: '请输入佣金', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '佣金范围在 0 到 100 之间', trigger: 'blur' }
  ],
  dailyConsumption: [
    { type: 'number', min: 0, message: '今日消耗不能小于0', trigger: 'blur' }
  ]
}

// 计算结果
const calculationResult = ref(null)

// 实时计算
const updateCalculation = () => {
  calculationResult.value = commissionStore.calculateCommissionAccounting(accountingForm)
}

// 监听表单变化，实时计算
watch(
  () => [accountingForm.netTransactionData, accountingForm.commission, accountingForm.dailyConsumption],
  () => {
    updateCalculation()
  },
  { immediate: true }
)

// 获取核算佣金列表
const fetchAccountings = async () => {
  const params = {
    page: currentPage.value,
    limit: pageSize.value,
    ...searchForm
  }

  // 过滤空值
  Object.keys(params).forEach(key => {
    if (params[key] === '' || params[key] === null || params[key] === undefined) {
      delete params[key]
    }
  })

  await commissionStore.fetchCommissionAccountings(params)
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchAccountings()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    minProfit: null,
    maxProfit: null
  })
  currentPage.value = 1
  fetchAccountings()
}

// 刷新
const handleRefresh = () => {
  fetchAccountings()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedAccountings.value = selection
}

// 编辑
const handleEdit = (accounting) => {
  editingAccounting.value = accounting
  Object.assign(accountingForm, {
    name: accounting.name,
    netTransactionData: accounting.netTransactionData,
    commission: accounting.commission,
    dailyConsumption: accounting.dailyConsumption,
    description: accounting.description || ''
  })
  updateCalculation()
  showAddDialog.value = true
}

// 删除
const handleDelete = async (accounting) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除核算佣金 "${accounting.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await commissionStore.deleteCommissionAccounting(accounting._id)
    if (result.success) {
      ElMessage.success(result.message)
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    // 用户取消删除
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedAccountings.value.length === 0) {
    ElMessage.warning('请选择要删除的记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedAccountings.value.length} 条核算佣金记录吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const ids = selectedAccountings.value.map(accounting => accounting._id)
    const result = await commissionStore.batchDeleteCommissionAccountings(ids)

    if (result.success) {
      ElMessage.success(result.message)
      selectedAccountings.value = []
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    // 用户取消删除
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await accountingFormRef.value.validate()

    submitting.value = true
    let result

    if (editingAccounting.value) {
      // 更新
      result = await commissionStore.updateCommissionAccounting(editingAccounting.value._id, accountingForm)
    } else {
      // 新增
      result = await commissionStore.addCommissionAccounting(accountingForm)
    }

    if (result.success) {
      ElMessage.success(result.message)
      showAddDialog.value = false
      resetForm()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  editingAccounting.value = null
  Object.assign(accountingForm, {
    name: '',
    netTransactionData: 0,
    commission: 0,
    dailyConsumption: 0,
    description: ''
  })
  calculationResult.value = null

  if (accountingFormRef.value) {
    accountingFormRef.value.resetFields()
  }
}

// 分页
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchAccountings()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchAccountings()
}

// 导出数据
const handleExport = async () => {
  try {
    if (commissionStore.commissionAccountings.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    const data = commissionStore.commissionAccountings.map(item => ({
      '名称': item.name || '',
      '净成交数据': item.netTransactionData || 0,
      '佣金(%)': item.commission || 0,
      '佣金利润': item.commissionProfit || 0,
      '今日消耗': item.dailyConsumption || 0,
      '净利润': item.netProfit || 0,
      '备注': item.description || '',
      '创建者': item.createdBy?.username || '',
      '创建时间': item.createdAt ? formatUtcToLocalDateTime(item.createdAt) : '',
      '更新者': item.updatedBy?.username || '',
      '更新时间': item.updatedAt ? formatUtcToLocalDateTime(item.updatedAt) : ''
    }))

    // 构建CSV内容
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header]
          // 如果值包含逗号、引号或换行符，需要用引号包围并转义引号
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    // 添加BOM以支持Excel正确显示中文
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `核算佣金数据_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 生命周期
onMounted(() => {
  fetchAccountings()
})
</script>

<style scoped>
.commission-accounting {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 60px);
}

/* 页面标题 */
.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

/* 搜索卡片 */
.search-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 16px;
}

.search-card .el-form {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.search-left {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.search-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.business-btn {
  background: #f7f8fa;
  border-color: #d9d9d9;
  color: #666;
}

.business-btn:hover {
  background: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
}

/* 操作栏 */
.action-card {
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-left {
  display: flex;
  gap: 12px;
}

.action-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.total-count {
  color: #909399;
  font-size: 14px;
}

/* 按钮样式 */
.action-btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-weight: 500;
}

.action-btn.primary {
  background: linear-gradient(135deg, #409eff 0%, #66b3ff 100%);
  border: none;
  color: white;
}

.action-btn.danger {
  background: linear-gradient(135deg, #f56c6c 0%, #ff8a8a 100%);
  border: none;
  color: white;
}

/* 统计卡片 */
.stats-cards {
  margin-bottom: 20px;
}

.stats-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
}

.stats-content {
  display: flex;
  align-items: center;
  padding: 8px;
}

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
}

.stats-icon.profit {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
}

.stats-icon.commission {
  background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%);
  color: white;
}

.stats-icon.success {
  background: linear-gradient(135deg, #409eff 0%, #66b3ff 100%);
  color: white;
}

.stats-icon.danger {
  background: linear-gradient(135deg, #f56c6c 0%, #ff8a8a 100%);
  color: white;
}

.stats-info {
  flex: 1;
}

.stats-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: #909399;
}

/* 表格卡片 */
.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 表格样式 */
.price {
  font-weight: 600;
}

.price.profit {
  color: #67c23a;
}

.price.loss {
  color: #f56c6c;
}

.commission {
  font-weight: 600;
  color: #e6a23c;
}

.commission.profit {
  color: #67c23a;
}

.commission.loss {
  color: #f56c6c;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 计算预览卡片 */
.calculation-preview {
  margin: 16px 0;
  border: 1px solid #e4e7ed;
}

.calc-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.calc-label {
  font-weight: 500;
  color: #606266;
}

.calc-value {
  font-weight: 600;
  font-size: 16px;
}

.calc-value.profit {
  color: #67c23a;
}

.calc-value.loss {
  color: #f56c6c;
}

/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .commission-accounting {
    padding: 10px;
  }

  .search-card .el-form {
    flex-direction: column;
    align-items: stretch;
  }

  .search-left {
    margin-bottom: 16px;
  }

  .action-card {
    flex-direction: column;
    gap: 16px;
  }

  .action-left {
    justify-content: center;
  }

  .stats-cards .el-col {
    margin-bottom: 16px;
  }
}
</style>
