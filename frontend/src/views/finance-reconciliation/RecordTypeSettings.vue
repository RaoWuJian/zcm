<template>
  <div class="record-type-settings">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><Setting /></el-icon>
        <h2>类型设置</h2>
      </div>
      <div class="page-description">
        管理收支记录的类型分类，包括大类和小类的设置
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="action-card">
      <div class="action-left">
        <el-button type="primary" @click="handleAddCategory" :icon="Plus" class="action-btn primary">
          新增大类
        </el-button>
        <el-button type="success" @click="handleAddSubCategory" :icon="Plus" class="action-btn success" :disabled="!selectedCategory">
          新增小类
        </el-button>
        <el-button @click="handleRefresh" :icon="Refresh" class="action-btn">
          刷新数据
        </el-button>
      </div>
      <div class="action-right">
        <span class="total-count">共 {{ categories.length }} 个大类</span>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-container">
      <!-- 左侧大类列表 -->
      <div class="category-panel">
        <div class="panel-header">
          <h3>记录大类</h3>
          <span class="item-count">{{ filteredCategories.length }}/{{ categories.length }} 项</span>
        </div>
        <div class="search-box">
          <el-input
            v-model="categorySearchText"
            placeholder="搜索大类..."
            :prefix-icon="Search"
            clearable
            size="small"
          />
        </div>
        <div class="category-list" ref="categoryListRef">
          <div
            v-for="category in filteredCategories"
            :key="category._id"
            class="category-item"
            :class="{ active: selectedCategory?._id === category._id }"
            @click="selectCategory(category)"
          >
            <div class="category-info">
              <div class="category-name">{{ category.name }}</div>
              <div class="category-desc">{{ category.description || '暂无描述' }}</div>
            </div>
            <div class="category-actions">
              <el-button size="small" type="primary" @click.stop="handleEditCategory(category)" link>
                编辑
              </el-button>
              <el-button size="small" type="danger" @click.stop="handleDeleteCategory(category)" link>
                删除
              </el-button>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="categories.length === 0" class="empty-state">
            <el-empty description="暂无大类数据" />
          </div>
          <div v-else-if="filteredCategories.length === 0" class="empty-state">
            <el-empty description="没有找到匹配的大类" />
          </div>
        </div>
      </div>

      <!-- 右侧小类列表 -->
      <div class="subcategory-panel">
        <div class="panel-header">
          <h3>记录小类</h3>
          <div v-if="selectedCategory" class="header-right">
            <span class="selected-category">
              当前大类：{{ selectedCategory.name }}
            </span>
            <span class="item-count">{{ selectedCategory.subCategories?.length || 0 }} 项</span>
          </div>
        </div>
        <div class="subcategory-list" v-if="selectedCategory" ref="subcategoryListRef">
          <div
            v-for="subCategory in selectedCategory.subCategories"
            :key="subCategory._id"
            class="subcategory-item"
          >
            <div class="subcategory-info">
              <div class="subcategory-name">{{ subCategory.name }}</div>
              <div class="subcategory-desc">{{ subCategory.description || '暂无描述' }}</div>
            </div>
            <div class="subcategory-actions">
              <el-button size="small" type="primary" @click="handleEditSubCategory(subCategory)" link>
                编辑
              </el-button>
              <el-button size="small" type="danger" @click="handleDeleteSubCategory(subCategory)" link>
                删除
              </el-button>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="!selectedCategory.subCategories || selectedCategory.subCategories.length === 0" class="empty-state">
            <el-empty description="暂无小类数据" />
          </div>
        </div>
        <div v-else class="no-selection">
          <el-empty description="请先选择一个大类" />
        </div>
      </div>
    </div>

    <!-- 新增/编辑大类对话框 -->
    <el-dialog
      v-model="categoryDialogVisible"
      :title="categoryDialogTitle"
      width="500px"
      append-to-body
      @close="handleCategoryDialogClose"
    >
      <el-form :model="categoryForm" :rules="categoryRules" ref="categoryFormRef" label-width="80px">
        <el-form-item label="大类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入大类名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="categoryForm.sort"
            :min="0"
            placeholder="排序值"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="categoryDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCategorySubmit" :loading="categorySubmitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 新增/编辑小类对话框 -->
    <el-dialog
      v-model="subCategoryDialogVisible"
      :title="subCategoryDialogTitle"
      width="500px"
      append-to-body
      @close="handleSubCategoryDialogClose"
    >
      <el-form :model="subCategoryForm" :rules="subCategoryRules" ref="subCategoryFormRef" label-width="80px">
        <el-form-item label="所属大类">
          <el-input :value="selectedCategory?.name" disabled />
        </el-form-item>
        <el-form-item label="小类名称" prop="name">
          <el-input v-model="subCategoryForm.name" placeholder="请输入小类名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="subCategoryForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="subCategoryForm.sort"
            :min="0"
            placeholder="排序值"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="subCategoryDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubCategorySubmit" :loading="subCategorySubmitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Setting, Search } from '@element-plus/icons-vue'
import { recordTypeApi } from '@/api/index'

// 响应式数据
const loading = ref(false)
const categories = ref([])
const selectedCategory = ref(null)

// DOM引用
const categoryListRef = ref(null)
const subcategoryListRef = ref(null)

// 搜索相关
const categorySearchText = ref('')

// 过滤后的分类列表
const filteredCategories = computed(() => {
  if (!categorySearchText.value.trim()) {
    return categories.value
  }

  const searchText = categorySearchText.value.toLowerCase().trim()
  return categories.value.filter(category =>
    category.name.toLowerCase().includes(searchText) ||
    (category.description && category.description.toLowerCase().includes(searchText))
  )
})

// 大类对话框相关
const categoryDialogVisible = ref(false)
const categoryDialogTitle = ref('新增大类')
const categoryFormRef = ref()
const categorySubmitLoading = ref(false)

// 小类对话框相关
const subCategoryDialogVisible = ref(false)
const subCategoryDialogTitle = ref('新增小类')
const subCategoryFormRef = ref()
const subCategorySubmitLoading = ref(false)

// 大类表单数据
const categoryForm = reactive({
  _id: null,
  name: '',
  description: '',
  sort: 0
})

// 小类表单数据
const subCategoryForm = reactive({
  _id: null,
  name: '',
  description: '',
  sort: 0
})

// 表单验证规则
const categoryRules = {
  name: [{ required: true, message: '请输入大类名称', trigger: 'blur' }]
}

const subCategoryRules = {
  name: [{ required: true, message: '请输入小类名称', trigger: 'blur' }]
}

// 初始化数据
const initData = async () => {
  try {
    loading.value = true
    const response = await recordTypeApi.getRecordTypes()
    if (response.success) {
      categories.value = response.data || []
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 选择大类
const selectCategory = (category) => {
  selectedCategory.value = category
  // 选择大类时，滚动小类列表到顶部
  setTimeout(() => {
    if (subcategoryListRef.value) {
      subcategoryListRef.value.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }, 100)
}

// 刷新数据
const handleRefresh = async () => {
  await initData()
  ElMessage.success('数据刷新成功')
}

// 滚动到顶部功能
const scrollToTop = (listRef) => {
  if (listRef.value) {
    listRef.value.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}

// 新增大类
const handleAddCategory = () => {
  categoryDialogTitle.value = '新增大类'
  resetCategoryForm()
  categoryDialogVisible.value = true
}

// 编辑大类
const handleEditCategory = (category) => {
  categoryDialogTitle.value = '编辑大类'
  Object.assign(categoryForm, category)
  categoryDialogVisible.value = true
}

// 删除大类
const handleDeleteCategory = async (category) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除大类"${category.name}"吗？删除后其下的所有小类也将被删除。`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await recordTypeApi.deleteRecordType(category._id)
    if (response.success) {
      ElMessage.success('删除成功')

      // 从列表中移除被删除的大类
      const categoryIndex = categories.value.findIndex(c => c._id === category._id)
      if (categoryIndex !== -1) {
        categories.value.splice(categoryIndex, 1)
      }

      // 如果删除的是当前选中的大类，清空选中状态
      if (selectedCategory.value && selectedCategory.value._id === category._id) {
        selectedCategory.value = null
      }
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 新增小类
const handleAddSubCategory = () => {
  if (!selectedCategory.value) {
    ElMessage.warning('请先选择一个大类')
    return
  }
  subCategoryDialogTitle.value = '新增小类'
  resetSubCategoryForm()
  subCategoryDialogVisible.value = true
}

// 编辑小类
const handleEditSubCategory = (subCategory) => {
  subCategoryDialogTitle.value = '编辑小类'
  Object.assign(subCategoryForm, subCategory)
  subCategoryDialogVisible.value = true
}

// 删除小类
const handleDeleteSubCategory = async (subCategory) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除小类"${subCategory.name}"吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await recordTypeApi.deleteSubCategory(
      selectedCategory.value._id, 
      subCategory._id
    )
    
    if (response.success) {
      ElMessage.success('删除成功')

      // 更新当前选中大类的数据，保持选中状态
      const updatedCategory = response.data
      const categoryIndex = categories.value.findIndex(c => c._id === selectedCategory.value._id)
      if (categoryIndex !== -1) {
        categories.value[categoryIndex] = updatedCategory
        selectedCategory.value = updatedCategory
      }
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 提交大类表单
const handleCategorySubmit = async () => {
  if (!categoryFormRef.value) return
  
  await categoryFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        categorySubmitLoading.value = true
        
        let response
        if (categoryForm._id) {
          response = await recordTypeApi.updateRecordType(categoryForm._id, categoryForm)
        } else {
          response = await recordTypeApi.createRecordType(categoryForm)
        }
        
        if (response.success) {
          ElMessage.success(categoryForm._id ? '更新成功' : '创建成功')
          categoryDialogVisible.value = false

          if (categoryForm._id) {
            // 更新现有大类
            const categoryIndex = categories.value.findIndex(c => c._id === categoryForm._id)
            if (categoryIndex !== -1) {
              categories.value[categoryIndex] = response.data
              // 如果当前选中的是被更新的大类，也要更新选中状态
              if (selectedCategory.value && selectedCategory.value._id === categoryForm._id) {
                selectedCategory.value = response.data
              }
            }
          } else {
            // 新增大类
            categories.value.push(response.data)
          }
        } else {
          ElMessage.error(response.message || '操作失败')
        }
      } catch (error) {
        ElMessage.error('操作失败')
      } finally {
        categorySubmitLoading.value = false
      }
    }
  })
}

// 提交小类表单
const handleSubCategorySubmit = async () => {
  if (!subCategoryFormRef.value) return
  
  await subCategoryFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        subCategorySubmitLoading.value = true
        
        let response
        if (subCategoryForm._id) {
          response = await recordTypeApi.updateSubCategory(
            selectedCategory.value._id, 
            subCategoryForm._id, 
            subCategoryForm
          )
        } else {
          response = await recordTypeApi.addSubCategory(selectedCategory.value._id, subCategoryForm)
        }
        
        if (response.success) {
          ElMessage.success(subCategoryForm._id ? '更新成功' : '创建成功')
          subCategoryDialogVisible.value = false

          // 更新当前选中大类的数据，保持选中状态
          const updatedCategory = response.data
          const categoryIndex = categories.value.findIndex(c => c._id === selectedCategory.value._id)
          if (categoryIndex !== -1) {
            categories.value[categoryIndex] = updatedCategory
            selectedCategory.value = updatedCategory
          }
        } else {
          ElMessage.error(response.message || '操作失败')
        }
      } catch (error) {
        ElMessage.error('操作失败')
      } finally {
        subCategorySubmitLoading.value = false
      }
    }
  })
}

// 重置大类表单
const resetCategoryForm = () => {
  categoryForm._id = null
  categoryForm.name = ''
  categoryForm.description = ''
  categoryForm.sort = 0
  
  if (categoryFormRef.value) {
    categoryFormRef.value.clearValidate()
  }
}

// 重置小类表单
const resetSubCategoryForm = () => {
  subCategoryForm._id = null
  subCategoryForm.name = ''
  subCategoryForm.description = ''
  subCategoryForm.sort = 0
  
  if (subCategoryFormRef.value) {
    subCategoryFormRef.value.clearValidate()
  }
}

// 关闭对话框
const handleCategoryDialogClose = () => {
  resetCategoryForm()
}

const handleSubCategoryDialogClose = () => {
  resetSubCategoryForm()
}

onMounted(async () => {
  await initData()
})
</script>

<style scoped>
.record-type-settings {
  width: 100%;
  max-width: 100%;
  padding: 20px;
  background-color: transparent;
  box-sizing: border-box;
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

/* 主要内容区域 */
.content-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  height: calc(100vh - 220px);
  min-height: 500px;
  max-height: 800px;
}

/* 面板通用样式 */
.category-panel,
.subcategory-panel {
  background: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 1px 2px 0 rgba(31, 35, 41, 0.08);
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafbfc;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-category {
  color: #409eff;
  font-size: 12px;
  background: #f0f9ff;
  padding: 4px 8px;
  border-radius: 4px;
}

.item-count {
  color: #86909c;
  font-size: 12px;
  background: #f2f3f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

/* 搜索框样式 */
.search-box {
  padding: 8px 16px;
  border-bottom: 1px solid #f0f2f5;
  background: white;
}

/* 大类列表 */
.category-list,
.subcategory-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  max-height: calc(100vh - 320px);
  min-height: 400px;
}

/* 自定义滚动条样式 */
.category-list::-webkit-scrollbar,
.subcategory-list::-webkit-scrollbar {
  width: 6px;
}

.category-list::-webkit-scrollbar-track,
.subcategory-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.category-list::-webkit-scrollbar-thumb,
.subcategory-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.category-list::-webkit-scrollbar-thumb:hover,
.subcategory-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.category-item,
.subcategory-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 6px;
  border: 1px solid #f0f2f5;
  transition: all 0.3s ease;
  cursor: pointer;
  background: white;
  position: relative;
}

/* 添加阴影效果 */
.category-item::before,
.subcategory-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.category-item:hover,
.subcategory-item:hover {
  border-color: #409eff;
  background-color: #f8f9fa;
  transform: translateY(-1px);
}

.category-item:hover::before,
.subcategory-item:hover::before {
  opacity: 1;
}

.category-item.active {
  border-color: #409eff;
  background-color: #f0f9ff;
  transform: translateY(-1px);
}

.category-item.active::before {
  opacity: 1;
}

.category-info,
.subcategory-info {
  flex: 1;
}

.category-name,
.subcategory-name {
  font-weight: 500;
  color: #1f2329;
  margin-bottom: 4px;
}

.category-desc,
.subcategory-desc {
  font-size: 12px;
  color: #86909c;
}

.category-actions,
.subcategory-actions {
  display: flex;
  gap: 8px;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.category-item:hover .category-actions,
.subcategory-item:hover .subcategory-actions {
  opacity: 1;
}

/* 空状态 */
.empty-state,
.no-selection {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

/* 对话框脚注 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .content-container {
    grid-template-columns: 1fr;
    gap: 16px;
    height: auto;
    max-height: none;
  }

  .category-panel,
  .subcategory-panel {
    min-height: 350px;
    max-height: 500px;
  }

  .category-list,
  .subcategory-list {
    max-height: 400px;
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .record-type-settings {
    padding: 12px;
  }

  .action-card {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .action-left,
  .action-right {
    justify-content: center;
  }

  .content-container {
    height: calc(100vh - 180px);
    min-height: 400px;
  }

  .category-panel,
  .subcategory-panel {
    min-height: 300px;
    max-height: 400px;
  }

  .category-list,
  .subcategory-list {
    max-height: 250px;
    min-height: 200px;
  }

  .panel-header {
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>

