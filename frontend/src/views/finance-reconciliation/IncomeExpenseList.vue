<template>
  <div class="income-expense-list">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><List /></el-icon>
        <h2>收支列表</h2>
      </div>
      <div class="page-description">
        管理团队的收入支出记录
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-card business-style">
      <el-form :model="searchForm" :inline="true" class="business-search-form">
        <div class="search-fields">
          <el-form-item label="记录名称" class="search-item">
            <el-input
              v-model="searchForm.recordName"
              placeholder="请输入记录名称"
              clearable
              class="business-input"
            />
          </el-form-item>
          <el-form-item label="收支类型" class="search-item">
            <el-select 
              v-model="searchForm.type" 
              placeholder="全部类型" 
              clearable
              class="business-select"
            >
              <el-option label="收入" value="income" />
              <el-option label="支出" value="expense" />
            </el-select>
          </el-form-item>
          <el-form-item label="团队账户" class="search-item">
            <el-select 
              v-model="searchForm.account" 
              placeholder="全部账户" 
              clearable
              class="business-select"
              filterable
            >
              <el-option 
                v-for="account in teamAccounts" 
                :key="account._id" 
                :label="account.name" 
                :value="account._id"
              >
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span>{{ account.name }}</span>
                  <span style="color: #999; font-size: 12px;">{{ (account).accountNumber || '' }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="日期范围" class="search-item">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始"
              end-placeholder="结束"
              value-format="YYYY-MM-DD"
              class="business-input"
              style="width: 300px;"
            />
          </el-form-item>
          <el-form-item label="关键词" class="search-item">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索说明"
              clearable
              class="business-input"
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
        <el-button type="primary" @click="handleAdd" :icon="Plus" class="action-btn primary" v-if="hasAnyPermission(['finance:create','finance:manage'])">
          新增收支记录
        </el-button>
        <el-button
          type="danger"
          @click="handleBatchDelete"
          :disabled="!selectedRows.length"
          :icon="Delete"
          class="action-btn danger"
          v-if="hasAnyPermission(['finance:delete','finance:manage'])"
        >
          批量删除
          <span v-if="selectedRows.length">({{ selectedRows.length }})</span>
        </el-button>
        <!-- <el-button @click="handleExport" :icon="Download" class="action-btn">
          导出数据
        </el-button> -->
      </div>
      <div class="action-right">
        <span class="total-count">共 {{ pagination.total || 0 }} 条数据</span>
        <el-tooltip content="刷新数据" placement="top">
          <el-button @click="initData" :icon="Refresh" circle />
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
        @selection-change="handleSelectionChange"
        stripe
        border
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="记录名称" min-width="140">
          <template #default="{ row }">
            <div class="record-name">
              <span class="name-text">{{ row.recordName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag 
              :type="row.type === 'income' ? 'success' : 
                     row.type === 'recharge' ? 'warning' : 'danger'" 
              size="small"
            >
              {{ row.type === 'income' ? '收入' : 
                 row.type === 'recharge' || (row.paymentName === '系统充值') ? '系统充值' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <div class="amount-wrapper">
              <span :class="['amount-text', row.type === 'income' ? 'income' : 'expense']">
                {{ row.type === 'income' ? '+' : '-' }}¥{{ row.amount.toLocaleString() }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="团队账户" width="120">
          <template #default="{ row }">
            <span class="account-text">{{ row.teamAccountName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发生时间" width="150">
          <template #default="{ row }">
            <span class="time-text">{{ formatUtcToLocalDate(row.transactionTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="收款/付款方" width="120">
          <template #default="{ row }">
            <span class="payer-text">{{ row.payerName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="description-text">{{ row.description || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作人" width="100">
          <template #default="{ row }">
            <div class="operator-info">
              <el-icon class="operator-icon"><User /></el-icon>
              <span class="operator-name">{{ row.operatorName || row.operator || '未知' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="凭证" width="120" align="center">
          <template #default="{ row }">
            <div v-if="row.images && row.images.length > 0" class="image-numbers-container">
              <span
                v-for="(image, index) in row.images"
                :key="image._id || image.id || index"
                class="image-number-item"
                @click="previewSingleImage(row.images, index)"
                :title="`点击查看第${index + 1}张凭证`"
              >
                {{ index + 1 }}
              </span>
            </div>
            <span v-else class="no-image">-</span>
          </template>
        </el-table-column>
        <el-table-column label="审批状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.approvalStatus === 'approved' ? 'success' : 
                     row.approvalStatus === 'rejected' ? 'danger' : 'warning'"
              size="small"
            >
              {{ row.approvalStatus === 'pending' ? '待审批' : 
                 row.approvalStatus === 'approved' ? '已通过' : '已拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)" link  v-if="hasAnyPermission(['finance:update','finance:manage'])">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" link v-if="hasAnyPermission(['finance:delete','finance:manage'])">
              删除
            </el-button>
            <template v-if="row.approvalStatus === 'pending' && hasAnyPermission(['finance:approve','finance:manage'])">
              <el-button size="small" type="success" @click="handleApprove(row, 'approved')" link>
                通过
              </el-button>
              <el-button size="small" type="warning" @click="handleApprove(row, 'rejected')" link>
                拒绝
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
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
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      style="max-height: 80vh; overflow: auto;"
      append-to-body
      @close="handleDialogClose"
      class="record-dialog"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="团队账户" prop="teamId">
              <el-select v-model="form.teamId" placeholder="请选择团队账户" filterable>
                <el-option 
                  v-for="account in teamAccounts" 
                  :key="account._id" 
                  :label="account.name" 
                  :value="account._id"
                >
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>{{ account.name }}</span>
                    <span style="color: #999; font-size: 12px;">{{ (account).accountNumber || '' }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="记录名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入记录名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="收支类型" prop="type">
              <el-radio-group v-model="form.type">
                <el-radio label="income">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <el-icon style="color: #00b42a;"><TrendCharts /></el-icon>
                    <span>收入</span>
                  </div>
                </el-radio>
                <el-radio label="expense">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <el-icon style="color: #f53f3f;"><Minus /></el-icon>
                    <span>支出</span>
                  </div>
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="金额" prop="amount">
              <el-input-number
                v-model="form.amount"
                :min="0"
                :precision="2"
                placeholder="请输入金额"
                style="width: 100%;"
              >
                <template #prefix>¥</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="收支时间" prop="occurredAt">
              <el-date-picker
                v-model="form.occurredAt"
                type="date"
                placeholder="选择收支日期"
                value-format="YYYY-MM-DD"
                format="YYYY-MM-DD"
                style="width: 100%;"
                class="dialog-date-picker"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="form.type === 'income' ? '收款方式' : '支付方式'" prop="paymentMethod">
              <el-select v-model="form.paymentMethod" placeholder="请选择方式">
                <el-option label="银行转账" value="bank_transfer" />
                <el-option label="现金" value="cash" />
                <el-option label="支付宝" value="alipay" />
                <el-option label="微信支付" value="wechat_pay" />
                <el-option label="刷卡" value="card" />
                <el-option label="支票" value="check" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="form.type === 'income' ? '收款方名称' : '付款方名称'" prop="paymentName">
              <el-input v-model="form.paymentName" :placeholder="form.type === 'income' ? '请输入收款方名称' : '请输入付款方名称'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="form.type === 'income' ? '收款账号' : '付款账号'" prop="account">
              <el-input v-model="form.account" :placeholder="form.type === 'income' ? '请输入收款账号' : '请输入付款账号'" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="说明/备注" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="4"
                placeholder="请输入说明或备注信息"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 图片上传区域 -->
        <el-row>
          <el-col :span="24">
            <el-form-item label="上传凭证">
              <div class="image-upload-container">
                <!-- 图片预览和上传区域 - 统一在一行显示 -->
                <div class="image-items-container">
                  <!-- 已选择的图片预览 -->
                  <div
                    v-for="(image, index) in form.images"
                    :key="image._id || image.id || index"
                    class="image-preview-item"
                  >
                    <el-image
                      :src="getImageUrlSync(image)"
                      :preview-src-list="getFormImageUrls()"
                      :initial-index="index"
                      fit="cover"
                      class="preview-image"
                    />
                    <div class="image-overlay">
                      <el-button
                        type="danger"
                        size="small"
                        :icon="Delete"
                        circle
                        @click="removeImage(index)"
                        class="delete-btn"
                      />
                    </div>
                  </div>

                  <!-- 上传按钮 - 与图片在同一行 -->
                  <el-upload
                    v-if="!form.images || form.images.length < 9"
                    ref="uploadRef"
                    :auto-upload="false"
                    :before-upload="beforeUpload"
                    :on-change="handleFileChange"
                    :show-file-list="false"
                    accept="image/*"
                    multiple
                    class="image-uploader"
                  >
                    <div class="upload-trigger">
                      <el-icon class="upload-icon"><Plus /></el-icon>
                      <div class="upload-text">选择图片</div>
                    </div>
                  </el-upload>
                </div>
              </div>
              <div class="upload-tips">
                <el-text size="small" type="info">
                  支持 JPG、PNG、GIF 格式，单个文件不超过 10MB，最多上传 8 张图片
                </el-text>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 图片预览器 -->
    <el-image-viewer
      v-if="imagePreviewVisible"
      teleported
      :url-list="getPreviewImageUrls()"
      :initial-index="currentImageIndex"
      @close="closeImagePreview"
    />
  </div>
</template>

<script setup >
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  Delete,
  Setting,
  List,
  User,
  TrendCharts,
  Minus
} from '@element-plus/icons-vue'
import { financeApi, teamAccountApi, fileApi } from '@/api/index';
import hasAnyPermission from '@/utils/checkPermissions'
import { formatUtcToLocalDate } from '@/utils/dateUtils'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)

// 图片预览相关
const imagePreviewVisible = ref(false)
const previewImages = ref([])
const currentImageIndex = ref(0)
const dialogTitle = ref('新增收支记录')
const tableData = ref([])
const formRef = ref()
const selectedRows = ref([])
const submitLoading = ref(false)
const uploadRef = ref()

// 团队账户数据
const teamAccounts = ref([])// 搜索表单
// 搜索表单
const searchForm = reactive({
  recordName: '',
  type: '',
  category: '',
  account: '',
  approvalStatus: '',
  amountRange: '',
  dateRange: [],
  keyword: ''
})

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 表单数据
const form = reactive({
  _id: null,
  teamId: null, // 团队账户ID
  name: '', // 记录名称
  type: 'income' | 'expense', // 类型：income/expense
  amount: 0, // 金额
  occurredAt: '', // 发生时间
  paymentMethod: '', // 收款方式/支付方式
  paymentName: '', // 收款/付款方名称
  account: '', // 收款/付款账号
  description: '', // 说明/备注
  images: [], // 关联的图片
})

// 记录要删除的已保存图片ID
const deletedImageIds = ref([])

// 表单验证规则
const rules = {
  teamId: [{ required: true, message: '请选择团队账户', trigger: 'change' }],
  name: [{ required: true, message: '请输入记录名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择收支类型', trigger: 'change' }],
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '金额必须大于0', trigger: 'blur' }
  ],
  occurredAt: [{ required: true, message: '请选择收支日期', trigger: 'change' }],
  paymentName: [{ required: true, message: '请输入收款/付款方名称', trigger: 'blur' }]
}

// 初始化团队账户数据
const initTeamAccounts = async () => {
  try {
    const response = await teamAccountApi.getTeamAccounts({ isActive: true })
    console.log('获取团队账户列表成功:', response.data)
    if (response && response.data) {
      teamAccounts.value = response.data.data || response.data || []
    }
  } catch (error) {
    console.error('获取团队账户列表失败:', error)
    ElMessage.error('获取团队账户列表失败')
  }
}

// 初始化数据
const initData = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.currentPage,
      limit: pagination.pageSize
    }
    
    // 只添加有值的搜索条件
    if (searchForm.recordName) params.name = searchForm.recordName
    if (searchForm.type) params.type = searchForm.type | 'expense' | 'recharge'
    if (searchForm.category) params.category = searchForm.category
    if (searchForm.account) params.teamId = searchForm.account
    if (searchForm.approvalStatus) params.approvalStatus = searchForm.approvalStatus
    if (searchForm.keyword) params.search = searchForm.keyword
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    console.log('正在请求财务数据，参数:', params)
    const response = await financeApi.getRecords(params)
    console.log('API响应:', response)
    
    if (response && response.data) {
      const data = response.data
      
      // 如果后端返回的是数组数据，直接使用
      if (Array.isArray(data)) {
        tableData.value = data
        pagination.total = data.length
      } else {
        // 如果后端返回的是对象包装的数据
        tableData.value = data.records || data.data || data.list || []
        if (data.pagination) {
          // 使用 totalRecords 作为总记录数
          pagination.total = data.pagination.totalRecords || 0
          console.log('分页信息:', data.pagination)
        } else {
          pagination.total = data.total || data.count || tableData.value.length
        }
      }
      
      // 数据字段映射，确保前端显示正确
      tableData.value = tableData.value.map((item) => {
        // 调试日志：查看原始数据结构
        console.log('原始财务记录数据:', item);
        console.log('createdBy 数据:', item.createdBy);
        
        // 获取操作人信息
        let operatorName = '未知';
        if (item.createdBy) {
          // 如果有createdBy对象，优先使用username
          operatorName = item.createdBy.username || item.createdBy.name || item.createdBy;
        } else if (item.paymentName === '系统充值') {
          // 如果是系统充值但没有操作人，显示为系统
          operatorName = '系统';
        }
        
        // 如果operatorName还是对象类型，尝试提取字符串
        if (typeof operatorName === 'object' && operatorName !== null) {
          operatorName = (operatorName).username || (operatorName).name || '未知';
        }
        
        console.log('最终操作人名称:', operatorName);
        
        return {
          ...item,
          id: item._id || item.id,
          recordName: item.name,
          teamAccountName: item.teamId?.name || '未知账户',
          transactionTime: item.occurredAt,
          payerName: item.paymentName,
          payerAccount: item.account,
          operator: operatorName,
          operatorName: operatorName,
          approvalStatus: item.approvalStatus || 'pending'
        };
      })
      
      console.log('数据加载成功:', tableData.value.length, '条记录')
    } else {
      ElMessage.error('获取数据失败')
    }
  } catch (error) {
    console.error('获取财务记录失败:', error)
    ElMessage.error('获取数据失败，请重试')
  } finally {
    loading.value = false
  }
}

// 查询
const handleSearch = async () => {
  pagination.currentPage = 1 // 重置到第一页
  await initData()
}

// 重置
const handleReset = () => {
  searchForm.recordName = ''
  searchForm.type = ''
  searchForm.category = ''
  searchForm.account = ''
  searchForm.approvalStatus = ''
  searchForm.amountRange = ''
  searchForm.dateRange = []
  searchForm.keyword = ''
  handleSearch()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 批量删除
const handleBatchDelete = async () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请选择要删除的记录')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条记录吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedRows.value.map(row => row.id || row._id)
    const response = await financeApi.batchDeleteRecords(ids)
    
    if (response) {
      selectedRows.value = []
      await initData() // 重新获取数据
      ElMessage.success('删除成功')
    } else {
      ElMessage.error('删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('删除失败，请重试')
    } else {
      ElMessage.info('已取消删除')
    }
  }
}

// 导出数据 - 已导出使用
// const handleExport = () => {
//   ElMessage.success('数据导出成功')
// }

// 获取分类标签 - 已导出使用
// const getCategoryLabel = (category) => {
//   const categoryMap: Record<string, string> = {
//     salary: '工资',
//     bonus: '奖金',
//     office_supplies: '办公用品',
//     travel: '差旅费',
//     training: '培训费',
//     other: '其他'
//   }
//   return categoryMap[category] || category
// }

// 获取账户标签 - 已导出使用
// const getAccountLabel = (account) => {
//   const accountMap: Record<string, string> = {
//     company: '公司账户',
//     cash: '现金',
//     other: '其他'
//   }
//   return accountMap[account] || account
// }

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增收支记录'
  resetForm()
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑收支记录'
  Object.assign(form, row)

  // 确保图片数据正确处理 - 编辑时图片都是已保存的
  if (row.images && Array.isArray(row.images)) {
    form.images = row.images.map(img => {
      // 如果是populate的完整对象，直接使用
      if (typeof img === 'object' && img !== null && img._id) {
        return img
      }

      // 如果只是ID字符串，需要转换为对象格式
      if (typeof img === 'string') {
        return { _id: img }
      }

      return img
    })
  } else {
    form.images = []
  }

  dialogVisible.value = true
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条收支记录吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await financeApi.deleteRecord(row.id || row._id)
    
    if (response) {
      await initData() // 重新获取数据
      ElMessage.success('删除成功')
    } else {
      ElMessage.error('删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败，请重试')
    } else {
      ElMessage.info('已取消删除')
    }
  }
}

// 审批财务记录
const handleApprove = async (row, status) => {
  try {
    const actionText = status === 'approved' ? '通过' : '拒绝'
    
    const result = await ElMessageBox.prompt(
      `确认${actionText}此条财务记录？`,
      `${actionText}审批`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入审批意见（可选）',
        inputValidator: () => true // 允许空输入
      }
    )
    
    loading.value = true
    
    const response = await financeApi.approveRecord(row._id || row.id, {
      approvalStatus: status,
      approvalComment: result.value || ''
    })
    
    if (response.success) {
      ElMessage.success(`${actionText}成功`)

      // 直接更新本地数据，提供更好的用户体验
      const index = tableData.value.findIndex(item =>
        (item._id || item.id) === (row._id || row.id)
      )
      if (index !== -1) {
        tableData.value[index].approvalStatus = status
      }

      // 同时重新加载数据以确保数据一致性
      await initData()
    } else {
      ElMessage.error(response.message || `${actionText}失败`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审批失败:', error)
      ElMessage.error(error?.message || '审批失败')
    }
  } finally {
    loading.value = false
  }
}

// 图片相关方法
// 获取图片URL
const getImageUrlSync = (image) => {
  // 如果是临时文件（File对象），创建本地URL
  if (image instanceof File) {
    return URL.createObjectURL(image)
  }

  // 如果是已保存的文件
  const imageId = typeof image === 'string' ? image : (image._id || image.id)

  if (!imageId) {
    return ''
  }

  // 生成文件访问URL（不需要token）
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  const url = `${baseUrl}/files/${imageId}`

  return url
}

// 图片加载错误处理
const handleImageError = (event) => {
  console.error('图片加载失败:', event.target.src)
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg=='
}

// 预览行中的图片
const previewRowImages = (row) => {
  if (row.images && row.images.length > 0) {
    previewImages.value = [...row.images]
    currentImageIndex.value = 0
    imagePreviewVisible.value = true
  }
}

// 预览单张图片
const previewSingleImage = (images, index) => {
  if (images && images.length > 0 && index >= 0 && index < images.length) {
    previewImages.value = [...images]
    currentImageIndex.value = index
    imagePreviewVisible.value = true
  }
}

// 关闭图片预览
const closeImagePreview = () => {
  imagePreviewVisible.value = false
  previewImages.value = []
  currentImageIndex.value = 0
}

// 获取预览图片URL列表
const getPreviewImageUrls = () => {
  if (!previewImages.value || !Array.isArray(previewImages.value)) {
    return []
  }
  return previewImages.value.map(image => getImageUrlSync(image)).filter(url => url)
}

// 获取表单图片URL列表（用于el-image预览）
const getFormImageUrls = () => {
  if (!form.images || !Array.isArray(form.images)) {
    return []
  }
  return form.images.map(image => getImageUrlSync(image)).filter(url => url)
}

// 上传前检查
const beforeUpload = (file) => {
  // 检查文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }

  // 检查文件大小
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return false
  }

  // 检查图片数量
  if (form.images.length >= 8) {
    ElMessage.error('最多只能上传 8 张图片!')
    return false
  }

  return false // 阻止自动上传
}

// 文件选择变化回调
const handleFileChange = (file, fileList) => {
  const rawFile = file.raw

  // 检查文件类型
  const isImage = rawFile.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return
  }

  // 检查文件大小
  const isLt10M = rawFile.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return
  }

  // 检查图片数量
  if (form.images.length >= 8) {
    ElMessage.error('最多只能上传 8 张图片!')
    return
  }

  // 添加到临时图片列表
  form.images.push(rawFile)
  ElMessage.success('图片添加成功')
}

// 删除图片
const removeImage = async (index) => {
  try {
    const image = form.images[index]

    await ElMessageBox.confirm(
      '确定要删除这张图片吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 如果是临时文件（File对象），释放URL
    if (image instanceof File) {
      const url = getImageUrlSync(image)
      URL.revokeObjectURL(url)
    } else if (image._id || image.id) {
      // 如果是已保存的图片，记录到删除列表中，提交时再删除
      deletedImageIds.value.push(image._id || image.id)
    }

    form.images.splice(index, 1)
    ElMessage.success('图片删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除图片失败:', error)
      ElMessage.error('删除图片失败')
    }
  }
}

// 上传单个图片文件
const uploadSingleImage = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fileApi.uploadFile(formData)
    console.log('文件上传响应:', response) // 调试日志

    if (response.success && response.data) {
      return response.data._id || response.data.id
    } else {
      throw new Error(response.message || '图片上传失败')
    }
  } catch (error) {
    console.error('上传图片失败:', error)
    throw error
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        submitLoading.value = true

        if (!form.teamId) {
          ElMessage.error('请选择团队账户')
          return
        }

        // 处理图片上传
        const imageIds = []

        for (const image of form.images) {
          if (image instanceof File) {
            // 新上传的图片，需要先上传到服务器
            try {
              const imageId = await uploadSingleImage(image)
              imageIds.push(imageId)
            } catch (error) {
              ElMessage.error(`图片上传失败: ${error.message}`)
              return
            }
          } else {
            // 已存在的图片，直接使用ID
            imageIds.push(image._id || image.id || image)
          }
        }

        const submitData = {
          teamId: form.teamId,
          name: form.name,
          type: form.type,
          amount: form.amount,
          occurredAt: form.occurredAt,
          paymentMethod: form.paymentMethod,
          paymentName: form.paymentName,
          account: form.account,
          description: form.description,
          images: imageIds
        }

        let response
        if (form._id) {
          // 编辑
          response = await financeApi.updateRecord(form._id, submitData)
        } else {
          // 新增
          response = await financeApi.createRecord(submitData)
        }

        if (response) {
          // 删除标记为删除的图片文件
          if (deletedImageIds.value.length > 0) {
            try {
              await fileApi.batchDeleteFiles(deletedImageIds.value)
            } catch (error) {
              console.error('删除图片文件失败:', error)
              // 即使删除文件失败，也不影响主流程
            }
          }

          ElMessage.success(form._id ? '更新成功' : '添加成功')
          dialogVisible.value = false
          resetForm()
          await initData() // 重新获取数据
        } else {
          ElMessage.error('操作失败')
        }
      } catch (error) {
        console.error('提交失败:', error)
        ElMessage.error('操作失败，请重试')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  // 释放临时图片的URL
  form.images.forEach(image => {
    if (image instanceof File) {
      const url = getImageUrlSync(image)
      URL.revokeObjectURL(url)
    }
  })

  form._id = null
  form.teamId = null
  form.name = ''
  form.type = 'income'
  form.amount = 0
  form.occurredAt = ''
  form.paymentMethod = ''
  form.paymentName = ''
  form.account = ''
  form.description = ''
  form.images = []

  // 清空删除列表
  deletedImageIds.value = []

  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 关闭对话框
const handleDialogClose = () => {
  resetForm()
}

// 分页相关
const handleSizeChange = async (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1 // 重置到第一页
  await initData()
}

const handleCurrentChange = async (page) => {
  pagination.currentPage = page
  await initData()
}

onMounted(() => {
  initTeamAccounts()
  initData()
})
</script>

<style scoped>
.income-expense-list {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 84px);
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

/* 搜索卡片 - 商务简洁风格 */
.search-card.business-style {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  border: 1px solid #e4e7ed;
}

.business-search-form {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 0;
}

.search-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-end;
}

.search-item {
  margin-bottom: 0;
  margin-right: 8px;
}

.search-item:last-child {
  margin-right: 0;
}

.search-item :deep(.el-form-item__label) {
  font-size: 13px;
  color: #606266;
  padding-right: 8px;
  line-height: 28px;
}

.business-input,
.business-select {
  width: 150px;
  font-size: 13px;
}

.business-input :deep(.el-input__wrapper),
.business-select :deep(.el-input__wrapper) {
  border-radius: 4px;
  min-height: 28px;
}

.business-btn {
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 4px;
  height: 28px;
}

@media screen and (max-width: 1200px) {
  .business-search-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-fields {
    margin-bottom: 12px;
  }
  
  .search-actions {
    margin-left: 0 !important;
    margin-top: 0;
    text-align: right;
  }
  
  .business-input,
  .business-select {
    width: 140px;
  }
}

@media screen and (max-width: 768px) {
  .search-card.business-style {
    padding: 12px;
  }
  
  .search-fields {
    flex-direction: column;
    gap: 8px;
  }
  
  .search-item {
    margin-right: 0;
    margin-bottom: 8px;
  }
  
  .business-input,
  .business-select {
    width: 100%;
  }
  
  .search-actions {
    text-align: center;
    margin-top: 12px;
  }
}

/* 操作栏 */
.action-card {
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 2px 0 rgba(31, 35, 41, 0.08);
  border: 1px solid #e4e7ed;
}

.action-left {
  display: flex;
  gap: 12px;
}

.action-btn.primary {
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  border: none;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}

.action-btn.danger {
  background: linear-gradient(135deg, #f56c6c 0%, #e54545 100%);
  border: none;
  box-shadow: 0 2px 4px rgba(245, 108, 108, 0.3);
}

.action-btn.danger:disabled {
  background: #f5f7fa;
  color: #c0c4cc;
  box-shadow: none;
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

/* 表格卡片 */
.table-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 2px 0 rgba(31, 35, 41, 0.08);
  border: 1px solid #e4e7ed;
}

.table-card .el-table {
  border-radius: 6px;
  overflow: hidden;
}

.table-card .el-table th {
  background-color: #fafbfc;
  color: #1f2329;
  font-weight: 600;
}

.time-text {
  color: #1f2329;
  font-size: 14px;
}

.category-text {
  color: #1f2329;
  background: #f2f3f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.amount-wrapper {
  display: flex;
  align-items: center;
}

.amount-text {
  font-weight: 600;
  font-size: 14px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

.amount-text.income {
  color: #00b42a;
}

.amount-text.expense {
  color: #f53f3f;
}

.account-text {
  color: #1f2329;
  background: #e8f4ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #0e7a0d;
}

.description-text {
  color: #4e5969;
  font-size: 14px;
}

.operator-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.operator-icon {
  color: #86909c;
  font-size: 14px;
}

.operator-name {
  color: #1f2329;
  font-size: 14px;
}

/* 分页 */
.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.custom-pagination {
  --el-pagination-font-size: 14px;
  --el-pagination-bg-color: #ffffff;
  --el-pagination-text-color: #1f2329;
  --el-pagination-border-radius: 6px;
}

/* 对话框样式 */
.record-dialog .el-dialog__body {
  padding: 20px 24px;
}

.record-dialog {
  height: 600px;
  overflow: auto;
}

.record-dialog .el-form-item {
  margin-bottom: 22px;
}

.record-dialog .el-form-item__label {
  font-weight: 600;
  color: #1f2329;
  line-height: 32px;
}

.record-dialog .el-radio {
  margin-right: 24px;
}

.record-dialog .el-radio__label {
  font-weight: 500;
}

/* 对话框中的时间选择器修复 */
.dialog-date-picker {
  width: 100%;
}

.dialog-date-picker .el-date-editor {
  width: 100%;
  height: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: border-color 0.3s;
}

.dialog-date-picker .el-date-editor:hover {
  border-color: #409eff;
}

.dialog-date-picker .el-date-editor.is-active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.dialog-date-picker .el-date-editor .el-input__inner {
  height: 30px;
  line-height: 30px;
  font-size: 14px;
}

.dialog-date-picker .el-date-editor .el-input__prefix {
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.dialog-date-picker .el-date-editor .el-input__suffix {
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

/* 表格新样式 */
.record-name {
  display: flex;
  align-items: center;
}

.name-text {
  color: #1f2329;
  font-weight: 500;
  font-size: 14px;
}

.payer-text {
  color: #1f2329;
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/* 对话框脚注 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .income-expense-list {
    padding: 16px;
  }
  
  .search-card {
    padding: 12px;
    margin-bottom: 12px;
  }
  
  .search-form .el-row {
    margin-bottom: 10px;
  }
  
  .search-form .el-form-item__label {
    font-size: 12px;
    margin-bottom: 3px;
  }
  
  .search-actions {
    text-align: center;
    padding-top: 10px;
  }
  
  .search-btn,
  .reset-btn {
    width: 90px;
    margin: 0 6px;
    padding: 6px 16px;
    font-size: 12px;
  }
  
  .action-card {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    padding: 12px;
  }
  
  .action-left {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .action-right {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .search-card {
    padding: 10px;
  }
  
  .search-title {
    font-size: 13px;
    margin-bottom: 8px;
  }
  
  .search-form .el-form-item__label::before {
    width: 2px;
    height: 8px;
    margin-right: 4px;
  }
}

/* 动画效果 */
.search-card,
.action-card,
.table-card {
  transition: all 0.3s ease;
}

.search-card:hover {
  box-shadow: 0 4px 12px 0 rgba(31, 35, 41, 0.15);
  transform: translateY(-2px);
}

.action-card:hover,
.table-card:hover {
  box-shadow: 0 4px 8px 0 rgba(31, 35, 41, 0.12);
}

.action-btn {
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
}

/* 输入框聚焦动画 */
.search-input .el-input__wrapper,
.search-select .el-select__wrapper,
.search-date-picker .el-date-editor {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 图片上传相关样式 */
.image-upload-container {
  width: 100%;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

/* 图片项目容器 - 支持图片和上传按钮在同一行 */
.image-items-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}

.image-preview-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #e4e7ed;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.image-preview-item:hover {
  border-color: #409eff;
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.image-preview-item:hover .preview-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6));
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
  backdrop-filter: blur(2px);
}

.image-preview-item:hover .image-overlay {
  opacity: 1;
}

.delete-btn {
  background: rgba(245, 63, 63, 0.9) !important;
  border: none !important;
  color: white !important;
  width: 32px !important;
  height: 32px !important;
  border-radius: 50% !important;
  box-shadow: 0 2px 8px rgba(245, 63, 63, 0.3) !important;
  transition: all 0.3s ease !important;
}

.delete-btn:hover {
  background: rgba(245, 63, 63, 1) !important;
  transform: scale(1.1) !important;
  box-shadow: 0 4px 12px rgba(245, 63, 63, 0.4) !important;
}

.image-uploader {
  display: inline-block;
}

.upload-trigger {
  width: 120px;
  height: 120px;
  border: 2px dashed #dcdfe6;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.upload-trigger:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.upload-icon {
  font-size: 24px;
  color: #8c939d;
  margin-bottom: 4px;
}

.upload-trigger:hover .upload-icon {
  color: #409eff;
}

.upload-text {
  font-size: 12px;
  color: #8c939d;
}

.upload-trigger:hover .upload-text {
  color: #409eff;
}

.upload-tips {
  margin-top: 8px;
}

/* 表格中的图片数字序号 */
.image-numbers-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
}

.image-number-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  background: #409eff;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  line-height: 1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.image-number-item:hover {
  background: #1890ff;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.image-number-item:active {
  transform: scale(0.95);
}

.no-image {
  color: #c0c4cc;
  font-size: 12px;
}

</style>