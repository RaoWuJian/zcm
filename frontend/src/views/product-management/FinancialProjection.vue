<template>
  <div class="financial-projection">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><List /></el-icon>
        <h2>财务测算</h2>
      </div>
      <div class="page-description">
        产品预算管理，实时计算毛利和佣金
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-card">
      <el-form :model="searchForm" inline>
        <div class="search-left">
          <el-form-item label="产品名称">
            <el-input
              v-model="searchForm.productName"
              placeholder="请输入产品名称"
              clearable
              style="width: 200px;"
            />
          </el-form-item>
          <el-form-item label="店铺名称">
            <el-input
              v-model="searchForm.shopName"
              placeholder="请输入店铺名称"
              clearable
              style="width: 200px;"
            />
          </el-form-item>
          <el-form-item label="毛利范围">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-input-number
                v-model="searchForm.minGrossMargin"
                placeholder="最小毛利"
                :precision="2"
                style="width: 150px;"
              />
              <span>-</span>
              <el-input-number
                v-model="searchForm.maxGrossMargin"
                placeholder="最大毛利"
                :precision="2"
                style="width: 150px;"
              />
            </div>
          </el-form-item>
        </div>
        <div class="search-right">
          <el-button @click="handleSearch" type="primary"  :icon="Search" size="small">查询</el-button>
          <el-button @click="handleReset" size="small" style="margin-left: 8px;">重置</el-button>
        </div>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="action-card">
      <div class="action-left">
        <el-button type="primary" @click="handleAdd" :icon="Plus" class="action-btn primary">
          新增预算
        </el-button>
        <el-button
          type="danger"
          @click="handleBatchDelete"
          :disabled="selectedBudgets.length === 0"
          :icon="Delete"
          class="action-btn danger"
        >
          批量删除
        </el-button>
        <el-button @click="handleExport" :icon="Download" class="action-btn">
          导出数据
          <span v-if="selectedBudgets.length">({{ selectedBudgets.length }}条)</span>
        </el-button>
      </div>
      <div class="action-right">
        <span class="total-count">共 {{ budgetStore.pagination?.totalRecords || 0 }} 条数据</span>
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
                <div class="stats-value">{{ budgetStore.totalGrossMargin.toFixed(2) }}</div>
                <div class="stats-label">总毛利</div>
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
                <div class="stats-value">{{ budgetStore.averageCommission.toFixed(2) }}%</div>
                <div class="stats-label">平均佣金</div>
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
                <div class="stats-value">{{ budgetStore.profitableBudgets.length }}</div>
                <div class="stats-label">盈利产品</div>
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
                <div class="stats-value">{{ budgetStore.lossBudgets.length }}</div>
                <div class="stats-label">亏损产品</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 预算列表 -->
    <el-card class="table-card">
      <el-table
        :data="budgetStore.budgets"
        v-loading="budgetStore.loading"
        @selection-change="handleSelectionChange"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column prop="productName" label="产品名称" min-width="150" show-overflow-tooltip />

        <el-table-column prop="shopName" label="店铺名称" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.shopName || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="sellingPrice" label="售价" width="100" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ row.sellingPrice?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="unitCost" label="成本单价" width="100" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ row.unitCost?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="shippingCost" label="运费" width="100" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ row.shippingCost?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="platformFee" label="平台费用" width="100" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ row.platformFee?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="handlingFee" label="手续费" width="100" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ row.handlingFee?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="grossMargin" label="毛利" width="120" align="right">
          <template #default="{ row }">
            <span :class="['price', row.grossMargin >= 0 ? 'profit' : 'loss']">
              ¥{{ row.grossMargin?.toFixed(2) || '0.00' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="actualCommission" label="实际佣金" width="120" align="right">
          <template #default="{ row }">
            <span :class="['commission', row.actualCommission >= 0 ? 'profit' : 'loss']">
              {{ row.actualCommission?.toFixed(2) || '0.00' }}%
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
          :total="budgetStore.pagination.totalRecords"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingBudget ? '编辑产品预算' : '新增产品预算'"
      width="600px"
      append-to-body
      @close="resetForm"
    >
      <el-form
        ref="budgetFormRef"
        :model="budgetForm"
        :rules="budgetRules"
        label-width="100px"
      >
        <el-form-item label="产品名称" prop="productName">
          <el-input
            v-model="budgetForm.productName"
            placeholder="请输入产品名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="店铺名称" prop="shopName">
          <el-input
            v-model="budgetForm.shopName"
            placeholder="请输入店铺名称（可选）"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="售价" prop="sellingPrice">
              <el-input-number
                v-model="budgetForm.sellingPrice"
                :min="0"
                :precision="2"
                placeholder="0.00"
                style="width: 100%"
                @change="updateCalculation"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成本单价" prop="unitCost">
              <el-input-number
                v-model="budgetForm.unitCost"
                :min="0"
                :precision="2"
                placeholder="0.00"
                style="width: 100%"
                @change="updateCalculation"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="运费" prop="shippingCost">
              <el-input-number
                v-model="budgetForm.shippingCost"
                :min="0"
                :precision="2"
                placeholder="0.00"
                style="width: 100%"
                @change="updateCalculation"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="平台费用" prop="platformFee">
              <el-input-number
                v-model="budgetForm.platformFee"
                :min="0"
                :precision="2"
                placeholder="0.00"
                style="width: 100%"
                @change="updateCalculation"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="手续费" prop="handlingFee">
          <el-input-number
            v-model="budgetForm.handlingFee"
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
               <el-tooltip
                class="box-item"
                effect="dark"
                content="毛利 = 售价 - 成本单价 - 运费 - 平台费用 - 手续费"
                placement="top-start"
              >
                <div class="calc-item">
                  <span class="calc-label">毛利：</span>
                  <span :class="['calc-value', calculationResult.grossMargin >= 0 ? 'profit' : 'loss']">
                    ¥{{ calculationResult.grossMargin }}
                  </span>
                </div>
              </el-tooltip>
              
            </el-col>
            <el-col :span="12">
               <el-tooltip
                class="box-item"
                effect="dark"
                content="实际佣金 = (毛利 ÷ 售价) × 100%"
                placement="top-start"
              >
                <div class="calc-item">
                  <span class="calc-label">实际佣金：</span>
                  <span :class="['calc-value', calculationResult.actualCommission >= 0 ? 'profit' : 'loss']">
                    {{ calculationResult.actualCommission }}%
                  </span>
                </div>
              </el-tooltip>
            </el-col>
          </el-row>
        </el-card>

        <el-form-item label="备注" prop="description">
          <el-input
            v-model="budgetForm.description"
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
            {{ editingBudget ? '更新' : '创建' }}
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
  List,
  Search,
  Refresh,
  Download,
  TrendCharts,
  Coin,
  SuccessFilled,
  WarningFilled
} from '@element-plus/icons-vue'
import { useBudgetStore } from '../../stores/budget'
import { formatUtcToLocalDateTime } from '../../utils/dateUtils'

// Store
const budgetStore = useBudgetStore()

// 响应式数据
const showAddDialog = ref(false)
const editingBudget = ref(null)
const selectedBudgets = ref([])
const submitting = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索表单
const searchForm = reactive({
  productName: '',
  shopName: '',
  minGrossMargin: null,
  maxGrossMargin: null
})

// 预算表单
const budgetForm = reactive({
  productName: '',
  shopName: '',
  sellingPrice: 0,
  unitCost: 0,
  shippingCost: 0,
  platformFee: 0,
  handlingFee: 0,
  description: ''
})

// 表单验证规则
const budgetRules = {
  productName: [
    { required: true, message: '请输入产品名称', trigger: 'blur' },
    { min: 1, max: 100, message: '产品名称长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  sellingPrice: [
    { required: true, message: '请输入售价', trigger: 'blur' },
    { type: 'number', min: 0, message: '售价不能小于0', trigger: 'blur' }
  ]
}

// 表单引用
const budgetFormRef = ref()

// 计算结果
const calculationResult = ref(null)

// 方法
const updateCalculation = () => {
  calculationResult.value = budgetStore.calculateBudget(budgetForm)
}

// 监听表单变化，实时计算
watch(
  () => [
    budgetForm.sellingPrice,
    budgetForm.unitCost,
    budgetForm.shippingCost,
    budgetForm.platformFee
  ],
  () => {
    updateCalculation()
  },
  { immediate: true }
)

const handleSearch = () => {
  currentPage.value = 1
  fetchBudgets()
}

const handleReset = () => {
  Object.assign(searchForm, {
    productName: '',
    shopName: '',
    minGrossMargin: null,
    maxGrossMargin: null
  })
  currentPage.value = 1
  fetchBudgets()
}

const handleRefresh = () => {
  fetchBudgets()
}

const fetchBudgets = () => {
  const params = {
    page: currentPage.value,
    limit: pageSize.value,
    ...searchForm
  }
  budgetStore.fetchBudgets(params)
}

const handleSelectionChange = (selection) => {
  selectedBudgets.value = selection
}

// 新增预算
const handleAdd = () => {
  resetForm()
  showAddDialog.value = true
}

const handleEdit = (budget) => {
  editingBudget.value = budget
  Object.assign(budgetForm, {
    productName: budget.productName,
    shopName: budget.shopName || '',
    sellingPrice: budget.sellingPrice || 0,
    unitCost: budget.unitCost || 0,
    shippingCost: budget.shippingCost || 0,
    platformFee: budget.platformFee || 0,
    handlingFee: budget.handlingFee || 0,
    description: budget.description || ''
  })
  showAddDialog.value = true
}

const handleDelete = async (budget) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除产品预算 "${budget.productName}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await budgetStore.deleteBudget(budget._id)
    if (result.success) {
      ElMessage.success(result.message)
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    // 用户取消删除
  }
}

const handleBatchDelete = async () => {
  if (selectedBudgets.value.length === 0) {
    ElMessage.warning('请选择要删除的预算记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedBudgets.value.length} 条预算记录吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const ids = selectedBudgets.value.map(budget => budget._id)
    const result = await budgetStore.batchDeleteBudgets(ids)
    if (result.success) {
      ElMessage.success(result.message)
      selectedBudgets.value = []
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    // 用户取消删除
  }
}

const handleSubmit = async () => {
  if (!budgetFormRef.value) return

  try {
    await budgetFormRef.value.validate()
    submitting.value = true

    let result
    if (editingBudget.value) {
      result = await budgetStore.updateBudget(editingBudget.value._id, budgetForm)
    } else {
      result = await budgetStore.addBudget(budgetForm)
    }

    if (result.success) {
      ElMessage.success(result.message)
      showAddDialog.value = false
      resetForm()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  editingBudget.value = null
  Object.assign(budgetForm, {
    productName: '',
    shopName: '',
    sellingPrice: 0,
    unitCost: 0,
    shippingCost: 0,
    platformFee: 0,
    handlingFee: 0,
    description: ''
  })
  calculationResult.value = null
  if (budgetFormRef.value) {
    budgetFormRef.value.resetFields()
  }
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchBudgets()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchBudgets()
}

// 导出数据
const handleExport = async () => {
  try {
    // 优先导出勾选的数据，如果没有勾选则导出所有数据
    const exportData = selectedBudgets.value.length > 0 ? selectedBudgets.value : budgetStore.budgets

    if (exportData.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    const data = exportData.map(item => ({
      '产品名称': item.productName || '',
      '售价': item.sellingPrice || 0,
      '成本单价': item.unitCost || 0,
      '产品运费': item.shippingCost || 0,
      '平台费用': item.platformFee || 0,
      '手续费': item.handlingFee || 0,
      '毛利': item.grossMargin || 0,
      '实际佣金(%)': item.actualCommission || 0,
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
    const exportType = selectedBudgets.value.length > 0 ? `勾选${selectedBudgets.value.length}条` : '全部'
    a.download = `产品预算数据_${exportType}_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    const exportTypeMsg = selectedBudgets.value.length > 0 ? `勾选的${selectedBudgets.value.length}条数据` : '全部数据'
    ElMessage.success(`导出${exportTypeMsg}成功`)
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 生命周期
onMounted(() => {
  fetchBudgets()
})
</script>

<style scoped>
.financial-projection {
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

.page-description {
  color: #666;
  font-size: 14px;
}

.search-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 16px;
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

.action-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.action-left {
  display: flex;
  gap: 12px;
}

.action-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.total-count {
  color: #666;
  font-size: 14px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stats-card {
  border-radius: 8px;
  overflow: hidden;
}

.stats-content {
  display: flex;
  align-items: center;
  padding: 10px;
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: #fff;
}

.stats-icon.profit {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stats-icon.commission {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stats-icon.success {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stats-icon.danger {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.stats-info {
  flex: 1;
}

.stats-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: #909399;
}

.table-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

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
}

.commission.profit {
  color: #67c23a;
}

.commission.loss {
  color: #f56c6c;
}

.pagination-wrapper {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
}

.calculation-preview {
  margin: 20px 0;
  background: #f8f9fa;
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .financial-projection {
    padding: 10px;
  }

  .toolbar {
    flex-direction: column;
    gap: 10px;
  }

  .search-box {
    width: 100%;
    justify-content: center;
  }

  .stats-cards .el-col {
    margin-bottom: 10px;
  }
}
</style>