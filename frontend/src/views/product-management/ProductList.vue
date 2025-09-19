<template>
  <div class="product-list">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><List /></el-icon>
        <h2>商品管理</h2>
      </div>
      <div class="page-description">
        管理系统中的所有商品信息
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-card business-style">
      <el-form :model="searchForm" :inline="true" class="business-search-form">
        <div class="search-fields">
          <el-form-item label="商品名称" class="search-item">
            <el-input
              v-model="searchForm.search"
              placeholder="请输入商品名称"
              clearable
              class="business-input"
            />
          </el-form-item>
          <el-form-item label="团队" class="search-item">
            <el-select
              v-model="searchForm.team"
              placeholder="请选择团队"
              clearable
              class="business-select"
              filterable
            >
              <el-option 
                v-for="team in teamOptions" 
                :key="team.value" 
                :label="team.label" 
                :value="team.value" 
              />
            </el-select>
          </el-form-item>
          <el-form-item label="平台" class="search-item">
            <el-select
              v-model="searchForm.platform"
              placeholder="请选择平台"
              clearable
              class="business-select"
              filterable
            >
              <el-option 
                v-for="platform in platformOptions" 
                :key="platform.value" 
                :label="platform.label" 
                :value="platform.value" 
              />
            </el-select>
          </el-form-item>
          <el-form-item label="供应商" class="search-item">
            <el-input
              v-model="searchForm.supplier"
              placeholder="请输入供应商"
              clearable
              class="business-input"
            />
          </el-form-item>
          <el-form-item label="商品ID" class="search-item">
            <el-input
              v-model="searchForm.storeId"
              placeholder="请输入商品ID"
              clearable
              class="business-input"
            />
          </el-form-item>
          <el-form-item label="开始日期" class="search-item">
            <el-date-picker
              v-model="searchForm.startDate"
              type="date"
              placeholder="开始日期"
              class="business-input"
              style="width: 150px"
            />
          </el-form-item>
          <el-form-item label="结束日期" class="search-item">
            <el-date-picker
              v-model="searchForm.endDate"
              type="date"
              placeholder="结束日期"
              class="business-input"
              style="width: 150px"
            />
          </el-form-item>
        </div>
        
        <div class="search-actions">
          <el-button type="primary" @click="handleSearch" :icon="Search" size="small">查询</el-button>
          <el-button @click="handleReset" size="small" style="margin-left: 8px;">重置</el-button>
        </div>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="action-card">
      <div class="action-left">
        <el-button type="primary" @click="handleAddProduct" :icon="Plus" class="action-btn primary" v-if="hasAnyPermission(['product:create','product:manage',])">
          添加商品
        </el-button>
        <el-button
          type="danger"
          @click="handleBatchDelete"
          :disabled="!selectedProducts.length"
          :icon="Delete"
          class="action-btn danger"
          v-if="hasAnyPermission(['product:delete','product:manage'])"
        >
          批量删除
          <span v-if="selectedProducts.length">({{ selectedProducts.length }})</span>
        </el-button>
        <el-button @click="handleExport" :icon="Download" class="action-btn">
          导出数据
          <span v-if="selectedProducts.length">({{ selectedProducts.length }}条)</span>
        </el-button>
        <el-button type="info" @click="showImportDialog = true" :icon="Upload" class="action-btn info" v-if="hasAnyPermission(['product:create','product:manage'])">
          Excel导入
        </el-button>
      </div>
      <div class="action-right">
        <span class="total-count">共 {{ productStore.pagination?.totalRecords || 0 }} 条数据</span>
        <el-tooltip content="刷新数据" placement="top">
          <el-button @click="handleRefresh" :icon="Refresh" circle />
        </el-tooltip>
      </div>
    </div>

    <!-- 表格卡片 -->
    <div class="table-card">
      <el-table
        :data="productStore.products"
        v-loading="productStore.loading"
        @selection-change="handleSelectionChange"
        stripe
        border
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="team" label="团队" width="120" show-overflow-tooltip />
        <el-table-column prop="supplier" label="供应商" min-width="120" show-overflow-tooltip />
        <el-table-column prop="storeName" label="店铺名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="storeId" label="商品ID" min-width="120" show-overflow-tooltip />
        <el-table-column prop="platform" label="平台" width="100" />
        <el-table-column prop="dailyOrderCount" label="当天销售订单数" width="120" />
        <el-table-column prop="dailySalesVolume" label="当天销售盒数" width="120" />
        <el-table-column prop="unitPrice" label="产品单价" width="100">
          <template #default="scope">
            ¥{{ (scope.row.unitPrice || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="dailyTotalProfit" label="当天总盈亏" width="120">
          <template #default="scope">
            <span :class="(scope.row.dailyTotalProfit || 0) >= 0 ? 'profit-positive' : 'profit-negative'">
              ¥{{ (scope.row.dailyTotalProfit || 0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="创建者" width="120">
          <template #default="scope">
            <div class="user-info">
              <div class="user-name">{{ scope.row.createdBy?.username || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="handleEdit(scope.row)" link v-if="hasAnyPermission(['product:update','product:manage',])">
              编辑
            </el-button>
            <!-- <el-button size="small" type="info" @click="handleViewDetail(scope.row)" link>
              详情
            </el-button> -->
            <el-button size="small" type="danger" @click="handleDelete(scope.row)" link v-if="hasAnyPermission(['product:delete','product:manage',])">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="productStore.pagination?.totalRecords || 0"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="custom-pagination"
        />
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingProduct ? '编辑商品' : '添加商品'"
      width="800px"
      append-to-body
      @close="handleDialogClose"
    >
      <el-form
        ref="productFormRef"
        :model="productForm"
        :rules="productRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="productForm.name" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="团队" prop="team">
              <el-autocomplete
                v-model="productForm.team"
                :fetch-suggestions="queryTeamSuggestions"
                placeholder="请输入团队名称"
                style="width: 100%"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplier">
              <el-autocomplete
                v-model="productForm.supplier"
                :fetch-suggestions="querySupplierSuggestions"
                placeholder="请输入供应商"
                style="width: 100%"
                clearable
              />
            </el-form-item>
          </el-col>
           <el-col :span="12">
            <el-form-item label="平台" prop="platform">
              <el-autocomplete
                v-model="productForm.platform"
                :fetch-suggestions="queryPlatformSuggestions"
                placeholder="请输入平台"
                style="width: 100%"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="店铺名称" prop="storeName">
              <el-autocomplete
                v-model="productForm.storeName"
                :fetch-suggestions="queryStoreNameSuggestions"
                placeholder="请输入店铺名称"
                style="width: 100%"
                clearable
              />
            </el-form-item>
          </el-col>
           <el-col :span="12">
             <el-form-item label="商品ID" prop="storeId">
              <el-autocomplete
                v-model="productForm.storeId"
                :fetch-suggestions="queryStoreNameSuggestions"
                placeholder="请输入商品ID"
                style="width: 100%"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-tooltip
              class="box-item"
              effect="dark"
              content="产品成本 = 当天销售盒数 * 产品单价"
              placement="top-start"
            >
              <el-form-item label="产品成本" prop="productCost">
                <el-input
                  v-model="productForm.productCost"
                  style="width: 100%"
                  disabled
                />
              </el-form-item>
            </el-tooltip>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品单价" prop="unitPrice">
              <el-input
                v-model="productForm.unitPrice"
                :min="0"
                :precision="2"
                :step="0.1"
                style="width: 100%"
                @input="calculatedProfit"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="当天销售订单数" prop="dailyOrderCount">
              <el-input
                v-model="productForm.dailyOrderCount"
                :min="0"
                style="width: 100%"
                @input="calculatedProfit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当天销售盒数" prop="dailySalesVolume">
              <el-input
                v-model="productForm.dailySalesVolume"
                style="width: 100%"
                @input="calculatedProfit"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="当天付款金额" prop="dailyPaymentAmount">
              <el-input
                v-model="productForm.dailyPaymentAmount"
                :min="0"
                :precision="2"
                :step="0.01"
                style="width: 100%"
                @input="calculatedProfit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当天消耗金额" prop="dailyConsumedAmount">
              <el-input
                v-model="productForm.dailyConsumedAmount"
                :min="0"
                :precision="2"
                :step="0.01"
                style="width: 100%"
                @input="calculatedProfit"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="售后成本" prop="afterSalesCost">
              <el-input
                v-model="productForm.afterSalesCost"
                :min="0"
                :precision="2"
                :step="0.01"
                style="width: 100%"
                @input="calculatedProfit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="售后金额" prop="afterSalesAmount">
              <el-input
                v-model="productForm.afterSalesAmount"
                :min="0"
                :precision="2"
                :step="0.01"
                style="width: 100%"
                @input="calculatedProfit"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
             <el-form-item label="手续费" prop="handlingFee">
              <el-input
                v-model="productForm.handlingFee"
                :min="0"
                :precision="2"
                :step="0.01"
                style="width: 100%"
                @input="calculatedProfit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品运费" prop="shippingCost">
              <el-input
                v-model="productForm.shippingCost"
                :min="0"
                :precision="2"
                :step="0.1"
                style="width: 100%"
                @input="calculatedProfit"
              />
            </el-form-item>
          </el-col>
          
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-tooltip
              class="box-item"
              effect="dark"
              content="当天总盈亏 = 当天付款金额 - (当天销售盒数 * 产品单价) - 产品运费 - 当天消耗金额 - 手续费 - 售后成本 - 售后金额"
              placement="top-start"
            >
              <el-form-item label="当天总盈亏" prop="handlingFee111">
                <el-input
                  v-model="dailyTotalProfit"
                  style="width: 100%"
                  disabled
                />
              </el-form-item>
            </el-tooltip>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Excel导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="Excel批量导入"
      width="900px"
      append-to-body
      @close="resetImportData"
    >
      <div class="import-container">
        <!-- 步骤1: 文件上传 -->
        <div v-if="!importData.length" class="upload-section">
          <div class="upload-tips">
            <h4>导入说明：</h4>
            <ul>
              <li>支持 Excel (.xlsx, .xls) 和 CSV 文件格式</li>
              <li><strong>必填字段：</strong>商品名称</li>
              <li><strong>基本信息：</strong>团队、供应商、店铺名称、商品ID、平台</li>
              <li><strong>销售数据：</strong>当天销售订单数、当天销售盒数</li>
              <li><strong>财务数据：</strong>产品单价、当天付款金额、产品运费、当天消耗金额、手续费、售后金额、售后成本</li>
              <li><strong>自动计算：</strong>产品成本（销售盒数×单价）、当天总盈亏（付款金额-各项成本费用）</li>
              <li>数字字段仅支持非负数</li>
              <li>建议先下载模板，按格式填写数据</li>
            </ul>

            <div class="template-download">
              <el-button type="primary" @click="downloadTemplate" :icon="Download">
                下载导入模板
              </el-button>
            </div>
          </div>

          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleFileUpload"
            :show-file-list="false"
            accept=".xlsx,.xls,.csv"
          >
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .xlsx, .xls, .csv 格式文件
              </div>
            </template>
          </el-upload>
        </div>

        <!-- 步骤2: 数据预览 -->
        <div v-else class="preview-section">
          <div class="preview-header">
            <h4>数据预览 (共 {{ importData.length }} 条记录)</h4>
            <div class="preview-actions">
              <el-button @click="resetImportData" :icon="Refresh">重新上传</el-button>
            </div>
          </div>

          <el-table
            :data="importData.slice(0, 10)"
            border
            stripe
            max-height="400"
            class="preview-table"
          >
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="name" label="商品名称" min-width="120" />
            <el-table-column prop="team" label="团队" width="80" />
            <el-table-column prop="supplier" label="供应商" min-width="100" />
            <el-table-column prop="storeName" label="店铺名称" min-width="120" />
            <el-table-column prop="storeId" label="商品ID" min-width="100" />
            <el-table-column prop="platform" label="平台" width="80" />
            <el-table-column prop="dailyOrderCount" label="当天销售订单数" width="120" align="right" />
            <el-table-column prop="dailySalesVolume" label="当天销售盒数" width="120" align="right" />
            <el-table-column prop="unitPrice" label="产品单价" width="100" align="right">
              <template #default="{ row }">
                ¥{{ row.unitPrice?.toFixed(2) || '0.00' }}
              </template>
            </el-table-column>
            <el-table-column prop="dailyPaymentAmount" label="当天付款金额" width="120" align="right">
              <template #default="{ row }">
                ¥{{ row.dailyPaymentAmount?.toFixed(2) || '0.00' }}
              </template>
            </el-table-column>
            <el-table-column prop="shippingCost" label="产品运费" width="100" align="right">
              <template #default="{ row }">
                ¥{{ row.shippingCost?.toFixed(2) || '0.00' }}
              </template>
            </el-table-column>
            <el-table-column prop="dailyConsumedAmount" label="当天消耗金额" width="120" align="right">
              <template #default="{ row }">
                ¥{{ row.dailyConsumedAmount?.toFixed(2) || '0.00' }}
              </template>
            </el-table-column>
            <el-table-column prop="handlingFee" label="手续费" width="80" align="right">
              <template #default="{ row }">
                ¥{{ row.handlingFee?.toFixed(2) || '0.00' }}
              </template>
            </el-table-column>
            <el-table-column prop="afterSalesAmount" label="售后金额" width="100" align="right">
              <template #default="{ row }">
                ¥{{ row.afterSalesAmount?.toFixed(2) || '0.00' }}
              </template>
            </el-table-column>
            <el-table-column prop="afterSalesCost" label="售后成本" width="100" align="right">
              <template #default="{ row }">
                ¥{{ row.afterSalesCost?.toFixed(2) || '0.00' }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="备注" min-width="100" />
          </el-table>

          <div v-if="importData.length > 10" class="preview-more">
            <el-alert
              :title="`仅显示前10条记录，实际将导入 ${importData.length} 条记录`"
              type="info"
              :closable="false"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showImportDialog = false">取消</el-button>
          <el-button
            v-if="importData.length > 0"
            type="primary"
            @click="handleImportConfirm"
            :loading="importSubmitting"
          >
            确认导入 ({{ importData.length }} 条)
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup >
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  List,
  Delete,
  Download,
  Upload,
  Search
} from '@element-plus/icons-vue'
import { useProductStore } from '../../stores/product'
import { precisionCalculate } from '@/utils/precision'
import hasAnyPermission from '@/utils/checkPermissions'
import {
  readProductExcelFile,
  validateProductImportHeaders,
  transformProductImportData,
  validateProductImportData,
  generateProductImportTemplate,
  exportProductToCSV,
  exportProductToExcel,
  downloadProductImportTemplate
} from '../../utils/productExcelUtils'

// 使用 Pinia store
const productStore = useProductStore()

// 响应式数据
const submitting = ref(false)
const showAddDialog = ref(false)
const showImportDialog = ref(false)
const editingProduct = ref(null)
const productFormRef = ref()
const currentPage = ref(1)
const pageSize = ref(20)
const dailyTotalProfit = ref(0)
const selectedProducts = ref([])
const importSubmitting = ref(false)

// Excel导入相关数据
const importData = ref([])
const importColumns = ref([])
const importFile = ref(null)

// 搜索表单
const searchForm = reactive({
  search: '',
  team: '',
  platform: '',
  supplier: '',
  storeId: '',
  minProfit: undefined ,
  maxProfit: undefined ,
  startDate: '',
  endDate: ''
})

// 商品表单
const productForm = reactive({
  name: '',
  team: '',
  supplier: '',
  storeName: '',
  storeId: '',
  platform: '',
  dailyOrderCount: 0,
  dailySalesVolume: 0,
  dailyPaymentAmount: 0,
  unitPrice: 0,
  productCost: 0,
  shippingCost: 0,
  dailyConsumedAmount: 0,
  handlingFee: 0,
  afterSalesAmount: 0,
  afterSalesCost: 0,
})

// 表单验证规则
const productRules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '商品名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  team: [
    { required: true, message: '请输入团队名称', trigger: 'blur' }
  ],
  supplier: [
    { required: true, message: '请输入供应商', trigger: 'blur' }
  ],
  storeName: [
    { required: true, message: '请输入店铺名称', trigger: 'blur' }
  ],
  platform: [
    { required: true, message: '请选择平台', trigger: 'change' }
  ],
 
}

// 计算总盈亏
const calculatedProfit = () => {
  // 产品成本计算
  productForm.productCost = precisionCalculate.multiply(
    productForm.dailySalesVolume || 0, 
    productForm.unitPrice || 0
  )
  
  // 当天总盈亏计算
  dailyTotalProfit.value = precisionCalculate.subtract(
    productForm.dailyPaymentAmount || 0,
    productForm.productCost || 0,
    productForm.shippingCost || 0,
    productForm.dailyConsumedAmount || 0,
    productForm.handlingFee || 0,
    productForm.afterSalesCost || 0,
    productForm.afterSalesAmount || 0
  )
}

// 计算属性
const teamOptions = computed(() => {
  try {
    return productStore.teamOptions || []
  } catch (error) {
    return []
  }
})
const platformOptions = computed(() => productStore.platformOptions || [])

// 监听分页变化
watch([currentPage, pageSize], () => {
  fetchData()
})

// 方法
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleString('zh-CN')
  } catch (error) {
    return '-'
  }
}

const fetchData = async () => {
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...searchForm,
      startDate: searchForm.startDate ? new Date(searchForm.startDate).toISOString() : undefined,
      endDate: searchForm.endDate ? new Date(searchForm.endDate).toISOString() : undefined
    }

    // 清理空值
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key]
      }
    })

    const result = await productStore.fetchProducts(params)

    if (!result.success) {
      ElMessage.error(result.message || '获取商品数据失败')
    }
  } catch (error) {
    ElMessage.error('获取商品数据失败')
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

const handleReset = () => {
  searchForm.search = ''
  searchForm.team = ''
  searchForm.platform = ''
  searchForm.supplier = ''
  searchForm.storeId = ''
  searchForm.minProfit = undefined
  searchForm.maxProfit = undefined
  searchForm.startDate = ''
  searchForm.endDate = ''
  currentPage.value = 1
  fetchData()
}

const handleRefresh = () => {
  fetchData()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedProducts.value = selection
}

// 批量删除
const handleBatchDelete = async () => {
  if (!selectedProducts.value.length) {
    ElMessage.warning('请选择要删除的商品')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedProducts.value.length} 个商品吗？此操作不可恢复！`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 批量删除需要逐个删除
    for (const product of selectedProducts.value) {
      const result = await productStore.deleteProduct(product._id)
      if (!result.success) {
        ElMessage.error(`删除商品"${product.name}"失败: ${result.error}`)
        return
      }
    }

    ElMessage.success('批量删除成功')
    selectedProducts.value = []
    fetchData() // 重新获取数据
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 导出数据
const handleExport = async () => {
  try {
    // 优先导出勾选的数据，如果没有勾选则导出所有数据
    const exportData = selectedProducts.value.length > 0 ? selectedProducts.value : productStore.products

    if (exportData.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    const data = exportData.map(item => ({
      '商品名称': item.name || '',
      '团队': item.team || '',
      '供应商': item.supplier || '',
      '店铺名称': item.storeName || '',
      '商品ID': item.storeId || '',
      '平台': item.platform || '',
      '当天销售订单数': item.dailyOrderCount || 0,
      '当天销售盒数': item.dailySalesVolume || 0,
      '产品单价': `¥${(item.unitPrice || 0).toFixed(2)}`,
      '当天总盈亏': `¥${(item.dailyTotalProfit || 0).toFixed(2)}`,
      '当天付款金额': `¥${(item.dailyPaymentAmount || 0).toFixed(2)}`,
      '产品成本': `¥${(item.productCost || 0).toFixed(2)}`,
      '产品运费': `¥${(item.shippingCost || 0).toFixed(2)}`,
      '当天消耗金额': `¥${(item.dailyConsumedAmount || 0).toFixed(2)}`,
      '手续费': `¥${(item.handlingFee || 0).toFixed(2)}`,
      '售后金额': `¥${(item.afterSalesAmount || 0).toFixed(2)}`,
      '售后成本': `¥${(item.afterSalesCost || 0).toFixed(2)}`,
      '创建者': item.createdBy?.username || '',
      '创建时间': item.createdAt ? formatDate(item.createdAt) : ''
    }))

    // 使用 Excel 格式导出
    const headers = Object.keys(data[0])
    const exportType = selectedProducts.value.length > 0 ? `勾选${selectedProducts.value.length}条` : '全部'
    const filename = `商品数据_${exportType}_${new Date().toLocaleDateString().replace(/\//g, '-')}`

    try {
      // 尝试导出为 Excel 格式
      exportProductToExcel(data, headers, filename, '商品数据')
      const exportTypeMsg = selectedProducts.value.length > 0 ? `勾选的${selectedProducts.value.length}条数据` : '全部数据'
      ElMessage.success(`导出${exportTypeMsg}成功（Excel格式）`)
    } catch (excelError) {
      // 如果 Excel 导出失败，降级到 CSV
      console.warn('Excel导出失败，使用CSV格式：', excelError.message)

      const csvContent = exportProductToCSV(data, headers)

      // 添加BOM以支持Excel正确显示中文
      const bom = '\uFEFF'
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const exportTypeMsg = selectedProducts.value.length > 0 ? `勾选的${selectedProducts.value.length}条数据` : '全部数据'
      ElMessage.success(`导出${exportTypeMsg}成功（CSV格式）`)
    }
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const handleSizeChange = (size) => {
  pageSize.value = size
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

const resetForm = () => {
  productForm.name = ''
  productForm.team = ''
  productForm.supplier = ''
  productForm.storeName = ''
  productForm.platform = ''
  productForm.dailyOrderCount = 0
  productForm.dailySalesVolume = 0
  productForm.dailyPaymentAmount = 0
  productForm.unitPrice = 0
  productForm.productCost = 0
  productForm.shippingCost = 0
  productForm.dailyConsumedAmount = 0
  productForm.handlingFee = 0
  productForm.afterSalesAmount = 0
  productForm.afterSalesCost = 0
}

const handleAddProduct = async () => {
  // 加载建议数据（如果尚未加载）
  await productStore.fetchProductSuggestions()
  
  // 重置表单并打开对话框
  resetForm()
  editingProduct.value = null
  showAddDialog.value = true
}

const handleEdit = async (product) => {
  // 加载建议数据（如果尚未加载）
  await productStore.fetchProductSuggestions()
  
  editingProduct.value = product
  productForm.name = product.name || ''
  productForm.team = product.team || ''
  productForm.supplier = product.supplier || ''
  productForm.storeName = product.storeName || ''
  productForm.storeId = product.storeId || ''
  productForm.platform = product.platform || ''
  productForm.dailyOrderCount = product.dailyOrderCount || 0
  productForm.dailySalesVolume = product.dailySalesVolume || 0
  productForm.dailyPaymentAmount = product.dailyPaymentAmount || 0
  productForm.unitPrice = product.unitPrice || 0
  productForm.productCost = product.productCost || 0
  productForm.shippingCost = product.shippingCost || 0
  productForm.dailyConsumedAmount = product.dailyConsumedAmount || 0
  productForm.handlingFee = product.handlingFee || 0
  productForm.afterSalesAmount = product.afterSalesAmount || 0
  productForm.afterSalesCost = product.afterSalesCost || 0
  showAddDialog.value = true
  calculatedProfit()
}

// const handleViewDetail = async (product: Product) => {
//   try {
//     const result = await productStore.getProductById(product._id)
//     if (result.success && result.data) {
//       // 显示详情对话框或跳转到详情页
//     } else {
//       ElMessage.error(result.error || '获取商品详情失败')
//     }
//   } catch (error) {
//     ElMessage.error('获取商品详情失败')
//   }
// }

const handleDelete = async (product) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除商品"${product.name}"吗？此操作不可恢复！`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await productStore.deleteProduct(product._id)
    if (result.success) {
      ElMessage.success('删除成功')
      fetchData() // 重新获取数据
    } else {
      ElMessage.error(result.error || '删除失败')
    }
  } catch {
    // 用户取消操作
  }
}

const handleSubmit = async () => {
  if (!productFormRef.value) return
  
  try {
    await productFormRef.value.validate()
    submitting.value = true
    
    let result
    if (editingProduct.value) {
      // 编辑模式
      result = await productStore.updateProduct(editingProduct.value._id, productForm)
      if (result.success) {
        ElMessage.success('编辑成功')
      } else {
        ElMessage.error(result.error || '编辑失败')
      }
    } else {
      // 新增模式
      result = await productStore.addProduct(productForm)
      if (result.success) {
        ElMessage.success('添加成功')
      } else {
        ElMessage.error(result.error || '添加失败')
      }
    }
    
    if (result.success) {
      showAddDialog.value = false
      fetchData() // 重新获取数据
    }
  } catch {
    // 验证失败
  } finally {
    submitting.value = false
  }
}

const handleDialogClose = () => {
  editingProduct.value = null
  resetForm()
  productFormRef.value?.resetFields()
}

// 自动补全查询方法
const queryTeamSuggestions = (queryString, cb ) => {
  const suggestions = (productStore.suggestions?.teams || [])
    .filter(team => team.toLowerCase().includes(queryString.toLowerCase()))
    .map(team => ({ value: team }))
  cb(suggestions)
}

const querySupplierSuggestions = (queryString, cb) => {
  const suggestions = (productStore.suggestions?.suppliers || [])
    .filter(supplier => supplier.toLowerCase().includes(queryString.toLowerCase()))
    .map(supplier => ({ value: supplier }))
  cb(suggestions)
}

const queryStoreNameSuggestions = (queryString, cb) => {
  const suggestions = (productStore.suggestions?.storeNames || [])
    .filter(storeName => storeName.toLowerCase().includes(queryString.toLowerCase()))
    .map(storeName => ({ value: storeName }))
  cb(suggestions)
}

const queryPlatformSuggestions = (queryString, cb) => {
  const suggestions = (productStore.suggestions?.platforms || [])
    .filter(platform => platform.toLowerCase().includes(queryString.toLowerCase()))
    .map(platform => ({ value: platform }))
  cb(suggestions)
}

// Excel导入相关方法
// 处理文件上传
const handleFileUpload = async (file) => {
  try {
    importSubmitting.value = true

    // 读取Excel文件
    const result = await readProductExcelFile(file.raw)

    // 验证表头
    const headerValidation = validateProductImportHeaders(result.headers)

    if (!headerValidation.isValid) {
      ElMessage.error(`缺少必填字段: ${headerValidation.missingRequired.join(', ')}`)
      return false
    }

    // 转换数据格式
    const transformedData = transformProductImportData(result.data, headerValidation.mappedFields)

    // 验证数据
    const dataValidation = validateProductImportData(transformedData)

    // 保存导入数据
    importData.value = dataValidation.validRows
    importColumns.value = result.headers
    importFile.value = file.raw

    // 显示验证结果
    if (dataValidation.errors.length > 0) {
      ElMessage.warning(`发现 ${dataValidation.errors.length} 行数据有错误，已自动过滤`)
    }

    if (dataValidation.warnings.length > 0) {
      ElMessage.warning(`发现 ${dataValidation.warnings.length} 行数据有警告`)
    }

    ElMessage.success(`成功解析 ${dataValidation.validRowCount} 行有效数据`)

    return false // 阻止自动上传
  } catch (error) {
    ElMessage.error('文件解析失败: ' + error.message)
    return false
  } finally {
    importSubmitting.value = false
  }
}

// 确认导入数据
const handleImportConfirm = async () => {
  if (!importData.value || importData.value.length === 0) {
    ElMessage.error('没有可导入的数据')
    return
  }

  try {
    importSubmitting.value = true

    // 使用批量创建接口
    const result = await productStore.batchAddProducts(importData.value)

    if (result.success) {
      ElMessage.success(result.message)
      showImportDialog.value = false
      resetImportData()
      // 重新加载数据
      fetchData()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('导入失败: ' + error.message)
  } finally {
    importSubmitting.value = false
  }
}

// 重置导入数据
const resetImportData = () => {
  importData.value = []
  importColumns.value = []
  importFile.value = null
}

// 下载导入模板
const downloadTemplate = () => {
  try {
    // 使用新的 Excel 导出功能
    downloadProductImportTemplate('商品导入模板')
    ElMessage.success('模板下载成功')
  } catch (error) {
    ElMessage.error('模板下载失败：' + error.message)
  }
}

// 生命周期
onMounted(async () => {
  // 获取商品数据
  fetchData()
})
</script>

<style scoped>
/* 商务简洁风格样式 */
.search-card.business-style {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  flex-wrap: wrap;
}

.search-item {
  margin: 0 !important;
  margin-right: 0 !important;
}

.business-input,
.business-select {
  width: 150px !important;
  height: 28px !important;
  font-size: 13px !important;
}

.business-input .el-input__inner,
.business-select .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
  font-size: 13px !important;
}

.search-actions {
  display: flex;
  gap: 8px;
  align-self: flex-start;
}

.business-btn {
  height: 28px !important;
  padding: 0 12px !important;
  font-size: 13px !important;
  border-radius: 4px !important;
}

/* 响应式布局 */
@media screen and (max-width: 1200px) {
  .search-fields {
    width: 100%;
  }

  .search-actions {
    align-self: flex-start;
  }
}

@media screen and (max-width: 768px) {
  .search-fields {
    flex-direction: column;
  }

  .search-item {
    width: 100%;
  }

  .business-input,
  .business-select {
    width: 100% !important;
  }

  .search-actions {
    align-self: flex-start;
  }
}

/* 原有的其他样式 */
.product-list {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
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

.table-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.profit-positive {
  color: #00b42a;
}

.profit-negative {
  color: #f53f3f;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 500;
  font-size: 13px;
}

.user-account {
  font-size: 12px;
  color: #666;
}

.pagination-wrapper {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
}

.action-btn.info {
  background: linear-gradient(135deg, #909399 0%, #b1b3b8 100%);
  border: none;
  color: white;
}

/* Excel导入样式 */
.import-container {
  .upload-section {
    .upload-tips {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 6px;

      h4 {
        margin: 0 0 10px 0;
        color: #303133;
      }

      ul {
        margin: 0;
        padding-left: 20px;

        li {
          margin-bottom: 5px;
          color: #606266;
        }
      }

      .template-download {
        margin-top: 15px;
        text-align: center;
      }
    }

    .upload-demo {
      margin-top: 20px;
    }
  }

  .preview-section {
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;

      h4 {
        margin: 0;
        color: #303133;
      }
    }

    .preview-more {
      margin-top: 15px;
    }
  }
}
</style>
