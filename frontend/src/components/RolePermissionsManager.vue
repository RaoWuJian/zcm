<template>
  <div class="role-permissions-manager">
    <div class="permissions-header">
      <h3>权限配置</h3>
      <div class="permissions-actions">
        <el-button size="small" @click="selectAll">全选</el-button>
        <el-button size="small" @click="clearAll">清空</el-button>
        <el-button size="small" @click="toggleExpand">
          {{ isExpanded ? '收起' : '展开' }}
        </el-button>
      </div>
    </div>

    <div class="permissions-content" v-loading="loading">
      <div v-if="!loading && categories.length === 0" class="empty-state">
        <el-empty description="暂无权限数据" />
      </div>

      <div
        v-for="category in categories"
        :key="category.name"
        class="permission-category"
        :class="{ expanded: isExpanded }"
      >
        <div class="category-header" @click="toggleCategory(category.name)">
          <el-checkbox
            :indeterminate="isIndeterminate(category)"
            :model-value="isAllSelected(category)"
            @change="handleCategoryChange(category, $event)"
            @click.stop
          >
            <strong>{{ category.name }}</strong>
          </el-checkbox>
          <div class="category-info">
            <span class="permission-count">
              {{ getSelectedCount(category) }}/{{ category.permissions.length }}
            </span>
            <el-icon class="expand-icon" :class="{ expanded: expandedCategories.has(category.name) }">
              <CaretRight />
            </el-icon>
          </div>
        </div>

        <el-collapse-transition>
          <div
            v-show="expandedCategories.has(category.name)"
            class="category-permissions"
          >
            <el-checkbox-group v-model="selectedPermissions">
              <div class="permissions-grid">
                <el-checkbox
                  v-for="permission in category.permissions"
                  :key="permission.key"
                  :label="permission.key"
                  class="permission-item"
                >
                  <span class="permission-label">{{ permission.label }}</span>
                  <span class="permission-key">{{ permission.key }}</span>
                </el-checkbox>
              </div>
            </el-checkbox-group>
          </div>
        </el-collapse-transition>
      </div>
    </div>

    <!-- 权限统计 -->
    <div class="permissions-summary">
      <el-tag type="info">
        已选择 {{ selectedPermissions.length }} 个权限
      </el-tag>
    </div>
  </div>
</template>

<script setup >
import { ref, reactive, computed, onMounted } from 'vue'
import { CaretRight } from '@element-plus/icons-vue'
import { roleApi } from '@/api/index'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

// 组件状态
const loading = ref(false)
const isExpanded = ref(false)
const expandedCategories = reactive(new Set())

// 权限数据
const allPermissions = ref([])
const categories = ref([])

// 选中的权限（双向绑定）
const selectedPermissions = computed({
  get() {
    const val = props.modelValue
    return Array.isArray(val) ? val : []
  },
  set(value) {
    emit('update:modelValue', Array.isArray(value) ? value : [])
  }
})

// 获取权限列表
const getPermissions = async () => {
  loading.value = true
  try {
    const response = await roleApi.getAvailablePermissions()

    if (response.success && response.data !== undefined) {
      // 处理后端返回的数据结构: { data: { permissions: [...], categories: [...] } }
      const responseData = response.data
      const perms = responseData.permissions || []

      allPermissions.value = Array.isArray(perms) ? perms : []

      // 按分类组织权限
      const categoryMap = new Map()
      allPermissions.value.forEach(permission => {
        const cat = permission.category || '默认'
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, [])
        }
        categoryMap.get(cat).push(permission)
      })

      categories.value = Array.from(categoryMap.entries()).map(([name, permissions]) => ({
        name,
        permissions
      }))

      // 默认展开第一个分类
      if (categories.value.length > 0) {
        expandedCategories.add(categories.value[0].name)
      }
    } else {
    }
  } catch (error) {
    ElMessage.error('获取权限列表失败')
  } finally {
    loading.value = false
  }
}

// 分类权限管理方法
const isAllSelected = (category) => {
  return category.permissions.every(p => selectedPermissions.value.includes(p.key))
}

const isIndeterminate = (category) => {
  const selectedCount = category.permissions.filter(p => selectedPermissions.value.includes(p.key)).length
  return selectedCount > 0 && selectedCount < category.permissions.length
}

const getSelectedCount = (category) => {
  return category.permissions.filter(p => selectedPermissions.value.includes(p.key)).length
}

const handleCategoryChange = (category, checked) => {
  const currentPermissions = [...selectedPermissions.value]

  if (checked) {
    // 选中该分类下的所有权限
    category.permissions.forEach(permission => {
      if (!currentPermissions.includes(permission.key)) {
        currentPermissions.push(permission.key)
      }
    })
  } else {
    // 取消选中该分类下的所有权限
    const categoryKeys = category.permissions.map(p => p.key)
    const filteredPermissions = currentPermissions.filter(key => !categoryKeys.includes(key))
    currentPermissions.splice(0, currentPermissions.length, ...filteredPermissions)
  }

  // 直接通过 emit 更新父组件的值
  emit('update:modelValue', [...currentPermissions])
}

// 分类展开/收起
const toggleCategory = (categoryName) => {
  if (expandedCategories.has(categoryName)) {
    expandedCategories.delete(categoryName)
  } else {
    expandedCategories.add(categoryName)
  }
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    // 展开所有分类
    categories.value.forEach(category => {
      expandedCategories.add(category.name)
    })
  } else {
    // 收起所有分类
    expandedCategories.clear()
  }
}

// 全选/清空
const selectAll = () => {
  if (allPermissions.value.length === 0) {
    getPermissions()
    return
  }

  const allKeys = allPermissions.value.map(p => p.key).filter(Boolean)

  // 直接通过 emit 更新父组件的值
  emit('update:modelValue', [...allKeys])
}

const clearAll = () => {
  // 直接通过 emit 更新父组件的值
  emit('update:modelValue', [])
}



// 组件挂载时获取权限列表
onMounted(() => {
  getPermissions()
})
</script>

<style scoped>
.role-permissions-manager {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  width: 100%;
}

.permissions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.permissions-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.permissions-actions {
  display: flex;
  gap: 8px;
}

.permissions-content {
  max-height: 250px;
  overflow-y: auto;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.permission-category {
  border-bottom: 1px solid #f0f0f0;
}

.permission-category:last-child {
  border-bottom: none;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.category-header:hover {
  background-color: #f5f7fa;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.permission-count {
  font-size: 12px;
  color: #909399;
}

.expand-icon {
  transition: transform 0.2s;
  color: #c0c4cc;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.category-permissions {
  padding: 12px;
  background: #fafbfc;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 6px;
}

.permission-item {
  display: block !important;
  margin: 0 !important;
  padding: 4px 8px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fff;
  transition: all 0.2s;
  width: 100% !important;
  height: auto !important;
}

.permission-item:hover {
  border-color: #409eff;
  background: #f0f8ff;
}

.permission-label {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
  display: block;
  margin-bottom: 2px;
}

.permission-key {
  font-size: 11px;
  color: #909399;
  display: block;
}

.permissions-summary {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  background: #fafafa;
}

/* 重要：修复 checkbox 样式 */
:deep(.el-checkbox) {
  width: 100% !important;
  height: auto !important;
  margin: 0 !important;
}

:deep(.el-checkbox__input) {
  vertical-align: top !important;
  margin-top: 2px !important;
}

:deep(.el-checkbox__label) {
  display: block !important;
  width: 100% !important;
  padding-left: 8px !important;
  line-height: 1.4 !important;
}

:deep(.category-header .el-checkbox) {
  display: flex !important;
  align-items: center !important;
  width: auto !important;
}

:deep(.category-header .el-checkbox__label) {
  display: inline !important;
  width: auto !important;
  padding-left: 8px !important;
  line-height: 1 !important;
}

:deep(.category-header .el-checkbox__input) {
  margin-top: 0 !important;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .permissions-grid {
    grid-template-columns: 1fr;
  }

  .permissions-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .permissions-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .permissions-actions {
    flex-direction: column;
    width: 100%;
  }

  .permissions-actions .el-button {
    width: 100%;
  }
}
</style>