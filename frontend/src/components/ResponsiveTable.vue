<template>
  <div class="responsive-table-wrapper">
    <!-- 桌面端：使用标准表格 -->
    <el-table
      v-if="!isMobileDevice"
      v-bind="$attrs"
      :data="data"
      v-loading="loading"
      class="desktop-table"
    >
      <slot></slot>
    </el-table>

    <!-- 移动端：使用卡片列表 -->
    <div v-else class="mobile-card-list" v-loading="loading">
      <div
        v-for="(row, index) in data"
        :key="getRowKey(row, index)"
        class="mobile-card-item"
        @click="handleRowClick(row, index)"
      >
        <slot name="mobile-card" :row="row" :index="index">
          <!-- 默认移动端卡片布局 -->
          <div class="card-content">
            <div
              v-for="column in mobileColumns"
              :key="column.prop"
              class="card-field"
              :class="{ 'card-field-primary': column.primary }"
            >
              <span class="field-label">{{ column.label }}:</span>
              <span class="field-value">
                <slot :name="`mobile-${column.prop}`" :row="row">
                  {{ getFieldValue(row, column) }}
                </slot>
              </span>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div v-if="hasActions" class="card-actions">
            <slot name="mobile-actions" :row="row" :index="index"></slot>
          </div>
        </slot>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="!data || data.length === 0"
        :description="emptyText"
        :image-size="120"
      />
    </div>

    <!-- 移动端分页 -->
    <div v-if="isMobileDevice && showPagination" class="mobile-pagination">
      <el-pagination
        v-bind="paginationProps"
        layout="prev, pager, next"
        :small="true"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useResponsive } from '@/utils/responsive'

const props = defineProps({
  // 表格数据
  data: {
    type: Array,
    default: () => []
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 移动端显示的列配置
  mobileColumns: {
    type: Array,
    default: () => []
  },
  // 行唯一标识字段
  rowKey: {
    type: [String, Function],
    default: 'id'
  },
  // 是否有操作按钮
  hasActions: {
    type: Boolean,
    default: false
  },
  // 空数据提示文本
  emptyText: {
    type: String,
    default: '暂无数据'
  },
  // 是否显示分页
  showPagination: {
    type: Boolean,
    default: false
  },
  // 分页配置
  paginationProps: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['row-click'])

// 响应式检测
const { isMobileDevice } = useResponsive()

// 获取行唯一标识
const getRowKey = (row, index) => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }
  return row[props.rowKey] || index
}

// 获取字段值
const getFieldValue = (row, column) => {
  if (column.formatter) {
    return column.formatter(row, column, row[column.prop])
  }
  return row[column.prop] || '-'
}

// 行点击事件
const handleRowClick = (row, index) => {
  emit('row-click', row, index)
}
</script>

<style scoped>
.responsive-table-wrapper {
  width: 100%;
}

/* 桌面端表格样式 */
.desktop-table {
  width: 100%;
}

/* 移动端卡片列表 */
.mobile-card-list {
  width: 100%;
  padding: 0;
}

.mobile-card-item {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
}

.mobile-card-item:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

.mobile-card-item:last-child {
  margin-bottom: 0;
}

/* 卡片内容 */
.card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-field {
  display: flex;
  align-items: flex-start;
  font-size: 14px;
  line-height: 1.5;
}

.card-field-primary {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.field-label {
  flex-shrink: 0;
  color: #909399;
  margin-right: 8px;
  min-width: 70px;
}

.card-field-primary .field-label {
  color: #606266;
}

.field-value {
  flex: 1;
  color: #606266;
  word-break: break-all;
}

.card-field-primary .field-value {
  color: #303133;
  font-weight: 600;
}

/* 卡片操作按钮 */
.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  flex-wrap: wrap;
}

.card-actions :deep(.el-button) {
  flex: 1;
  min-width: 80px;
  margin: 0;
}

/* 移动端分页 */
.mobile-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.mobile-pagination :deep(.el-pagination) {
  justify-content: center;
}

/* 空状态 */
.mobile-card-list :deep(.el-empty) {
  padding: 40px 0;
}
</style>

