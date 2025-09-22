<template>
  <div class="role-permissions-manager">
    <!-- 操作栏 -->
    <div class="permissions-header">
      <div class="header-left">
        <span class="header-title">权限配置</span>
        <el-tag type="info" size="small">
          已选择 {{ selectedPermissions.length }} 个权限
        </el-tag>
      </div>
      <div class="header-actions">
        <el-button size="small" @click="selectAll" type="primary">
          {{ isAllPermissionsSelected ? '反选' : '全选' }}
        </el-button>
        <el-button size="small" @click="toggleExpandAll">
          {{ isAllExpanded ? '全部收起' : '全部展开' }}
        </el-button>
      </div>
    </div>

    <!-- 权限配置内容 -->
    <div class="permissions-content" v-loading="loading">
      <div v-if="!loading && categories.length === 0" class="empty-state">
        <el-empty description="暂无权限数据" />
      </div>

      <div
        v-for="category in categories"
        :key="category.name"
        class="permission-category"
      >
        <div class="category-header" @click="toggleCategory(category.name)">
          <div class="category-left">
            <el-checkbox
              :indeterminate="isIndeterminate(category)"
              :model-value="isAllSelected(category)"
              @change="handleCategoryChange(category, $event)"
              @click.stop
            />
            <span class="category-name">{{ category.name }}</span>
            <el-tag size="small" type="info">{{ getSelectedCount(category) }}/{{ category.permissions.length }}</el-tag>
          </div>
          <el-icon class="expand-icon" :class="{ expanded: expandedCategories.has(category.name) }">
            <CaretRight />
          </el-icon>
        </div>

        <el-collapse-transition>
          <div
            v-show="expandedCategories.has(category.name)"
            class="category-permissions"
          >
            <el-checkbox-group v-model="selectedPermissions">
              <div class="permissions-list">
                <el-checkbox
                  v-for="permission in category.permissions"
                  :key="permission.key"
                  :label="permission.key"
                  class="permission-item"
                >
                  {{ permission.label }}
                </el-checkbox>
              </div>
            </el-checkbox-group>
          </div>
        </el-collapse-transition>
      </div>
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
const expandedCategories = reactive(new Set())
const isAllExpanded = ref(false)

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

// 检查是否所有权限都被选中
const isAllPermissionsSelected = computed(() => {
  if (allPermissions.value.length === 0) return false
  const allKeys = allPermissions.value.map(p => p.key).filter(Boolean)
  return allKeys.length > 0 && allKeys.every(key => selectedPermissions.value.includes(key))
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

      // 默认收起所有分类
      expandedCategories.clear()
      isAllExpanded.value = false
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

// 全选/取消全选权限
const selectAll = () => {
  if (allPermissions.value.length === 0) {
    getPermissions()
    return
  }

  if (isAllPermissionsSelected.value) {
    // 如果已经全选，则取消全选
    emit('update:modelValue', [])
  } else {
    // 否则全选所有权限
    const allKeys = allPermissions.value.map(p => p.key).filter(Boolean)
    emit('update:modelValue', [...allKeys])
  }
}

const clearAll = () => {
  emit('update:modelValue', [])
}

// 展开/收起所有分类
const toggleExpandAll = () => {
  if (isAllExpanded.value) {
    // 收起所有
    expandedCategories.clear()
    isAllExpanded.value = false
  } else {
    // 展开所有
    categories.value.forEach(category => {
      expandedCategories.add(category.name)
    })
    isAllExpanded.value = true
  }
}



// 组件挂载时获取权限列表
onMounted(() => {
  getPermissions()
})
</script>

<style scoped>
.role-permissions-manager {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
  width: 100%;
}

/* 操作栏 */
.permissions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafbfc;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 权限配置内容 */
.permissions-content {
  max-height: 350px;
  overflow-y: auto;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.permission-category {
  border-bottom: 1px solid #f0f2f5;
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

.category-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.expand-icon {
  transition: transform 0.2s;
  color: #c0c4cc;
  font-size: 14px;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.category-permissions {
  padding: 8px 16px 16px 16px;
  background: #fafbfc;
}

.permissions-list {
  /* display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px 16px; */
  display: flex;
}

.permission-item {
  margin: 0 !important;
  padding: 6px 30px;
  font-size: 13px;
  line-height: 1.5;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .permissions-list {
    grid-template-columns: 1fr;
  }

  .permissions-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .header-actions .el-button {
    width: 100%;
  }

  .category-left {
    gap: 8px;
  }

  .category-name {
    font-size: 13px;
  }
}
</style>