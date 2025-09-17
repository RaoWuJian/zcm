<template>
  <div class="team-accounts">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><Wallet /></el-icon>
        <h2>团队账户</h2>
      </div>
      <div class="page-description">
        管理团队财务账户信息和交易操作
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="action-card">
      <div class="action-left">
        <el-button type="primary" @click="handleAdd" :icon="Plus" class="action-btn primary" v-if="hasAnyPermission(['finance:team_manage'])">
          新增账户
        </el-button>
        <el-button type="success" @click="handleRecharge" :icon="Money" class="action-btn success" v-if="hasAnyPermission(['finance:team_manage'])">
          账户充值
        </el-button>
        <el-button @click="handleRefresh" :icon="Refresh" class="action-btn">
          刷新数据
        </el-button>
      </div>
      <div class="action-center">
        <el-radio-group v-model="viewMode" size="small" class="view-mode-switch">
          <el-radio-button label="card">
            <el-icon><Grid /></el-icon>
            卡片视图
          </el-radio-button>
          <el-radio-button label="table">
            <el-icon><List /></el-icon>
            表格视图
          </el-radio-button>
        </el-radio-group>
      </div>
      <div class="action-right">
        <span class="total-count">共 {{ accounts.length }} 个账户</span>
        <!-- <el-tooltip content="账户设置" placement="top">
          <el-button :icon="Setting" circle />
        </el-tooltip> -->
      </div>
    </div>

    <!-- 账户卡片列表 -->
    <div class="accounts-container" v-if="viewMode === 'card'">
      <div class="account-cards" v-loading="loading">
        <div class="account-card" v-for="account in paginatedAccounts" :key="account._id">
          <div class="card-header">
            <div class="account-info">
              <div class="account-name">
                <el-icon class="account-icon"><CreditCard /></el-icon>
                <h3>{{ account.name }}</h3>
              </div>
              <el-tag 
                :type="getDepartmentColor(account)" 
                size="small" 
                class="account-type-tag"
              >
                {{ getDepartmentDisplayName(account) }}
              </el-tag>
            </div>
            <div class="account-actions">
              <el-dropdown @command="handleAccountAction" trigger="click">
                <el-button type="text" :icon="MoreFilled" class="more-btn" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{action: 'edit', data: account}" v-if="hasAnyPermission(['finance:team_manage'])">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item :command="{action: 'recharge', data: account}" v-if="hasAnyPermission(['finance:team_manage'])">
                      <el-icon><Money /></el-icon>
                      充值
                    </el-dropdown-item>
                    <el-dropdown-item :command="{action: 'detail', data: account}">
                      <el-icon><View /></el-icon>
                      详情
                    </el-dropdown-item>
                    <!-- <el-dropdown-item :command="{action: 'transfer', data: account}" v-if="hasAnyPermission(['finance:team_manage'])">
                      <el-icon><Sort /></el-icon>
                      转账
                    </el-dropdown-item> -->
                    <el-dropdown-item :command="{action: 'delete', data: account}" divided v-if="hasAnyPermission(['finance:team_manage'])">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          
          <div class="card-content">
            <div class="balance-section">
              <div class="balance-main">
                <span class="balance-label">金额</span>
                <div class="balance-amount" :class="account.amount >= 0 ? 'positive' : 'negative'">
                  ¥{{ account.amount.toLocaleString() }}
                </div>
              </div>
              <div class="account-number">
                <span class="number-label">部门</span>
                <span class="number-value">{{ getDepartmentDisplayName(account) }}</span>
              </div>
            </div>
            
            <div class="stats-section">
              <div class="stat-item income">
                <div class="stat-icon">
                  <el-icon><TrendCharts /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-label">本月收入</div>
                  <div class="stat-value">+¥{{ (account.monthlyIncome || 0).toLocaleString() }}</div>
                </div>
              </div>
              <div class="stat-item expense">
                <div class="stat-icon">
                  <el-icon><Minus /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-label">本月支出</div>
                  <div class="stat-value">-¥{{ (account.monthlyExpense || 0).toLocaleString() }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card-footer">
            <div class="update-info">
              <el-icon class="time-icon"><Clock /></el-icon>
              <span class="update-time">更新时间：{{ account.updateTime }}</span>
            </div>
            <el-tag 
              size="small" 
              :type="account.status === 'active' ? 'success' : 'danger'"
              class="status-tag"
            >
              {{ account.status === 'active' ? '正常' : '冻结' }}
            </el-tag>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="!loading && paginatedAccounts.length === 0" class="empty-state">
          <el-empty description="暂无账户数据" />
        </div>
      </div>
      
      <!-- 卡片视图分页 -->
      <div class="pagination-wrapper" v-if="pagination.total > pagination.pageSize">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[8, 12, 16, 24]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="custom-pagination"
        />
      </div>
    </div>

    <!-- 账户表格列表 -->
    <div class="table-container" v-if="viewMode === 'table'">
      <el-table
        :data="accounts"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        :header-cell-style="{ background: '#fafbfc', color: '#1f2329', fontWeight: '600' }"
      >
        <el-table-column label="名称" min-width="150">
          <template #default="{ row }">
            <div class="name-cell">
              <el-icon class="account-icon"><CreditCard /></el-icon>
              <span class="account-name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="部门" width="120">
          <template #default="{ row }">
            <el-tag 
              :type="getDepartmentColor(row)" 
              size="small"
            >
              {{ getDepartmentDisplayName(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="150">
          <template #default="{ row }">
            <div class="amount-cell" :class="row.amount >= 0 ? 'positive' : 'negative'">
              ¥{{ row.amount.toLocaleString() }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="本月收入" width="120">
          <template #default="{ row }">
            <span class="income-text">+¥{{ (row.monthlyIncome || 0).toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column label="本月支出" width="120">
          <template #default="{ row }">
            <span class="expense-text">-¥{{ (row.monthlyExpense || 0).toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag 
              size="small" 
              :type="row.status === 'active' ? 'success' : 'danger'"
            >
              {{ row.status === 'active' ? '正常' : '冻结' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="150">
          <template #default="{ row }">
            <span class="update-time">{{ row.updateTime }}</span>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="description-text">{{ row.description || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="info" @click="handleDetail(row)" link>
              详情
            </el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)" link v-if="hasAnyPermission(['finance:team_manage'])">
              编辑
            </el-button>
            <el-button size="small" type="success" @click="handleRechargeAccount(row)" link v-if="hasAnyPermission(['finance:team_manage'])">
              充值
            </el-button>
            <!-- <el-button size="small" type="warning" @click="handleTransfer(row)" link v-if="hasAnyPermission(['finance:team_manage'])">
              转账
            </el-button> -->
            <el-button size="small" type="danger" @click="handleDelete(row)" link v-if="hasAnyPermission(['finance:team_manage'])">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!-- 新增/编辑账户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      append-to-body
      width="500px"
      @close="handleDialogClose"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="部门" prop="departmentId">
          <el-select 
            v-model="form.departmentId" 
            placeholder="请选择部门" 
            filterable 
            loading-text="加载中..."
            :loading="departmentLoading"
          >
            <el-option
              v-for="dept in departments"
              :key="dept._id"
              :label="dept.departmentName"
              :value="dept._id"
              :disabled="!dept.isActive"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number
            v-model="form.amount"
            :min="0"
            :precision="2"
            placeholder="请输入金额"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 充值对话框 -->
    <el-dialog
      v-model="rechargeDialogVisible"
      title="账户充值"
      append-to-body
      width="500px"
      @close="handleRechargeDialogClose"
    >
      <el-form :model="rechargeForm" :rules="rechargeRules" ref="rechargeFormRef" label-width="80px">
        <el-form-item label="选择团队" prop="teamId">
          <el-select v-model="rechargeForm.teamId" placeholder="请选择团队账户" filterable>
            <el-option
              v-for="account in accounts"
              :key="account._id"
              :label="account.name"
              :value="account._id"
            >
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>{{ account.name }}</span>
                <span style="color: #999; font-size: 12px;">当前余额: ¥{{ account.amount.toLocaleString() }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="充值金额" prop="amount">
          <el-input-number
            v-model="rechargeForm.amount"
            :min="0.01"
            :precision="2"
            placeholder="请输入充值金额"
            style="width: 100%"
          >
            <template #prefix>¥</template>
          </el-input-number>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="rechargeForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入充值备注"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rechargeDialogVisible = false">取消</el-button>
          <el-button type="success" @click="handleRechargeSubmit" :loading="rechargeLoading">
            <el-icon style="margin-right: 6px;"><Money /></el-icon>
            确认充值
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 转账对话框 -->
    <el-dialog
      v-model="transferDialogVisible"
      title="账户转账"
      width="500px"
      append-to-body
      @close="handleTransferDialogClose"
    >
      <el-form :model="transferForm" :rules="transferRules" ref="transferFormRef" label-width="80px">
        <el-form-item label="转出账户">
          <el-input :value="selectedAccount?.name" disabled />
        </el-form-item>
        <el-form-item label="转入账户" prop="toAccount">
          <el-select v-model="transferForm.toAccount" placeholder="请选择转入账户">
            <el-option
              v-for="account in availableAccounts"
              :key="account._id"
              :label="account.name"
              :value="account._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="转账金额" prop="amount">
          <el-input-number
            v-model="transferForm.amount"
            :min="0"
            :max="selectedAccount?.amount || 0"
            :precision="2"
            placeholder="请输入转账金额"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="transferForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入转账备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="transferDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleTransferSubmit">确定转账</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 账户详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="账户详细记录"
      width="80%"
      top="5vh"
      append-to-body
      @close="handleDetailDialogClose"
    >
      <div class="detail-header">
        <div class="account-summary">
          <div class="summary-left">
            <el-icon class="account-icon"><CreditCard /></el-icon>
            <div class="summary-info">
              <h3>{{ selectedAccount?.name }}</h3>
              <p>{{ getDepartmentDisplayName(selectedAccount) }}</p>
            </div>
          </div>
          <div class="summary-right">
            <div class="balance-display">
              <span class="balance-label">当前余额</span>
              <div class="balance-amount" :class="(selectedAccount?.amount || 0) >= 0 ? 'positive' : 'negative'">
                ¥{{ (selectedAccount?.amount || 0).toLocaleString() }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索和筛选栏 -->
      <div class="search-bar">
        <div class="search-left">
          <el-input
            v-model="recordSearch.keyword"
            placeholder="搜索交易记录..."
            :prefix-icon="Search"
            clearable
            @input="handleRecordSearch"
            style="width: 300px;"
          />
          <el-select
            v-model="recordSearch.type"
            placeholder="交易类型"
            clearable
            @change="handleRecordSearch"
            style="width: 120px;"
          >
            <el-option label="收入" value="income" />
            <el-option label="支出" value="expense" />
            <el-option label="充值" value="recharge" />
          </el-select>
          <el-date-picker
            v-model="recordSearch.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleRecordSearch"
            style="width: 240px;"
          />
        </div>
        <div class="search-right">
          <el-button @click="handleRecordRefresh" :icon="Refresh">
            刷新
          </el-button>
          <el-button type="primary" @click="handleExportRecords" :icon="Download">
            导出记录
          </el-button>
        </div>
      </div>

      <!-- 交易记录表格 -->
      <el-table
        :data="paginatedRecords"
        v-loading="recordLoading"
        stripe
        border
        style="width: 100%; margin-top: 16px;"
        :header-cell-style="{ background: '#fafbfc', color: '#1f2329', fontWeight: '600' }"
      >
        <el-table-column label="日期" width="120">
          <template #default="{ row }">
            <span class="record-date">{{ row.date }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag
              :type="getRecordTypeColor(row.type)"
              size="small"
              effect="light"
            >
              {{ getRecordTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <div class="amount-cell" :class="row.amount >= 0 ? 'positive' : 'negative'">
              {{ row.amount >= 0 ? '+' : '' }}¥{{ row.amount.toLocaleString() }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="对方账户" width="150">
          <template #default="{ row }">
            <span class="counterpart-account">{{ row.counterpart || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="余额" width="120">
          <template #default="{ row }">
            <div class="balance-cell" :class="row.balance >= 0 ? 'positive' : 'negative'">
              ¥{{ row.balance.toLocaleString() }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="record-remark">{{ row.remark || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作人" width="100">
          <template #default="{ row }">
            <span class="operator">{{ row.operator || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="recordPagination.total > recordPagination.pageSize">
        <el-pagination
          v-model:current-page="recordPagination.currentPage"
          v-model:page-size="recordPagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="recordPagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleRecordSizeChange"
          @current-change="handleRecordCurrentChange"
          class="custom-pagination"
        />
      </div>

      <!-- 空状态 -->
      <div v-if="!recordLoading && filteredRecords.length === 0" class="empty-records">
        <el-empty description="暂无交易记录" />
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup >
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import hasAnyPermission from '@/utils/checkPermissions'
import { 
  Plus, 
  MoreFilled, 
  Refresh, 
  Setting,
  CreditCard,
  Edit,
  Sort,
  Delete,
  TrendCharts,
  Minus,
  Clock,
  Wallet,
  Grid,
  List,
  Money,
  View,
  Search,
  Download
} from '@element-plus/icons-vue'
import { departmentApi, teamAccountApi} from '@/api/index'

// 响应式数据
const dialogVisible = ref(false)
const transferDialogVisible = ref(false)
const rechargeDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('新增账户')
const accounts = ref([])
const departments = ref([])
const departmentLoading = ref(false)
const rechargeLoading = ref(false)
const recordLoading = ref(false)
const loading = ref(false)
const formRef = ref()
const transferFormRef = ref()
const rechargeFormRef = ref()
const selectedAccount = ref(null)
const viewMode = ref('card') // 视图模式

// 交易记录相关数据
const transactionRecords = ref([])
const filteredRecords = ref([])

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 12, // 卡片视图默认每页显示12个
  total: 0
})

// 交易记录分页信息
const recordPagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 记录搜索表单
const recordSearch = reactive({
  keyword: '',
  type: '',
  dateRange:  null
})

// 表单数据
const form = reactive({
  id: null,
  name: '',
  amount: 0,
  departmentId: '',
  description: ''
})

// 转账表单
const transferForm = reactive({
  toAccount: '',
  amount: 0,
  remark: ''
})

// 充值表单
const rechargeForm = reactive({
  teamId: '',
  amount: 0,
  remark: ''
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
    { type: 'number', min: 0, message: '金额不能小于0', trigger: 'blur' }
  ],
  departmentId: [{ required: true, message: '请选择部门', trigger: 'change' }]
}

// 转账表单验证规则
const transferRules = {
  toAccount: [{ required: true, message: '请选择转入账户', trigger: 'change' }],
  amount: [{ required: true, message: '请输入转账金额', trigger: 'blur' }]
}

// 充值表单验证规则
const rechargeRules = {
  teamId: [{ required: true, message: '请选择团队账户', trigger: 'change' }],
  amount: [
    { required: true, message: '请输入充值金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '充值金额必须大于0', trigger: 'blur' }
  ]
}

// 可选择的转账账户（排除当前账户）
const availableAccounts = computed(() => {
  return accounts.value.filter((account) => account._id !== selectedAccount.value?._id)
})

// 分页后的账户数据
const paginatedAccounts = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return accounts.value.slice(start, end)
})

// 分页后的记录数据
const paginatedRecords = computed(() => {
  const start = (recordPagination.currentPage - 1) * recordPagination.pageSize
  const end = start + recordPagination.pageSize
  return filteredRecords.value.slice(start, end)
})

// 扁平化部门树
const flattenDepartments = (depts) => {
  let result = []
  depts.forEach(dept => {
    result.push(dept)
    if (dept.children && dept.children.length > 0) {
      result.push(...flattenDepartments(dept.children))
    }
  })
  return result
}

// 获取部门列表
const getDepartments = async () => {
  try {
    departmentLoading.value = true
    const response = await departmentApi.getDepartmentTree({ isActive: true })
    if (response.success && response.data) {
      // 将树形结构扁平化，便于查找
      const flatDepartments = flattenDepartments(response.data || [])
      departments.value = flatDepartments
    } else {
      ElMessage.error('获取部门列表失败：' + (response?.message || '未知错误'))
    }
  } catch (error) {
    console.error('获取部门列表失败:', error)
    ElMessage.error('获取部门列表失败')
  } finally {
    departmentLoading.value = false
  }
}

// 获取团队账户列表
const getTeamAccounts = async () => {
  try {
    loading.value = true
    const response = await teamAccountApi.getTeamAccounts()
    if (response.success && response.data) {
      const rawData = response.data.data || response.data || []

      accounts.value = rawData.map((account) => ({
        ...account,
        id: account._id,
        departmentId: account.departmentId,
        departmentName: typeof account.departmentId === 'object' && account.departmentId?.departmentName
          ? account.departmentId.departmentName
          : getDepartmentNameById(typeof account.departmentId === 'string' ? account.departmentId : account.departmentId?._id),
        monthlyIncome: account.monthlyIncome || 0,
        monthlyExpense: account.monthlyExpense || 0,
        status: account.isActive ? 'active' : 'inactive',
        updateTime: new Date(account.updatedAt).toLocaleString()
      }))

      // 更新分页信息
      pagination.total = accounts.value.length
    } else {
      ElMessage.error('获取团队账户失败：' + (response?.message || '未知错误'))
    }
  } catch (error) {
    console.error('获取团队账户失败:', error)
    ElMessage.error('获取团队账户失败')
  } finally {
    loading.value = false
  }
}

// 初始化数据
const initData = async () => {
  await getDepartments()
  await getTeamAccounts()
}

// 根据部门ID获取部门名称
const getDepartmentNameById = (departmentId) => {
  const dept = departments.value.find(d => d._id === departmentId)
  return dept ? dept.departmentName : '未知部门'
}

// 获取部门显示名称
const getDepartmentDisplayName = (account) => {
  if (!account) return '未知部门'
  
  // 优先使用已映射的部门名称
  if (account.departmentName) {
    return account.departmentName
  }
  
  // 如果departmentId是对象，获取其departmentName
  if (typeof account.departmentId === 'object' && account.departmentId?.departmentName) {
    return account.departmentId.departmentName
  }
  
  // 如果departmentId是字符串，通过ID查找部门名称
  if (typeof account.departmentId === 'string') {
    return getDepartmentNameById(account.departmentId)
  }
  
  // 如果departmentId是对象但需要使用_id查找
  if (typeof account.departmentId === 'object' && account.departmentId?._id) {
    return getDepartmentNameById(account.departmentId._id)
  }
  
  return '未知部门'
}

// 获取部门颜色（根据部门级别或名称）
const getDepartmentColor = (account) => {
  if (!account) return 'info'
  
  let deptId
  
  // 获取实际的部门ID
  if (typeof account.departmentId === 'string') {
    deptId = account.departmentId
  } else if (typeof account.departmentId === 'object' && account.departmentId?._id) {
    deptId = account.departmentId._id
  }
  
  if (!deptId) return 'info'
  
  const dept = departments.value.find(d => d._id === deptId)
  if (!dept) return 'info'
  
  // 根据部门层级设置颜色
  const colorMap = {
    1: 'primary',
    2: 'success', 
    3: 'warning',
    4: 'danger'
  }
  return colorMap[dept.level] || 'info'
}

// 获取部门名称（兼容旧接口）
// const getDepartmentName = (departmentId) => {
//   return getDepartmentNameById(departmentId)
// }

// 刷新数据
const handleRefresh = async () => {
  await initData()
  ElMessage.success('数据刷新成功')
}

// 账户操作
const handleAccountAction = (command) => {
  const { action, data } = command
  
  switch (action) {
    case 'detail':
      handleDetail(data)
      break
    case 'edit':
      handleEdit(data)
      break
    case 'recharge':
      handleRechargeAccount(data)
      break
    case 'transfer':
      handleTransfer(data)
      break
    case 'delete':
      handleDelete(data)
      break
  }
}

// 新增账户
const handleAdd = () => {
  dialogTitle.value = '新增账户'
  resetForm()
  dialogVisible.value = true
}

// 充值账户
const handleRecharge = () => {
  resetRechargeForm()
  rechargeDialogVisible.value = true
}

// 在卡片/表格中充值指定账户
const handleRechargeAccount = (account) => {
  resetRechargeForm()
  rechargeForm.teamId = account._id || account.id
  rechargeDialogVisible.value = true
}

// 查看账户详情
const handleDetail = async (account) => {
  selectedAccount.value = account
  detailDialogVisible.value = true
  const accountId = account._id || account.id
  if (accountId) {
    await loadAccountRecords(accountId)
  }
}

// 编辑账户
const handleEdit = (account) => {
  dialogTitle.value = '编辑账户'
  Object.assign(form, account)
  dialogVisible.value = true
}

// 转账
const handleTransfer = (account) => {
  selectedAccount.value = account
  resetTransferForm()
  transferDialogVisible.value = true
}

// 删除账户
const handleDelete = async (account) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除账户"${account.name}"吗？删除后将无法恢复。`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await teamAccountApi.deleteTeamAccount(account._id || account.id)
    if (response.success) {
      ElMessage.success('删除成功')
      await getTeamAccounts()
    } else {
      ElMessage.error('删除失败：' + response.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    } else {
      ElMessage.info('已取消删除')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (form.id) {
          // 编辑
          const response = await teamAccountApi.updateTeamAccount(form.id, {
            name: form.name,
            amount: form.amount,
            departmentId: form.departmentId,
            description: form.description
          })
          
          if (response.success) {
            ElMessage.success('更新成功')
            await getTeamAccounts()
          } else {
            ElMessage.error('更新失败：' + response.message)
          }
        } else {
          // 新增
          const response = await teamAccountApi.createTeamAccount({
            name: form.name,
            amount: form.amount,
            departmentId: form.departmentId,
            description: form.description
          })
          
          if (response.success) {
            ElMessage.success('创建成功')
            await getTeamAccounts()
          } else {
            ElMessage.error('创建失败：' + response.message)
          }
        }
        
        dialogVisible.value = false
        resetForm()
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error('操作失败，请重试')
      }
    }
  })
}

// 提交充值
const handleRechargeSubmit = async () => {
  if (!rechargeFormRef.value) return
  
  await rechargeFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        rechargeLoading.value = true
        
        // 查找要充值的账户（用于显示名称）
        const account = accounts.value.find((item) => item._id === rechargeForm.teamId)
        if (!account) {
          ElMessage.error('账户不存在')
          return
        }
        
        // 调用真实的充值 API
        const response = await teamAccountApi.rechargeTeamAccount(rechargeForm.teamId, {
          amount: rechargeForm.amount,
          description: rechargeForm.remark,
          paymentMethod: '在线充值'
        })
        
        if (response.success) {
          ElMessage.success(`充值成功！已向「${account.name}」充值 ¥${rechargeForm.amount.toLocaleString()}`)
          rechargeDialogVisible.value = false
          resetRechargeForm()
          
          // 刷新账户列表数据
          await getTeamAccounts()
        } else {
          ElMessage.error('充值失败：' + (response.message || '未知错误'))
        }
        
      } catch (error) {
        console.error('充值失败:', error)
        ElMessage.error('充值失败，请重试')
      } finally {
        rechargeLoading.value = false
      }
    }
  })
}
const handleTransferSubmit = async () => {
  if (!transferFormRef.value || !selectedAccount.value) return
  
  await transferFormRef.value.validate((valid) => {
    if (valid) {
      // 更新转出账户金额
      const fromIndex = accounts.value.findIndex((item) => item._id === selectedAccount.value._id)
      if (fromIndex > -1) {
        accounts.value[fromIndex].amount -= transferForm.amount
        accounts.value[fromIndex].updateTime = new Date().toLocaleString()
      }
      
      // 更新转入账户金额
      const toIndex = accounts.value.findIndex((item) => item._id === transferForm.toAccount)
      if (toIndex > -1) {
        accounts.value[toIndex].amount += transferForm.amount
        accounts.value[toIndex].updateTime = new Date().toLocaleString()
      }
      
      ElMessage.success('转账成功')
      transferDialogVisible.value = false
      resetTransferForm()
    }
  })
}

// 重置表单
const resetForm = () => {
  form.id = null
  form.name = ''
  form.amount = 0
  form.departmentId = ''
  form.description = ''
  
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 重置充值表单
const resetRechargeForm = () => {
  rechargeForm.teamId = ''
  rechargeForm.amount = 0
  rechargeForm.remark = ''
  
  if (rechargeFormRef.value) {
    rechargeFormRef.value.clearValidate()
  }
}

// 重置转账表单
const resetTransferForm = () => {
  transferForm.toAccount = ''
  transferForm.amount = 0
  transferForm.remark = ''
  
  if (transferFormRef.value) {
    transferFormRef.value.clearValidate()
  }
}

// 关闭对话框
const handleDialogClose = () => {
  resetForm()
}

const handleRechargeDialogClose = () => {
  resetRechargeForm()
}

const handleTransferDialogClose = () => {
  resetTransferForm()
  selectedAccount.value = null
}

// 分页相关方法
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1 // 重置到第一页
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
}

// 交易记录相关方法
// 加载账户交易记录
const loadAccountRecords = async (accountId) => {
  try {
    recordLoading.value = true
    
    // 构建查询参数
    const params = {
      page: recordPagination.currentPage,
      limit: recordPagination.pageSize
    }
    
    // 添加搜索条件
    if (recordSearch.keyword) {
      params.keyword = recordSearch.keyword
    }
    if (recordSearch.type) {
      params.type = recordSearch.type | 'expense' | 'recharge'
    }
    if (recordSearch.dateRange && recordSearch.dateRange.length === 2) {
      params.startDate = recordSearch.dateRange[0].toISOString().split('T')[0]
      params.endDate = recordSearch.dateRange[1].toISOString().split('T')[0]
    }
    
    const response = await teamAccountApi.getTeamAccountRecords(accountId, params)
    
    if (response.success && response.data) {
      const { records, teamAccount, pagination } = response.data
      
      // 转换 AccountRecord 到 TransactionRecord 格式
      const mappedRecords = records.map((record) => ({
        id: record._id,
        accountId,
        date: new Date(record.occurredAt).toISOString().split('T')[0],
        type: record.type,
        amount: record.amount,
        balance: record.balanceAfter,
        counterpart: record.financeInfo?.paymentName || record.financeInfo?.paymentMethod || '-',
        remark: record.description || record.remarks || '-',
        operator: record.createdBy?.username || '-',
        createdAt: new Date(record.createdAt).toLocaleString()
      }))
      
      transactionRecords.value = mappedRecords
      
      // 更新分页信息
      recordPagination.total = pagination.totalRecords
      recordPagination.currentPage = pagination.currentPage
      
      // 由于我们从API获取的是已过滤的数据，直接使用
      filteredRecords.value = mappedRecords
      
      // 更新选中账户的信息
      if (selectedAccount.value) {
        selectedAccount.value.amount = teamAccount.amount
      }
      
    } else {
      ElMessage.error('获取交易记录失败：' + (response.message || '未知错误'))
    }
    
  } catch (error) {
    console.error('加载交易记录失败:', error)
    ElMessage.error('加载交易记录失败')
  } finally {
    recordLoading.value = false
  }
}

// 记录搜索和筛选
const handleRecordSearch = async () => {
  if (!selectedAccount.value) return
  
  // 重置分页
  recordPagination.currentPage = 1
  
  // 重新加载数据（API已处理筛选）
  const accountId = selectedAccount.value._id || selectedAccount.value.id
  if (accountId) {
    await loadAccountRecords(accountId)
  }
}

// 记录刷新
const handleRecordRefresh = async () => {
  if (selectedAccount.value) {
    const accountId = selectedAccount.value._id || selectedAccount.value.id
    if (accountId) {
      await loadAccountRecords(accountId)
      ElMessage.success('记录刷新成功')
    }
  }
}

// 导出记录
const handleExportRecords = async () => {
  if (filteredRecords.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  try {
    // 准备导出数据
    const data = filteredRecords.value.map(record => ({
      '日期': record.date,
      '类型': getRecordTypeName(record.type),
      '金额': `${record.amount >= 0 ? '+' : ''}¥${record.amount.toLocaleString()}`,
      '余额': `¥${(record.balance || 0).toLocaleString()}`,
      '对方账户': record.counterpart || '-',
      '备注': record.remark || '-',
      '操作人': record.operator || '-',
    }))

    // 生成CSV内容
    const csv = [Object.keys(data[0]).join(',')]
    data.forEach(row => {
      csv.push(Object.values(row).map(value => `"${value}"`).join(','))
    })

    // 下载文件
    const blob = new Blob(['\uFEFF' + csv.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedAccount.value?.name || '团队账户'}_交易记录_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 记录分页相关方法
const handleRecordSizeChange = async (size) => {
  recordPagination.pageSize = size
  recordPagination.currentPage = 1 // 重置到第一页
  
  // 重新加载数据
  if (selectedAccount.value) {
    const accountId = selectedAccount.value._id || selectedAccount.value.id
    if (accountId) {
      await loadAccountRecords(accountId)
    }
  }
}

const handleRecordCurrentChange = async (page) => {
  recordPagination.currentPage = page
  
  // 重新加载数据
  if (selectedAccount.value) {
    const accountId = selectedAccount.value._id || selectedAccount.value.id
    if (accountId) {
      await loadAccountRecords(accountId)
    }
  }
}

// 记录类型相关方法
const getRecordTypeName = (type) => {
  const typeMap = {
    income: '收入',
    expense: '支出',
    recharge: '充值'
  }
  return typeMap[type] || '未知'
}

const getRecordTypeColor = (type) => {
  const colorMap = {
    income: 'success',
    expense: 'danger', 
    recharge: 'primary'
  }
  return colorMap[type] || 'info'
}

// 关闭详情对话框
const handleDetailDialogClose = () => {
  selectedAccount.value = null
  transactionRecords.value = []
  filteredRecords.value = []
  recordSearch.keyword = ''
  recordSearch.type = ''
  recordSearch.dateRange = null
  recordPagination.currentPage = 1
  recordPagination.total = 0
}

onMounted(async () => {
  await initData()
})
</script>

<style scoped>
.team-accounts {
  width: 100%;
  max-width: 100%;
  padding: 20px;
  background-color: transparent;
  box-sizing: border-box;
  overflow-x: hidden;
  position: relative;
}

/* 页面标题 */
.page-header {
  margin-bottom: 24px;
}

.page-title {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.title-icon {
  font-size: 24px;
  color: #409eff;
  margin-right: 12px;
}

.page-title h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2329;
}

.page-description {
  color: #86909c;
  font-size: 14px;
  margin: 0;
}

/* 操作栏 */
.action-card {
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 2px 0 rgba(31, 35, 41, 0.08);
  border: 1px solid #e4e7ed;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
}

.action-left {
  display: flex;
  gap: 12px;
}

.action-center {
  display: flex;
  align-items: center;
}

.view-mode-switch {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 2px;
}

.view-mode-switch .el-radio-button__inner {
  border: none;
  background: transparent;
  color: #86909c;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.view-mode-switch .el-radio-button__orig-radio:checked + .el-radio-button__inner {
  background: #409eff;
  color: white;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}

.action-btn.primary {
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  border: none;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}

.action-btn.success {
  background: linear-gradient(135deg, #67c23a 0%, #5daf34 100%);
  border: none;
  box-shadow: 0 2px 4px rgba(103, 194, 58, 0.3);
}

.action-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.total-count {
  color: #86909c;
  font-size: 14px;
}

/* 表格容器 */
.table-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 2px 0 rgba(31, 35, 41, 0.08);
  border: 1px solid #e4e7ed;
}

/* 表格单元格样式 */
.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name-cell .account-icon {
  font-size: 16px;
  color: #409eff;
}

.name-cell .account-name {
  font-weight: 500;
  color: #1f2329;
}

.amount-cell {
  font-weight: 700;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 16px;
}

.amount-cell.positive {
  color: #00b42a;
}

.amount-cell.negative {
  color: #f53f3f;
}

.income-text {
  color: #00b42a;
  font-weight: 600;
  font-family: monospace;
}

.expense-text {
  color: #f53f3f;
  font-weight: 600;
  font-family: monospace;
}

.description-text {
  color: #4e5969;
  font-size: 14px;
}

.update-time {
  color: #86909c;
  font-size: 12px;
}

/* 表格样式优化 */
.table-container .el-table {
  border-radius: 6px;
  overflow: hidden;
}

.table-container .el-table th {
  background-color: #fafbfc;
  color: #1f2329;
  font-weight: 600;
  border-bottom: 2px solid #e4e7ed;
}

.table-container .el-table td {
  border-bottom: 1px solid #f0f2f5;
}

.table-container .el-table tr:hover {
  background-color: #f8f9fa;
}

.table-container .el-table .el-button--small {
  padding: 4px 8px;
  margin: 0 2px;
}

/* 账户卡片容器 */
.accounts-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 2px 0 rgba(31, 35, 41, 0.08);
  border: 1px solid #e4e7ed;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.account-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  min-height: 300px;
  align-content: start;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

/* 账户卡片 */
.account-card {
  background: linear-gradient(135deg, #fff 0%, #fafbfc 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  height: fit-content;
  min-height: 260px;
  max-height: 380px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.account-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
}

.account-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(31, 35, 41, 0.12);
  border-color: #409eff;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.account-info {
  flex: 1;
}

.account-name {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.account-icon {
  font-size: 20px;
  color: #409eff;
  margin-right: 8px;
}

.account-name h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2329;
}

.account-type-tag {
  font-size: 12px;
  border-radius: 6px;
}

.account-actions {
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.account-card:hover .account-actions {
  opacity: 1;
}

.more-btn {
  color: #86909c;
  font-size: 16px;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.more-btn:hover {
  background-color: #f2f3f5;
  color: #409eff;
}

/* 卡片内容 */
.card-content {
  margin-bottom: 20px;
  flex: 1; /* 占据剩余空间 */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.balance-section {
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
}

.balance-main {
  margin-bottom: 12px;
}

.balance-label {
  display: block;
  color: #86909c;
  font-size: 12px;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.balance-amount {
  font-size: 28px;
  font-weight: 700;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

.balance-amount.positive {
  color: #00b42a;
}

.balance-amount.negative {
  color: #f53f3f;
}

.account-number {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.number-label {
  color: #86909c;
  font-size: 12px;
}

.number-value {
  color: #1f2329;
  font-family: monospace;
  font-size: 14px;
  font-weight: 500;
}

/* 统计区域 */
.stats-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-item.income {
  background: linear-gradient(135deg, #e6f7e6 0%, #d4edda 100%);
}

.stat-item.expense {
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
}

.stat-item:hover {
  transform: scale(1.02);
}

.stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 16px;
}

.stat-item.income .stat-icon {
  background: #00b42a;
  color: white;
}

.stat-item.expense .stat-icon {
  background: #f53f3f;
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-label {
  color: #86909c;
  font-size: 12px;
  margin-bottom: 2px;
}

.stat-value {
  font-weight: 600;
  font-size: 14px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

.stat-item.income .stat-value {
  color: #00b42a;
}

.stat-item.expense .stat-value {
  color: #f53f3f;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.update-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-icon {
  color: #86909c;
  font-size: 14px;
}

.update-time {
  color: #86909c;
  font-size: 12px;
}

.status-tag {
  border-radius: 6px;
  font-weight: 500;
}

/* 对话框脚注 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

/* 分页样式 */
.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  padding: 20px 0;
  border-top: 1px solid #f0f2f5;
}

.custom-pagination {
  --el-pagination-font-size: 14px;
  --el-pagination-bg-color: #ffffff;
  --el-pagination-text-color: #1f2329;
  --el-pagination-border-radius: 6px;
}

.custom-pagination .el-pagination__total {
  color: #86909c;
  font-weight: 500;
}

.custom-pagination .el-pager li {
  border-radius: 6px;
  margin: 0 2px;
  transition: all 0.3s;
}

.custom-pagination .el-pager li:hover {
  background-color: #f2f6fc;
  color: #409eff;
}

.custom-pagination .el-pager li.is-active {
  background-color: #409eff;
  color: white;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .account-cards {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 1200px) {
  .team-accounts {
    padding: 16px;
  }
  
  .account-cards {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .team-accounts {
    padding: 12px;
  }
  
  .account-cards {
    grid-template-columns: 1fr;
    gap: 12px;
    min-height: 200px;
  }
  
  .account-card {
    min-height: 220px;
    max-height: 300px;
    padding: 16px;
  }
  
  .action-card {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .action-left,
  .action-center,
  .action-right {
    justify-content: center;
  }
  
  .view-mode-switch {
    width: 100%;
    justify-content: center;
  }
  
  .stats-section {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .table-container {
    padding: 12px;
    overflow-x: auto;
  }
  
  .table-container .el-table {
    min-width: 800px;
  }
  
  .pagination-wrapper {
    margin-top: 16px;
    padding: 16px 0;
  }
  
  .custom-pagination {
    --el-pagination-font-size: 12px;
  }
}

@media (max-width: 480px) {
  .account-card {
    padding: 16px;
    min-height: 220px;
    max-height: 300px;
  }
  
  .balance-amount {
    font-size: 24px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .account-actions {
    align-self: flex-end;
  }
  
  .account-cards {
    gap: 12px;
  }
  
  .pagination-wrapper {
    margin-top: 12px;
    padding: 12px 0;
  }
}

/* 动画效果 */
.action-card,
.accounts-container {
  transition: all 0.3s ease;
}

.action-card:hover,
.accounts-container:hover {
  box-shadow: 0 4px 8px 0 rgba(31, 35, 41, 0.12);
}

.action-btn {
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
}

/* 账户详情对话框样式 */
.detail-header {
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.account-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-left .account-icon {
  font-size: 24px;
  color: #409eff;
}

.summary-info h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2329;
}

.summary-info p {
  margin: 0;
  color: #86909c;
  font-size: 14px;
}

.summary-right {
  text-align: right;
}

.balance-display .balance-label {
  display: block;
  color: #86909c;
  font-size: 12px;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.balance-display .balance-amount {
  font-size: 32px;
  font-weight: 700;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

.balance-display .balance-amount.positive {
  color: #00b42a;
}

.balance-display .balance-amount.negative {
  color: #f53f3f;
}

/* 搜索栏样式 */
.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  margin-bottom: 16px;
}

.search-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.search-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 记录表格样式 */
.record-date {
  color: #1f2329;
  font-family: monospace;
  font-size: 14px;
}

.counterpart-account {
  color: #4e5969;
  font-size: 14px;
}

.balance-cell {
  font-weight: 600;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 14px;
}

.balance-cell.positive {
  color: #00b42a;
}

.balance-cell.negative {
  color: #f53f3f;
}

.record-remark {
  color: #4e5969;
  font-size: 14px;
}

.operator {
  color: #1f2329;
  font-size: 14px;
  font-weight: 500;
}

/* 空状态样式 */
.empty-records {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  margin-top: 20px;
}

/* 响应式设计优化 */
@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .search-left {
    flex-direction: column;
    gap: 12px;
  }
  
  .search-right {
    justify-content: center;
  }
  
  .account-summary {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .summary-right {
    text-align: center;
  }
  
  .balance-display .balance-amount {
    font-size: 28px;
  }
}
</style>