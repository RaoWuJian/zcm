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
          <el-form-item label="店铺ID" class="search-item">
            <el-input
              v-model="searchForm.storeId"
              placeholder="请输入店铺ID"
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
        
        <div class="search-actions" style="margin-left: 8px; margin-right: 0;">
          <el-button type="primary" @click="handleSearch" class="business-btn" size="small">查询</el-button>
          <el-button @click="handleReset" class="business-btn" size="small" style="margin-left: 8px;">重置</el-button>
        </div>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="action-card">
      <div class="action-left">
        <el-button type="primary" @click="handleAddProduct" :icon="Plus" class="action-btn primary">
          添加商品
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
        stripe
        border
      >
        <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="team" label="团队" width="120" show-overflow-tooltip />
        <el-table-column prop="supplier" label="供应商" min-width="120" show-overflow-tooltip />
        <el-table-column prop="storeName" label="店铺名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="storeId" label="店铺Id" min-width="120" show-overflow-tooltip />
        <el-table-column prop="platform" label="平台" width="100" />
        <el-table-column prop="dailyOrderCount" label="订单数" width="80" />
        <el-table-column prop="dailySalesVolume" label="销量" width="80" />
        <el-table-column prop="unitPrice" label="单价" width="100">
          <template #default="scope">
            ¥{{ (scope.row.unitPrice || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="dailyTotalProfit" label="日利润" width="100">
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
              <div class="user-account">{{ scope.row.createdBy?.loginAccount || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="handleEdit(scope.row)" link>
              编辑
            </el-button>
            <!-- <el-button size="small" type="info" @click="handleViewDetail(scope.row)" link>
              详情
            </el-button> -->
            <el-button size="small" type="danger" @click="handleDelete(scope.row)" link>
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
             <el-form-item label="店铺ID" prop="storeId">
              <el-autocomplete
                v-model="productForm.storeId"
                :fetch-suggestions="queryStoreNameSuggestions"
                placeholder="请输入店铺ID"
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
              content="当天总盈亏 = 当天付款金额 - (当天销售盒数 * 产品单价) - 产品运费 - 当天消耗金额 - 手续费"
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
  </div>
</template>

<script setup >
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, 
  Refresh, 
  List 
} from '@element-plus/icons-vue'
import { useProductStore } from '../../stores/product'

// 使用 Pinia store
const productStore = useProductStore()

// 响应式数据
const submitting = ref(false)
const showAddDialog = ref(false)
const editingProduct = ref(null)
const productFormRef = ref()
const currentPage = ref(1)
const pageSize = ref(20)
const dailyTotalProfit = ref(0)

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
  // 产品成本 = 当天销售盒数 * 产品单价
  // 当天总盈亏 = 当天付款金额 - (当天销售盒数 * 产品单价) - 产品运费 - 当天消耗金额 - 手续费
  productForm.productCost = (productForm.dailySalesVolume || 0) * (productForm.unitPrice || 0)
  dailyTotalProfit.value = (productForm.dailyPaymentAmount || 0) - (productForm.productCost || 0) - (productForm.shippingCost || 0) - (productForm.dailyConsumedAmount || 0) - (productForm.handlingFee || 0)

}

// 计算属性
const teamOptions = computed(() => {
  try {
    return productStore.teamOptions || []
  } catch (error) {
    console.error('获取团队选项失败:', error)
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

    console.log('Fetching products with params:', params)
    const result = await productStore.fetchProducts(params)
    console.log('Fetch result:', result)
    console.log('Products in store:', productStore.products)

    if (!result.success) {
      ElMessage.error(result.message || '获取商品数据失败')
    }
  } catch (error) {
    console.error('获取商品数据失败:', error)
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
}

// const handleViewDetail = async (product: Product) => {
//   try {
//     const result = await productStore.getProductById(product._id)
//     if (result.success && result.data) {
//       // 显示详情对话框或跳转到详情页
//       console.log('商品详情:', result.data)
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
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
}

.search-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

.business-btn {
  height: 28px !important;
  padding: 0 12px !important;
  font-size: 13px !important;
  border-radius: 4px !important;
}

/* 响应式布局 */
@media screen and (max-width: 1200px) {
  .business-search-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-fields {
    width: 100%;
  }
  
  .search-actions {
    margin-left: 0 !important;
    margin-top: 8px;
    width: 100%;
    display: flex;
    justify-content: flex-end;
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
    flex-direction: column;
    align-items: stretch;
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
</style>